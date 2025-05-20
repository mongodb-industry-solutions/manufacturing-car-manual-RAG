from typing import List, Dict, Any, Optional, Union
import logging
import traceback
import time
from pymongo import MongoClient
from pymongo.errors import OperationFailure

from app.db.mongodb import get_mongodb
from app.core.config import get_settings
from app.models.chunks import Chunk
from app.models.search import SearchResult

logger = logging.getLogger(__name__)

# RRF constant for ranking
RRF_K_CONSTANT = 60

class SearchRepository:
    """Repository for performing advanced vector and text searches in MongoDB Atlas"""
    
    def __init__(self, debug_mode: bool = False):
        """Initialize the repository with MongoDB collection and settings"""
        self.settings = get_settings()
        self.mongodb = get_mongodb()
        self.debug_mode = debug_mode
        
        # MongoDB index names
        self.vector_index_name = self.settings.VECTOR_INDEX_NAME
        self.text_index_name = self.settings.TEXT_INDEX_NAME
        self.vector_field_name = self.settings.VECTOR_FIELD_NAME
        
        # Log the index names being used
        logger.info(f"Initializing SearchRepository with text_index_name: '{self.text_index_name}'")
        logger.info(f"Initializing SearchRepository with vector_index_name: '{self.vector_index_name}'")
        
        # Check if MongoDB connection is initialized
        if self.mongodb is not None:
            self.collection = self.mongodb.get_collection(self.settings.CHUNKS_COLLECTION)
            self.collection_name = self.settings.CHUNKS_COLLECTION
            # Use DATABASE_NAME as the primary attribute, with MONGODB_DB as fallback
            self.db_name = getattr(self.settings, "DATABASE_NAME", None) or getattr(self.settings, "MONGODB_DB", "car_manual")
            
            # Log the database and collection being used
            logger.info(f"Connected to database: '{self.db_name}', collection: '{self.collection_name}'")
            
            # Validate that the Atlas Search index exists
            try:
                # This won't check if the index actually exists (we'll only know when we try to use it),
                # but at least ensures the collection exists
                if self.collection is None:
                    logger.error(f"Collection '{self.collection_name}' not found or not accessible")
            except Exception as e:
                logger.error(f"Error validating collection access: {e}")
            
    def _get_common_projection(self, score_field_name: str = "searchScore") -> Dict[str, Any]:
        """Returns a common $project stage for search results"""
        return {
            "$project": {
                "_id": 0,
                "score": {"$meta": score_field_name},
                "chunk_id": "$id",
                "text": 1,
                "context": 1,
                "breadcrumb_trail": 1,
                "page_numbers": 1,
                "content_type": 1,
                "metadata": 1,
                "vehicle_systems": 1,
            }
        }
    
    async def vector_search(
        self, 
        query_embedding: List[float],
        limit: int = 5,
        num_candidates_multiplier: int = 10
    ) -> List[SearchResult]:
        """
        Performs a pure vector search using Atlas Vector Search
        
        Args:
            query_embedding: The embedding vector for the query
            limit: Maximum number of results to return
            num_candidates_multiplier: Multiplier for numCandidates parameter (limit * multiplier)
        
        Returns:
            List of search results ordered by vector similarity
        """
        # Make sure db_name and collection_name are set
        if not hasattr(self, 'db_name') or not self.db_name:
            self.db_name = getattr(self.settings, "DATABASE_NAME", "car_manual")
        if not hasattr(self, 'collection_name') or not self.collection_name:
            self.collection_name = self.settings.CHUNKS_COLLECTION
            
        debug_info = {} if self.debug_mode else None
        search_results = []
        
        if not query_embedding:
            logger.error("Error: Cannot run vector search without a query embedding.")
            return []
            
        # Check if collection is initialized
        if not hasattr(self, 'collection') or self.collection is None:
            logger.error("MongoDB collection is not available")
            return []
            
        try:
            # Calculate numCandidates based on multiplier
            num_candidates = limit * num_candidates_multiplier
            
            # Set up the vector search pipeline
            pipeline = [
                {
                    "$vectorSearch": {
                        "index": self.vector_index_name,
                        "path": self.vector_field_name,
                        "queryVector": query_embedding,
                        "numCandidates": num_candidates,
                        "limit": limit
                    }
                },
                self._get_common_projection("vectorSearchScore")
            ]
            
            if self.debug_mode:
                debug_info["pipeline"] = pipeline
                start_time = get_current_time()
                
            # Execute the pipeline
            results = list(self.collection.aggregate(pipeline))
            
            if self.debug_mode:
                debug_info["result_count"] = len(results)
                debug_info["execution_time_ms"] = (get_current_time() - start_time) * 1000
                
            logger.info(f"Vector Search: Found {len(results)} results.")
            
            # Process results into SearchResult objects
            for result in results:
                search_result = SearchResult(
                    score=result.get("score", 0.0),
                    vector_score=result.get("score", 0.0),
                    chunk_id=result.get("chunk_id"),
                    text=result.get("text", ""),
                    context=result.get("context"),
                    breadcrumb_trail=result.get("breadcrumb_trail"),
                    page_numbers=result.get("page_numbers"),
                    content_type=result.get("content_type"),
                    metadata=result.get("metadata"),
                    vehicle_systems=result.get("vehicle_systems")
                )
                search_results.append(search_result)
                
            return search_results
            
        except OperationFailure as ofe:
            logger.error(f"Vector Search OperationFailure: {ofe.details}")
            if "Unrecognized pipeline stage" in str(ofe.details):
                logger.error("  -> Hint: Ensure your MongoDB Atlas version supports $vectorSearch.")
            elif "index not found" in str(ofe.details):
                logger.error(f"  -> Hint: Ensure the vector index '{self.vector_index_name}' exists.")
            if self.debug_mode:
                debug_info["error"] = str(ofe.details)
            return []
        except Exception as e:
            logger.error(f"Error in vector search: {str(e)}")
            traceback.print_exc()
            if self.debug_mode:
                debug_info["error"] = str(e)
            return []
    
    async def text_search(
        self, 
        query_text: str,
        limit: int = 5,
        fuzzy: bool = True,
        max_edits: int = 1
    ) -> List[SearchResult]:
        """
        Performs a standard text search using Atlas Search
        
        Args:
            query_text: The text query to search for
            limit: Maximum number of results to return
            fuzzy: Whether to use fuzzy matching
            max_edits: Maximum edit distance for fuzzy matching (0-2)
        
        Returns:
            List of search results ordered by text relevance
        """
        # Make sure db_name and collection_name are set
        if not hasattr(self, 'db_name') or not self.db_name:
            self.db_name = getattr(self.settings, "DATABASE_NAME", "car_manual")
        if not hasattr(self, 'collection_name') or not self.collection_name:
            self.collection_name = self.settings.CHUNKS_COLLECTION
            
        debug_info = {} if self.debug_mode else None
        search_results = []
        
        # Check if collection is initialized
        if not hasattr(self, 'collection') or self.collection is None:
            logger.error("MongoDB collection is not available")
            return []
            
        try:
            logger.info(f"Performing Atlas Search with index: {self.text_index_name}")
            
            # Set up fuzzy options if enabled
            fuzzy_options = {"maxEdits": max_edits, "prefixLength": 3} if fuzzy else None
            
            # Build the search pipeline with compound operator for better results
            text_search_config = {
                "query": query_text,
                "path": ["text", "context", "breadcrumb_trail"]
            }
            
            # Add fuzzy options if enabled
            if fuzzy and fuzzy_options:
                text_search_config["fuzzy"] = fuzzy_options
                
            pipeline = [
                {
                    "$search": {
                        "index": self.text_index_name,
                        "text": text_search_config
                    }
                },
                {"$limit": limit},
                self._get_common_projection("searchScore")
            ]
            
            if self.debug_mode:
                debug_info["pipeline"] = pipeline
                start_time = get_current_time()
                
            # Execute the pipeline
            results = list(self.collection.aggregate(pipeline))
            
            if self.debug_mode:
                debug_info["result_count"] = len(results)
                debug_info["execution_time_ms"] = (get_current_time() - start_time) * 1000
                
            logger.info(f"Atlas Text Search: Found {len(results)} results for query '{query_text}'")
            
            # Process results into SearchResult objects
            for result in results:
                search_result = SearchResult(
                    score=result.get("score", 0.0),
                    text_score=result.get("score", 0.0),
                    chunk_id=result.get("chunk_id"),
                    text=result.get("text", ""),
                    context=result.get("context"),
                    breadcrumb_trail=result.get("breadcrumb_trail"),
                    page_numbers=result.get("page_numbers"),
                    content_type=result.get("content_type"),
                    metadata=result.get("metadata"),
                    vehicle_systems=result.get("vehicle_systems")
                )
                search_results.append(search_result)
                
            return search_results
                
        except OperationFailure as ofe:
            # Provide detailed error information
            error_message = f"Atlas Text Search operation failed: {ofe.details}"
            logger.error(error_message)
            
            if "index not found" in str(ofe.details):
                logger.error(f"The Atlas Search index '{self.text_index_name}' was not found.")
                logger.error(f"Please verify that you have created the index with the exact name '{self.text_index_name}' in your MongoDB Atlas cluster.")
                logger.error("Index definition should include text fields: 'text', 'context', and 'breadcrumb_trail'.")
                
            elif "Unrecognized pipeline stage" in str(ofe.details):
                logger.error("The $search pipeline stage is not recognized.")
                logger.error("This typically means your MongoDB instance does not support Atlas Search.")
                logger.error("Ensure you are using MongoDB Atlas (not a standalone MongoDB instance) with Atlas Search enabled.")
                
            if self.debug_mode:
                debug_info["error"] = str(ofe.details)
                debug_info["text_index_name"] = self.text_index_name
                debug_info["collection_name"] = self.collection_name
                
            return []
            
        except Exception as e:
            logger.error(f"Error in text search: {str(e)}")
            traceback.print_exc()
            
            if self.debug_mode:
                debug_info["error"] = str(e)
                debug_info["text_index_name"] = self.text_index_name
                debug_info["collection_name"] = self.collection_name
                
            return []
    
    async def hybrid_search_rrf(
        self,
        query_text: str,
        query_embedding: List[float],
        limit: int = 5,
        vector_weight: float = 0.5,
        text_weight: float = 0.5,
        num_candidates_multiplier: int = 15,
        rrf_k: int = RRF_K_CONSTANT
    ) -> List[SearchResult]:
        """
        Performs hybrid search using an explicit RRF calculation pipeline
        
        Args:
            query_text: The user's search query
            query_embedding: Pre-computed embedding for the query
            limit: Maximum number of results to return
            vector_weight: Weight applied to vector search RRF score component
            text_weight: Weight applied to text search RRF score component
            num_candidates_multiplier: Multiplier for the number of candidates
            rrf_k: RRF constant for rank fusion formula
            
        Returns:
            List of search results ordered by combined RRF score
        """
        # Make sure db_name and collection_name are set
        if not hasattr(self, 'db_name') or not self.db_name:
            self.db_name = getattr(self.settings, "DATABASE_NAME", "car_manual")
        if not hasattr(self, 'collection_name') or not self.collection_name:
            self.collection_name = self.settings.CHUNKS_COLLECTION
            
        debug_info = {} if self.debug_mode else None
        search_results = []
        
        if not query_embedding:
            logger.error("Error: Cannot run hybrid search without a query embedding.")
            return []
            
        # Check if collection is initialized
        if not hasattr(self, 'collection') or self.collection is None:
            logger.error("MongoDB collection is not available")
            return []
            
        try:
            # Calculate parameters
            num_candidates = limit * num_candidates_multiplier
            intermediate_limit = limit * 2  # Fetch more results for ranking robustness
            
            # --- Define the Vector Search Branch Pipeline ---
            vector_search_pipeline = [
                {
                    "$vectorSearch": {
                        "index": self.vector_index_name,
                        "path": self.vector_field_name,
                        "queryVector": query_embedding,
                        "numCandidates": num_candidates,
                        "limit": intermediate_limit
                    }
                },
                # Group results to calculate rank within this branch
                {"$group": {"_id": None, "docs": {"$push": "$$ROOT"}}},
                # Unwind to add rank
                {"$unwind": {"path": "$docs", "includeArrayIndex": "rank"}},
                # Calculate RRF score component for vector search
                {
                    "$addFields": {
                        "vs_score": {
                            "$multiply": [
                                vector_weight,
                                {"$divide": [1.0, {"$add": ["$rank", rrf_k]}]}
                            ]
                        }
                    }
                },
                # Project only necessary fields from this branch
                {
                    "$project": {
                        "_id": "$docs._id",
                        "vs_score": 1,
                        "chunk_id": "$docs.id",
                        "text": "$docs.text",
                        "context": "$docs.context",
                        "breadcrumb_trail": "$docs.breadcrumb_trail",
                        "page_numbers": "$docs.page_numbers",
                        "content_type": "$docs.content_type",
                        "metadata": "$docs.metadata",
                        "vehicle_systems": "$docs.vehicle_systems",
                    }
                }
            ]
            
            # --- Define the Text Search Branch Pipeline ---
            text_search_pipeline = [
                {
                    "$search": {
                        "index": self.text_index_name,
                        "text": {
                            "query": query_text,
                            "path": ["text", "context", "breadcrumb_trail"],
                            "fuzzy": {"maxEdits": 1, "prefixLength": 3}
                        }
                    }
                },
                {"$limit": intermediate_limit},
                # Group results to calculate rank within this branch
                {"$group": {"_id": None, "docs": {"$push": "$$ROOT"}}},
                # Unwind to add rank
                {"$unwind": {"path": "$docs", "includeArrayIndex": "rank"}},
                # Calculate RRF score component for text search
                {
                    "$addFields": {
                        "fts_score": {
                            "$multiply": [
                                text_weight,
                                {"$divide": [1.0, {"$add": ["$rank", rrf_k]}]}
                            ]
                        }
                    }
                },
                # Project only necessary fields from this branch
                {
                    "$project": {
                        "_id": "$docs._id",
                        "fts_score": 1,
                        "chunk_id": "$docs.id",
                        "text": "$docs.text",
                        "context": "$docs.context",
                        "breadcrumb_trail": "$docs.breadcrumb_trail",
                        "page_numbers": "$docs.page_numbers",
                        "content_type": "$docs.content_type",
                        "metadata": "$docs.metadata",
                        "vehicle_systems": "$docs.vehicle_systems",
                    }
                }
            ]
            
            # --- Combine using $unionWith and Final Aggregation ---
            final_pipeline = vector_search_pipeline + [
                # Union the text search results
                {
                    "$unionWith": {
                        "coll": getattr(self, 'collection_name', self.settings.CHUNKS_COLLECTION),
                        "pipeline": text_search_pipeline
                    }
                },
                # Group by original document ID (_id) to combine scores
                {
                    "$group": {
                        "_id": "$_id",
                        "chunk_id": {"$first": "$chunk_id"},
                        "text": {"$first": "$text"},
                        "context": {"$first": "$context"},
                        "breadcrumb_trail": {"$first": "$breadcrumb_trail"},
                        "page_numbers": {"$first": "$page_numbers"},
                        "content_type": {"$first": "$content_type"},
                        "metadata": {"$first": "$metadata"},
                        "vehicle_systems": {"$first": "$vehicle_systems"},
                        "vs_score": {"$max": "$vs_score"},
                        "fts_score": {"$max": "$fts_score"}
                    }
                },
                # Handle cases where a doc was only in one result set
                {
                    "$project": {
                        "chunk_id": 1,
                        "text": 1,
                        "context": 1,
                        "breadcrumb_trail": 1,
                        "page_numbers": 1,
                        "content_type": 1,
                        "metadata": 1,
                        "vehicle_systems": 1,
                        "vs_score": {"$ifNull": ["$vs_score", 0.0]},
                        "fts_score": {"$ifNull": ["$fts_score", 0.0]}
                    }
                },
                # Simplify scoring completely - sum the scores and scale to 0-100
                {
                    "$addFields": {
                        # Save raw score for debugging
                        "raw_score": {"$add": ["$fts_score", "$vs_score"]},
                        
                        # Create a simple score in 0-100 range by multiplying
                        # The typical RRF score range is very small (0.01-0.03), so multiply by 3000
                        # to get scores in 30-90 range
                        "score": {"$multiply": [{"$add": ["$fts_score", "$vs_score"]}, 3000]}
                    }
                },
                # Sort by the score (descending)
                {"$sort": {"score": -1}},
                # Apply limit 
                {"$limit": limit},
                # Cap max score at 100
                {
                    "$addFields": {
                        "score": {"$min": [100, "$score"]}
                    }
                }
            ]
            
            if self.debug_mode:
                debug_info["pipeline"] = final_pipeline
                start_time = get_current_time()
                
            # Execute the full pipeline
            results = list(self.collection.aggregate(final_pipeline))
            
            if self.debug_mode:
                debug_info["result_count"] = len(results)
                debug_info["execution_time_ms"] = (get_current_time() - start_time) * 1000
                
            logger.info(f"Hybrid Explicit RRF Search (k={rrf_k}, vec_w={vector_weight:.2f}, txt_w={text_weight:.2f}): Found {len(results)} results.")
            
            # Process results into SearchResult objects
            for result in results:
                # Ensure score is properly rounded for consistency
                score = round(result.get("score", 0.0), 0)  # Round to nearest whole number
                
                # Create helpful debug info for logging
                logger.info(f"Result: score={score}, raw_score={result.get('raw_score', 0.0):.6f}, " +
                            f"vs_score={result.get('vs_score', 0.0):.6f}, " +
                            f"fts_score={result.get('fts_score', 0.0):.6f}")
                
                search_result = SearchResult(
                    score=score,
                    vector_score=result.get("vs_score", 0.0),  # Keep original raw scores
                    text_score=result.get("fts_score", 0.0),   # Keep original raw scores
                    raw_score=result.get("raw_score", 0.0),    # Include raw score for debugging
                    chunk_id=result.get("chunk_id"),
                    text=result.get("text", ""),
                    context=result.get("context"),
                    breadcrumb_trail=result.get("breadcrumb_trail"),
                    page_numbers=result.get("page_numbers"),
                    content_type=result.get("content_type"),
                    metadata=result.get("metadata"),
                    vehicle_systems=result.get("vehicle_systems")
                )
                search_results.append(search_result)
                
            return search_results
            
        except OperationFailure as ofe:
            logger.error(f"Hybrid Search OperationFailure: {ofe.details}")
            if "Unrecognized pipeline stage" in str(ofe.details):
                logger.error("  -> Hint: Ensure your MongoDB Atlas version supports the pipeline stages used.")
            elif "index not found" in str(ofe.details):
                logger.error(f"  -> Hint: Ensure both indexes '{self.vector_index_name}' and '{self.text_index_name}' exist.")
            if self.debug_mode:
                debug_info["error"] = str(ofe.details)
            return []
        except Exception as e:
            logger.error(f"Error in hybrid search: {str(e)}")
            traceback.print_exc()
            if self.debug_mode:
                debug_info["error"] = str(e)
            return []

# Helper function for timing
def get_current_time():
    """Return the current time"""
    return time.time()