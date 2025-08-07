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
                "vehicle_systems": 1
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
        Performs enhanced text search using Atlas Search compound query
        with phrase, exact text, and fuzzy matching operators with boost values
        
        Args:
            query_text: The text query to search for
            limit: Maximum number of results to return
            fuzzy: Whether to use fuzzy matching
            max_edits: Maximum edit distance for fuzzy matching (0-2)
        
        Returns:
            List of search results ordered by text relevance with improved scoring
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
            logger.info(f"Performing Enhanced Atlas Search with compound query using index: {self.text_index_name}")
            
            # Set up fuzzy options if enabled
            fuzzy_options = {"maxEdits": max_edits, "prefixLength": 3} if fuzzy else None
            
            # Build compound should clauses with boost values for prioritized matching
            compound_should_clauses = [
                # Part 1: Exact phrase matching (highest priority)
                # Finds documents containing the exact phrase - most relevant results
                {"phrase": {"query": query_text, "path": "breadcrumb_trail", "score": {"boost": {"value": 10}}}},
                {"phrase": {"query": query_text, "path": "text", "score": {"boost": {"value": 8}}}},
                
                # Part 2: Individual word matching (medium priority)
                # Finds documents containing all words individually - good relevance
                {"text": {"query": query_text, "path": "breadcrumb_trail", "score": {"boost": {"value": 5}}}},
                {"text": {"query": query_text, "path": "text", "score": {"boost": {"value": 4}}}},
            ]
            
            # Part 3: Add fuzzy operators if enabled (lowest priority)
            # Catches typos and similar words - ensures recall
            if fuzzy and fuzzy_options:
                compound_should_clauses.extend([
                    {"text": {"query": query_text, "path": "breadcrumb_trail", "fuzzy": fuzzy_options, "score": {"boost": {"value": 2}}}},
                    {"text": {"query": query_text, "path": "text", "fuzzy": fuzzy_options, "score": {"boost": {"value": 1.5}}}},
                ])
                
            pipeline = [
                {
                    "$search": {
                        "index": self.text_index_name,
                        "compound": {
                            "should": compound_should_clauses
                        }
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
                
            logger.info(f"Enhanced Atlas Text Search (compound query): Found {len(results)} results for query '{query_text}'")
            
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
        use_native_rankfusion: bool = True
    ) -> List[SearchResult]:
        """
        Performs hybrid search using MongoDB's native $rankFusion aggregation stage
        
        Args:
            query_text: The user's search query
            query_embedding: Pre-computed embedding for the query
            limit: Maximum number of results to return
            vector_weight: Weight applied to vector search component
            text_weight: Weight applied to text search component
            num_candidates_multiplier: Multiplier for the number of candidates
            
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
            
            # --- Define the Vector Search Pipeline ---
            vector_search_pipeline = [
                {
                    "$vectorSearch": {
                        "index": self.vector_index_name,
                        "path": self.vector_field_name,
                        "queryVector": query_embedding,
                        "numCandidates": num_candidates,
                        "limit": intermediate_limit
                    }
                }
            ]
            
            # --- Define the Text Search Pipeline with compound query ---
            text_search_pipeline = [
                {
                    "$search": {
                        "index": self.text_index_name,
                        "compound": {
                            "should": [
                                # Exact phrase matching (highest priority)
                                {"phrase": {"query": query_text, "path": "breadcrumb_trail", "score": {"boost": {"value": 10}}}},
                                {"phrase": {"query": query_text, "path": "text", "score": {"boost": {"value": 8}}}},
                                
                                # Individual word matching (medium priority)
                                {"text": {"query": query_text, "path": "breadcrumb_trail", "score": {"boost": {"value": 5}}}},
                                {"text": {"query": query_text, "path": "text", "score": {"boost": {"value": 4}}}},
                                
                                # Fuzzy matching (lowest priority)
                                {"text": {"query": query_text, "path": "breadcrumb_trail", "fuzzy": {"maxEdits": 1, "prefixLength": 3}, "score": {"boost": {"value": 2}}}},
                                {"text": {"query": query_text, "path": "text", "fuzzy": {"maxEdits": 1, "prefixLength": 3}, "score": {"boost": {"value": 1.5}}}}
                            ]
                        }
                    }
                }
            ]
            
            # --- Use $rankFusion to combine the pipelines ---
            rank_fusion_pipeline = [
                {
                    "$rankFusion": {
                        "input": {
                            "pipelines": {
                                "vectorPipeline": vector_search_pipeline,
                                "fullTextPipeline": text_search_pipeline
                            }
                        },
                        "combination": {
                            "weights": {
                                "vectorPipeline": vector_weight,
                                "fullTextPipeline": text_weight
                            }
                        },
                        "scoreDetails": True
                    }
                },
                {"$limit": limit},
                # Extract scoreDetails from $rankFusion metadata
                {
                    "$addFields": {
                        "scoreDetails": {"$meta": "scoreDetails"}
                    }
                },
                # Extract individual pipeline details
                {
                    "$addFields": {
                        "vs_score_details": {
                            "$arrayElemAt": [
                                {
                                    "$filter": {
                                        "input": "$scoreDetails.details",
                                        "as": "item",
                                        "cond": {
                                            "$eq": [
                                                "$$item.inputPipelineName",
                                                "vectorPipeline"
                                            ]
                                        }
                                    }
                                },
                                0
                            ]
                        },
                        "fts_score_details": {
                            "$arrayElemAt": [
                                {
                                    "$filter": {
                                        "input": "$scoreDetails.details",
                                        "as": "item",
                                        "cond": {
                                            "$eq": [
                                                "$$item.inputPipelineName",
                                                "fullTextPipeline"
                                            ]
                                        }
                                    }
                                },
                                0
                            ]
                        },
                        "score": "$scoreDetails.value"
                    }
                },
                # Calculate RRF contribution scores
                {
                    "$addFields": {
                        "vs_score": {
                            "$cond": [
                                {
                                    "$and": [
                                        {"$ifNull": ["$vs_score_details", False]},
                                        {"$ne": ["$vs_score_details.rank", 0]}
                                    ]
                                },
                                {
                                    "$multiply": [
                                        "$vs_score_details.weight",
                                        {
                                            "$divide": [
                                                1,
                                                {"$add": [60, "$vs_score_details.rank"]}
                                            ]
                                        }
                                    ]
                                },
                                0
                            ]
                        },
                        "fts_score": {
                            "$cond": [
                                {
                                    "$and": [
                                        {"$ifNull": ["$fts_score_details", False]},
                                        {"$ne": ["$fts_score_details.rank", 0]}
                                    ]
                                },
                                {
                                    "$multiply": [
                                        "$fts_score_details.weight",
                                        {
                                            "$divide": [
                                                1,
                                                {"$add": [60, "$fts_score_details.rank"]}
                                            ]
                                        }
                                    ]
                                },
                                0
                            ]
                        }
                    }
                },
                # Project fields for SearchResult compatibility
                {
                    "$project": {
                        "_id": 0,
                        "score": 1,
                        "vs_score": 1,
                        "fts_score": 1,
                        "scoreDetails": 1,
                        "chunk_id": "$id",
                        "text": 1,
                        "context": 1,
                        "breadcrumb_trail": 1,
                        "page_numbers": 1,
                        "content_type": 1,
                        "metadata": 1,
                        "vehicle_systems": 1
                    }
                }
            ]
            
            if self.debug_mode:
                debug_info["pipeline"] = rank_fusion_pipeline
                start_time = get_current_time()
                
            # Execute the $rankFusion pipeline
            results = list(self.collection.aggregate(rank_fusion_pipeline))
            
            if self.debug_mode:
                debug_info["result_count"] = len(results)
                debug_info["execution_time_ms"] = (get_current_time() - start_time) * 1000
                
            logger.info(f"Hybrid $rankFusion Search (vec_w={vector_weight:.2f}, txt_w={text_weight:.2f}): Found {len(results)} results.")
            
            # Process results into SearchResult objects
            for result in results:
                # Get the main rankFusion score (no rounding, keep raw)
                score = result.get("score", 0.0)
                
                # Get the RRF contribution scores (calculated in pipeline)
                vector_score = result.get("vs_score", 0.0)
                text_score = result.get("fts_score", 0.0)
                
                # Create helpful debug info for logging
                logger.info(f"Result: score={score:.6f}, " +
                            f"vs_score={vector_score:.6f}, " +
                            f"fts_score={text_score:.6f}")
                logger.info(f"  Verification: vs_score + fts_score = {vector_score + text_score:.6f}")
                
                search_result = SearchResult(
                    score=score,
                    vector_score=vector_score,
                    text_score=text_score,
                    raw_score=score,
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
                if "$rankFusion" in str(ofe.details):
                    logger.error("  -> Hint: $rankFusion requires MongoDB 6.0+ and Atlas Search. Ensure your MongoDB Atlas version supports $rankFusion.")
                else:
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