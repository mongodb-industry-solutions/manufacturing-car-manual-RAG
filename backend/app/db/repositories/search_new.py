from typing import List, Dict, Any, Optional, Union
import logging
import traceback
import time
from pymongo import MongoClient
from pymongo.errors import OperationFailure

from app.db.mongodb import get_mongodb
from app.core.config import get_settings
from app.models.chunks import Chunk
from app.models.search import SearchResult, KnowledgeGraphResponse, CytoscapeNode, CytoscapeEdge

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
        self.last_debug_info = None  # Store debug info from last search
        
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
                "heading_level_1": 1,
                "heading_level_2": 1,
                "heading_level_3": 1
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

    async def vector_to_graph_search(
        self,
        query_text: str,
        query_embedding: List[float], 
        max_depth: int = 2,
        limit: int = 30,
        relationship_types: Optional[List[str]] = None
    ) -> List[SearchResult]:
        """
        Hybrid Graph Search using $vectorSearch + $graphLookup
        
        Performs semantic vector search to find initial seed documents,
        then expands through document relationships using $graphLookup.
        Combines the power of vector similarity with graph traversal.
        """
        
        debug_info = {} if self.debug_mode else None
        
        if not query_embedding:
            logger.error("Error: Cannot run vector-to-graph search without a query embedding.")
            return []
            
        # Check if collection is initialized
        if not hasattr(self, 'collection') or self.collection is None:
            logger.error("MongoDB collection is not available")
            return []
            
        try:
            debug_info = {} if self.debug_mode else None
            
            # IMPROVED PIPELINE: Guarantees exactly 5 seed results
            # Uses $facet immediately after vector search to preserve seeds separately
            vector_seed_pipeline = [
                # Step 1: Vector search for top 5 semantic matches
                {
                    "$vectorSearch": {
                        "index": self.vector_index_name,
                        "path": self.vector_field_name,
                        "queryVector": query_embedding,
                        "numCandidates": 50,
                        "limit": 5  # Get exactly 5 seed documents
                    }
                },
                # Step 2: Use $facet to split into two parallel processing paths
                {
                    "$facet": {
                        # Path A: Preserve original 5 seeds exactly as-is
                        "seeds": [
                            {
                                "$addFields": {
                                    "source": "vector_seed",
                                    "depth": 0,
                                    "score": {"$meta": "vectorSearchScore"},
                                    "seed_id": "$id"  # Track seed IDs for exclusion
                                }
                            },
                            {
                                "$project": {
                                    "_id": 0,
                                    "score": 1,
                                    "chunk_id": "$id",
                                    "text": 1,
                                    "context": 1,
                                    "breadcrumb_trail": 1,
                                    "page_numbers": 1,
                                    "content_type": 1,
                                    "metadata": 1,
                                    "vehicle_systems": 1,
                                    "heading_level_1": 1,
                                    "heading_level_2": 1,
                                    "heading_level_3": 1,
                                    "source": 1,
                                    "depth": 1,
                                    "seed_id": 1
                                }
                            }
                        ],
                        # Path B: Graph expansion from seeds
                        "expansion": [
                            # Store original seed IDs for later exclusion
                            {
                                "$group": {
                                    "_id": None,
                                    "seed_ids": {"$push": "$id"},
                                    "seed_docs": {"$push": "$$ROOT"}
                                }
                            },
                            {"$unwind": "$seed_docs"},
                            {"$replaceRoot": {"newRoot": "$seed_docs"}},
                            # Perform $graphLookup from each seed
                {
                    "$graphLookup": {
                        "from": self.collection_name,
                        "startWith": "$relationships.target_id",
                        "connectFromField": "relationships.target_id", 
                        "connectToField": "id",
                                    "as": "graph_neighbors",
                        "maxDepth": max_depth,
                        "restrictSearchWithMatch": self._build_relationship_filter(relationship_types),
                        "depthField": "traversal_depth"
                    }
                },
                            # Extract just the neighbors
                            {
                                "$project": {
                                    "seed_ids": {"$literal": []},  # Will be populated later
                                    "neighbors": "$graph_neighbors"
                                }
                            },
                            {"$unwind": "$neighbors"},
                            {"$replaceRoot": {"newRoot": "$neighbors"}},
                            # Add metadata to each neighbor (AFTER replaceRoot so we're working with flattened doc)
                            {
                                "$addFields": {
                                    "source": "graph_expansion",
                                    # Add 1 to traversal_depth because $graphLookup uses 0-based indexing:
                                    # - traversal_depth=0 → depth=1 (1-hop neighbors)
                                    # - traversal_depth=1 → depth=2 (2-hop neighbors)
                                    # This ensures expanded results have depth > 0 (vs seeds with depth=0)
                                    "depth": {
                                        "$add": [{"$ifNull": ["$traversal_depth", 0]}, 1]
                                    },
                                    "score": {
                                        "$subtract": [
                                            0.5,
                                            {"$multiply": [0.1, {"$add": [{"$ifNull": ["$traversal_depth", 0]}, 1]}]}
                                        ]
                                    }
                                }
                            },
                            # Deduplicate expanded results by ID
                            {
                                "$group": {
                                    "_id": "$id",
                                    "doc": {"$first": "$$ROOT"},
                                    "max_score": {"$max": "$score"},
                                    "min_depth": {"$min": "$depth"}
                                }
                            },
                            # Project to match seed structure
                            {
                                "$project": {
                                    "_id": 0,
                                    "score": "$max_score",
                                    "chunk_id": "$_id",
                                    "text": "$doc.text",
                                    "context": "$doc.context",
                                    "breadcrumb_trail": "$doc.breadcrumb_trail",
                                    "page_numbers": "$doc.page_numbers",
                                    "content_type": "$doc.content_type",
                                    "metadata": "$doc.metadata",
                                    "vehicle_systems": "$doc.vehicle_systems",
                                    "heading_level_1": "$doc.heading_level_1",
                                    "heading_level_2": "$doc.heading_level_2",
                                    "heading_level_3": "$doc.heading_level_3",
                                    "source": "$doc.source",  # Use source from document (set by $addFields)
                                    "depth": "$min_depth"
                                }
                            },
                            # Sort by score and depth
                            {"$sort": {"score": -1, "depth": 1}},
                            {"$limit": limit * 2}  # Get more candidates than needed
                        ]
                    }
                },
                # Step 3: Process facet results
                {
                    "$project": {
                        "seeds": 1,
                        "expansion": 1,
                        "seed_ids": {
                                    "$map": {
                                "input": "$seeds",
                                "as": "seed",
                                "in": "$$seed.chunk_id"
                            }
                        }
                    }
                },
                # Step 4: Filter expansion to exclude any seed IDs (prevent duplicates)
                {
                    "$project": {
                        "seeds": 1,
                        "filtered_expansion": {
                            "$filter": {
                                "input": "$expansion",
                                "as": "exp",
                                "cond": {
                                    "$not": {"$in": ["$$exp.chunk_id", "$seed_ids"]}
                                }
                            }
                        }
                    }
                },
                # Step 5: Limit expanded results
                {
                    "$project": {
                        "seeds": 1,
                        "filtered_expansion": {"$slice": ["$filtered_expansion", limit - 5]}
                    }
                },
                # Step 6: Combine seeds (always 5) + filtered expansion
                {
                    "$project": {
                        "combined": {
                            "$concatArrays": ["$seeds", "$filtered_expansion"]
                        }
                    }
                },
                {"$unwind": "$combined"},
                {"$replaceRoot": {"newRoot": "$combined"}},
                # Remove seed_id field from final output
                {
                    "$project": {
                        "seed_id": 0
                    }
                }
            ]
            
            if self.debug_mode:
                debug_info["vector_graph_pipeline"] = vector_seed_pipeline
                debug_info["pipeline_steps"] = {
                    "step1_vector_search": {
                        "description": "Vector search for exactly 5 seed documents",
                        "query": query_text,
                        "expected_results": 5,
                        "numCandidates": 50,
                        "pipeline": [vector_seed_pipeline[0]]
                    },
                    "step2_facet_split": {
                        "description": "$facet splits into two parallel paths: preserve seeds + expand graph",
                        "path_a": "Preserve original 5 seeds with source='vector_seed', depth=0",
                        "path_b": f"$graphLookup expansion (maxDepth={max_depth}) from seeds, then filter out seed IDs",
                        "relationship_types": relationship_types or ["all"]
                    },
                    "step3_combine_dedupe_facet": {
                        "description": f"Filter expanded results to exclude seed IDs, then combine seeds (5) + expanded (up to {limit-5})",
                        "score_decay": "0.5 - (0.1 × depth)",
                        "deduplication": "Expanded results exclude any seed IDs to prevent duplicates",
                        "final_limit": limit,
                        "guaranteed_seeds": 5
                    }
                }
                start_time = get_current_time()
                
            results = list(self.collection.aggregate(vector_seed_pipeline))
            
            # Count seeds vs expanded in results
            seed_count = sum(1 for r in results if r.get('source') == 'vector_seed' and r.get('depth') == 0)
            expanded_count = sum(1 for r in results if r.get('source') == 'graph_expansion' and r.get('depth', 0) > 0)
            unclassified_count = len(results) - seed_count - expanded_count

            # Collect seed IDs for debugging
            seed_ids = [r.get('chunk_id') for r in results if r.get('source') == 'vector_seed' and r.get('depth') == 0]
            expanded_ids = [r.get('chunk_id') for r in results if r.get('source') == 'graph_expansion' and r.get('depth', 0) > 0]
            unclassified = [
                {"chunk_id": r.get('chunk_id'), "source": r.get('source'), "depth": r.get('depth')}
                for r in results
                if not (r.get('source') == 'vector_seed' and r.get('depth') == 0)
                and not (r.get('source') == 'graph_expansion' and r.get('depth', 0) > 0)
            ]
            
            if self.debug_mode:
                debug_info["result_count"] = len(results)
                debug_info["seed_count"] = seed_count
                debug_info["expanded_count"] = expanded_count
                debug_info["unclassified_count"] = unclassified_count
                debug_info["seed_ids"] = seed_ids
                debug_info["expanded_ids"] = expanded_ids[:10]  # First 10 for brevity
                debug_info["unclassified_results"] = unclassified[:10]  # Show first 10 unclassified
                debug_info["execution_time_ms"] = (get_current_time() - start_time) * 1000
                debug_info["pipeline_steps"]["step3_combine_dedupe_facet"]["actual_results"] = {
                    "total": len(results),
                    "seeds": seed_count,
                    "expanded": expanded_count,
                    "unclassified": unclassified_count,
                    "seed_ids_sample": seed_ids[:3],
                    "expanded_ids_sample": expanded_ids[:3],
                    "unclassified_sample": unclassified[:3]
                }

                # Validation: Check for overlap (there should be none)
                overlap = set(seed_ids) & set(expanded_ids)
                if overlap:
                    debug_info["warning"] = f"Found {len(overlap)} overlapping IDs between seeds and expanded: {list(overlap)[:5]}"
                else:
                    debug_info["validation"] = "✓ No overlap between seeds and expanded results"

            logger.info(f"Hybrid Graph Search: Found {len(results)} total results ({seed_count} seeds, {expanded_count} expanded, {unclassified_count} unclassified)")
            logger.info(f"  → Pipeline: 1) Vector search (5 seeds) → 2) $facet (preserve seeds + expand graph) → 3) Filter & combine (no duplicates)")
            if seed_count != 5:
                logger.warning(f"  ⚠️ Expected 5 seeds but got {seed_count}. Seed IDs: {seed_ids}")
            if unclassified_count > 0:
                logger.warning(f"  ⚠️ Found {unclassified_count} unclassified results (missing source/depth metadata):")
                for uc in unclassified[:5]:
                    logger.warning(f"      - chunk_id={uc['chunk_id']}, source={uc['source']}, depth={uc['depth']}")
            
            # Store debug info for retrieval
            if self.debug_mode:
                self.last_debug_info = debug_info
                
            return self._format_search_results(results)
            
        except Exception as e:
            logger.error(f"Error in vector-to-graph search: {str(e)}")
            traceback.print_exc()
            if self.debug_mode:
                debug_info["error"] = str(e)
            return []
        
    def _build_relationship_filter(self, relationship_types: Optional[List[str]] = None) -> Dict[str, Any]:
        """Build MongoDB filter for $graphLookup restrictSearchWithMatch"""
        if relationship_types:
            return {"relationships.type": {"$in": relationship_types}}
        return {}
        
    def _format_search_results(self, results: List[Dict[str, Any]]) -> List[SearchResult]:
        """Format database results into SearchResult objects"""
        search_results = []
        
        for result in results:
            search_result = SearchResult(
                score=result.get("score", 0.0),
                # Only set vector_score if source indicates it's a vector seed
                vector_score=result.get("score", 0.0) if result.get("source") == "vector_seed" else None,
                chunk_id=result.get("chunk_id"),
                text=result.get("text", ""),
                context=result.get("context"),
                breadcrumb_trail=result.get("breadcrumb_trail"),
                page_numbers=result.get("page_numbers"),
                content_type=result.get("content_type"),
                metadata=result.get("metadata"),
                vehicle_systems=result.get("vehicle_systems"),
                # Include GraphRAG-specific fields
                source=result.get("source"),
                depth=result.get("depth"),
                # Include heading fields
                heading_level_1=result.get("heading_level_1"),
                heading_level_2=result.get("heading_level_2"),
                heading_level_3=result.get("heading_level_3")
            )
            search_results.append(search_result)
            
        return search_results
    
    async def get_knowledge_graph_data(
        self,
        query: Optional[str] = None,
        chunk_ids: Optional[List[str]] = None,
        max_nodes: int = 50,
        max_depth: int = 2,
        include_all: bool = False,
        filter_systems: Optional[List[str]] = None,
        filter_content_types: Optional[List[str]] = None,
        min_connections: int = 0
    ) -> KnowledgeGraphResponse:
        """
        Generate knowledge graph data in Cytoscape.js format
        
        Args:
            query: Text query to find starting nodes
            chunk_ids: Specific chunk IDs to start from
            max_nodes: Maximum number of nodes to return
            max_depth: Maximum $graphLookup traversal depth (for query mode)
            include_all: If True, fetch all chunks (full graph mode)
            filter_systems: Filter by vehicle systems (full graph mode)
            filter_content_types: Filter by content types (full graph mode)
            min_connections: Minimum number of relationships a node must have
        """
        
        debug_info = {} if self.debug_mode else None
        
        # Check if collection is initialized
        if not hasattr(self, 'collection') or self.collection is None:
            logger.error("MongoDB collection is not available")
            return KnowledgeGraphResponse(elements=[], style=[])
            
        try:
            # Full Graph Mode - fetch all chunks with optional filters
            if include_all:
                logger.info(f"Knowledge Graph: Full graph mode - fetching all chunks")
                
                # Build match stage with filters
                match_filter = {}
                
                if filter_systems:
                    match_filter["metadata.systems"] = {"$in": filter_systems}
                    logger.info(f"Filtering by systems: {filter_systems}")
                
                if filter_content_types:
                    match_filter["content_type"] = {"$in": filter_content_types}
                    logger.info(f"Filtering by content types: {filter_content_types}")
                
                # Build simplified pipeline for full graph (no $graphLookup needed)
                graph_pipeline = []
                
                if match_filter:
                    graph_pipeline.append({"$match": match_filter})
                
                # Exclude embeddings for performance
                graph_pipeline.append({
                    "$project": {
                        "embedding": 0
                    }
                })
                
                # Filter by minimum connections if specified
                if min_connections > 0:
                    graph_pipeline.append({
                        "$addFields": {
                            "connection_count": {
                                "$size": {"$ifNull": ["$relationships", []]}
                            }
                        }
                    })
                    graph_pipeline.append({
                        "$match": {
                            "connection_count": {"$gte": min_connections}
                        }
                    })
                    graph_pipeline.append({
                        "$sort": {"connection_count": -1}
                    })
                
                # Limit to max_nodes
                graph_pipeline.append({"$limit": max_nodes})
                
                # Add metadata fields
                graph_pipeline.append({
                    "$addFields": {
                        "is_seed": False,
                        "depth": 0
                    }
                })
                
            # Query Mode - use $graphLookup for relationship traversal
            else:
                # Determine starting points for graph traversal
                if chunk_ids:
                    # Start from specific chunk IDs
                    match_stage = {"$match": {"id": {"$in": chunk_ids}}}
                    limit_seed = len(chunk_ids)
                elif query:
                    # Start from text search results
                    match_stage = {
                        "$search": {
                            "index": self.text_index_name,
                            "text": {"query": query, "path": ["text", "context", "breadcrumb_trail"]}
                        }
                    }
                    limit_seed = 5
                else:
                    # Get a random sample of chunks for general graph
                    match_stage = {"$sample": {"size": 5}}
                    limit_seed = 5

                # Build graph using $graphLookup
                graph_pipeline = [
                    match_stage,
                    {"$limit": limit_seed},
                    {
                        "$graphLookup": {
                            "from": self.collection_name,
                            "startWith": "$relationships.target_id",
                            "connectFromField": "relationships.target_id",
                            "connectToField": "id",
                            "as": "connected_chunks",
                            "maxDepth": max_depth,
                            "depthField": "graph_depth"
                        }
                    },
                    # Create nodes and edges data structure
                    {
                        "$addFields": {
                            "all_nodes": {
                                "$concatArrays": [
                                    [{"chunk": "$$ROOT", "is_seed": True, "depth": 0}],
                                    {
                                        "$map": {
                                            "input": "$connected_chunks",
                                            "as": "connected",
                                            "in": {
                                                "chunk": "$$connected",
                                                "is_seed": False,
                                                "depth": {"$ifNull": ["$$connected.graph_depth", 1]}
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    {"$unwind": "$all_nodes"},
                    {"$replaceRoot": {"newRoot": "$all_nodes"}},
                    {
                        "$group": {
                            "_id": "$chunk.id",
                            "chunk_data": {"$first": "$chunk"},
                            "is_seed": {"$max": "$is_seed"},
                            "min_depth": {"$min": "$depth"}
                        }
                    },
                    {"$limit": max_nodes}
                ]
            
            if self.debug_mode:
                debug_info["graph_pipeline"] = graph_pipeline
                debug_info["include_all"] = include_all
                start_time = get_current_time()
                
            graph_data = list(self.collection.aggregate(graph_pipeline))
            
            if self.debug_mode:
                debug_info["graph_data_count"] = len(graph_data)
                debug_info["execution_time_ms"] = (get_current_time() - start_time) * 1000
                
            logger.info(f"Knowledge Graph: Found {len(graph_data)} nodes")
            
            # Convert to Cytoscape format
            nodes = []
            edges = []
            highlighted_node_ids = []
            
            # Create a set to track processed edges (avoid duplicates)
            processed_edges = set()
            
            # Create nodes - handle different data structures for full vs query mode
            for item in graph_data:
                # Full graph mode: item is the chunk itself
                # Query mode: item has chunk_data, is_seed, min_depth fields
                if include_all:
                    chunk = item
                    is_seed = item.get("is_seed", False)
                    depth = item.get("depth", 0)
                else:
                    chunk = item["chunk_data"]
                    is_seed = item["is_seed"]
                    depth = item["min_depth"]
                
                node_id = chunk["id"]
                
                # Determine node type and styling
                node_class = "chunk-node"
                if is_seed:
                    node_class += " seed-node"
                    highlighted_node_ids.append(node_id)
                
                # Create shorter, meaningful labels - prioritize breadcrumb_trail
                breadcrumb = chunk.get("breadcrumb_trail", "")
                context = chunk.get("context", "")
                
                # Priority 1: Use breadcrumb trail (most descriptive)
                if breadcrumb:
                    parts = breadcrumb.split(" > ")
                    if len(parts) > 3:
                        # Show first + last 2 levels for hierarchy: "Manual > ... > Section > Subsection"
                        label = f"{parts[0]} > ... > {' > '.join(parts[-2:])}"
                    else:
                        # Use full breadcrumb if 3 or fewer levels
                        label = breadcrumb
                # Priority 2: Fall back to context
                elif context:
                    label = context[:60] + "..." if len(context) > 60 else context
                # Priority 3: Use chunk ID
                else:
                    label = f"Chunk {node_id[-8:]}"  # Use last 8 chars of ID
                
                nodes.append(CytoscapeNode(
                    data={
                        "id": node_id,
                        "label": label,
                        "type": "Chunk",
                        "text": chunk.get("text", "")[:200] + "..." if len(chunk.get("text", "")) > 200 else chunk.get("text", ""),
                        "page_numbers": chunk.get("page_numbers", []),
                        "content_type": chunk.get("content_type", []),
                        "context": chunk.get("context", ""),
                        "breadcrumb_trail": chunk.get("breadcrumb_trail", ""),
                        "is_seed": is_seed,
                        "depth": depth
                    },
                    classes=node_class
                ))
                
                # Create edges from relationships
                for rel in chunk.get("relationships", []):
                    if rel["target_type"] == "Chunk":
                        # Only create edges to chunks that exist in our graph
                        if include_all:
                            target_chunk_ids = {item["id"] for item in graph_data}
                        else:
                            target_chunk_ids = {item["chunk_data"]["id"] for item in graph_data}
                        if rel["target_id"] in target_chunk_ids:
                            edge_id = f"{node_id}-{rel['target_id']}-{rel['type']}"
                            if edge_id not in processed_edges:
                                processed_edges.add(edge_id)
                                # Format relationship type for display
                                rel_type_display = rel["type"].replace("_", " ").title()
                                edges.append(CytoscapeEdge(
                                    data={
                                        "id": edge_id,
                                        "source": node_id,
                                        "target": rel["target_id"],
                                        "relationship_type": rel_type_display
                                    },
                                    classes=f"edge-{rel['type'].lower().replace('_', '-')}"
                                ))
                    else:
                        # Add concept nodes (Systems, ContentTypes) if they don't exist
                        concept_id = f"{rel['target_type']}-{rel['target_id']}"
                        
                        # Check if concept node already exists
                        if not any(n.data["id"] == concept_id for n in nodes):
                            concept_class = f"{rel['target_type'].lower()}-node"
                            nodes.append(CytoscapeNode(
                                data={
                                    "id": concept_id,
                                    "label": rel["target_id"],
                                    "type": rel["target_type"],
                                    "is_concept": True
                                },
                                classes=concept_class
                            ))
                        
                        # Add edge to concept
                        edge_id = f"{node_id}-{concept_id}-{rel['type']}"
                        if edge_id not in processed_edges:
                            processed_edges.add(edge_id)
                            # Format relationship type for display
                            rel_type_display = rel["type"].replace("_", " ").title()
                            edges.append(CytoscapeEdge(
                                data={
                                    "id": edge_id,
                                    "source": node_id,
                                    "target": concept_id,
                                    "relationship_type": rel_type_display
                                },
                                classes=f"edge-{rel['type'].lower().replace('_', '-')}"
                            ))
            
            # Cytoscape styling
            cytoscape_style = [
                {
                    "selector": "node",
                    "style": {
                        "background-color": "#00ED64",  # MongoDB Green
                        "label": "data(label)",
                        "text-valign": "center",
                        "text-halign": "center",
                        "font-size": "12px",
                        "width": "40px",
                        "height": "40px",
                        "text-wrap": "wrap",
                        "text-max-width": "120px"
                    }
                },
                {
                    "selector": ".seed-node", 
                    "style": {
                        "background-color": "#001E2B",  # MongoDB Navy
                        "color": "#FFFFFF",
                        "border-width": "3px",
                        "border-color": "#FFC010",  # MongoDB Yellow
                        "width": "50px",
                        "height": "50px"
                    }
                },
                {
                    "selector": ".system-node",
                    "style": {
                        "background-color": "#FFC010",  # MongoDB Yellow
                        "shape": "square",
                        "width": "35px",
                        "height": "35px"
                    }
                },
                {
                    "selector": ".contenttype-node", 
                    "style": {
                        "background-color": "#FF6B47",  # MongoDB Orange
                        "shape": "diamond",
                        "width": "35px",
                        "height": "35px"
                    }
                },
                {
                    "selector": "edge",
                    "style": {
                        "width": 2,
                        "line-color": "#89979B",
                        "target-arrow-color": "#89979B",
                        "target-arrow-shape": "triangle",
                        "curve-style": "bezier"
                    }
                },
                {
                    "selector": ".edge-sequential-to",
                    "style": {
                        "line-color": "#00ED64", 
                        "target-arrow-color": "#00ED64",
                        "width": 3
                    }
                },
                {
                    "selector": ".edge-related-to", 
                    "style": {
                        "line-color": "#001E2B", 
                        "target-arrow-color": "#001E2B"
                    }
                },
                {
                    "selector": ".edge-mentions-system",
                    "style": {
                        "line-color": "#FFC010", 
                        "target-arrow-color": "#FFC010",
                        "line-style": "dashed"
                    }
                },
                {
                    "selector": ".edge-is-of-type",
                    "style": {
                        "line-color": "#FF6B47", 
                        "target-arrow-color": "#FF6B47",
                        "line-style": "dotted"
                    }
                }
            ]
            
            elements = nodes + edges
            
            logger.info(f"Knowledge Graph: Generated {len(nodes)} nodes and {len(edges)} edges")
            
            # Build applied filters dictionary
            applied_filters_dict = {}
            if include_all:
                if filter_systems:
                    applied_filters_dict["systems"] = filter_systems
                if filter_content_types:
                    applied_filters_dict["content_types"] = filter_content_types
                if min_connections > 0:
                    applied_filters_dict["min_connections"] = min_connections
            
            return KnowledgeGraphResponse(
                elements=elements,
                query_context=query,
                highlighted_node_ids=highlighted_node_ids,
                style=cytoscape_style,
                total_nodes=len(nodes),
                is_full_graph=include_all,
                applied_filters=applied_filters_dict if applied_filters_dict else None
            )
            
        except Exception as e:
            logger.error(f"Error in knowledge graph generation: {str(e)}")
            traceback.print_exc()
            if self.debug_mode:
                debug_info["error"] = str(e)
            return KnowledgeGraphResponse(elements=[], style=[])

# Helper function for timing
def get_current_time():
    """Return the current time"""
    return time.time()