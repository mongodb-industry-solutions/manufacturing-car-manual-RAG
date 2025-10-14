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

    async def graph_to_vector_search(
        self,
        query_text: str,
        query_embedding: List[float], 
        max_depth: int = 2,
        limit: int = 30,
        relationship_types: Optional[List[str]] = None
    ) -> List[SearchResult]:
        """Graph-first expansion search using $graphLookup"""
        
        debug_info = {} if self.debug_mode else None
        
        if not query_embedding:
            logger.error("Error: Cannot run graph-to-vector search without a query embedding.")
            return []
            
        # Check if collection is initialized
        if not hasattr(self, 'collection') or self.collection is None:
            logger.error("MongoDB collection is not available")
            return []
            
        try:
            # Phase 1: Graph Discovery using $graphLookup
            graph_seed_pipeline = [
                # Initial text search on metadata to find conceptual starting points
                {
                    "$search": {
                        "index": self.text_index_name,
                        "compound": {
                            "should": [
                                {"text": {"query": query_text, "path": "metadata.systems", "score": {"boost": {"value": 3}}}},
                                {"text": {"query": query_text, "path": "content_type", "score": {"boost": {"value": 2}}}},
                                {"text": {"query": query_text, "path": "context", "score": {"boost": {"value": 1}}}}
                            ]
                        }
                    }
                },
                {"$limit": 5},  # Start with top conceptual matches
                # Use $graphLookup to traverse relationship network
                {
                    "$graphLookup": {
                        "from": self.collection_name,
                        "startWith": "$relationships.target_id",
                        "connectFromField": "relationships.target_id", 
                        "connectToField": "id",
                        "as": "graph_expansion",
                        "maxDepth": max_depth,
                        "restrictSearchWithMatch": self._build_relationship_filter(relationship_types),
                        "depthField": "traversal_depth"
                    }
                },
                # Combine original and expanded results with source tracking
                {
                    "$addFields": {
                        "all_related": {
                            "$concatArrays": [
                                [{"doc": "$$ROOT", "source": "seed", "depth": 0}],
                                {
                                    "$map": {
                                        "input": "$graph_expansion",
                                        "as": "expanded",
                                        "in": {"doc": "$$expanded", "source": "graph_expansion", "depth": {"$ifNull": ["$$expanded.traversal_depth", 1]}}
                                    }
                                }
                            ]
                        }
                    }
                },
                {"$unwind": "$all_related"},
                {"$replaceRoot": {"newRoot": "$all_related"}},
                # Deduplicate with seed prioritization
                {
                    "$group": {
                        "_id": "$doc.id",
                        "doc": {"$first": "$doc"},
                        "source": {
                            "$first": {
                                "$cond": [
                                    {"$eq": ["$source", "seed"]},
                                    "seed",
                                    "$source"
                                ]
                            }
                        },
                        "min_depth": {"$min": "$depth"},
                        "is_seed": {
                            "$max": {
                                "$cond": [
                                    {"$eq": ["$source", "seed"]},
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                },
                # Add source and depth to document
                {
                    "$addFields": {
                        "doc.source": "$source",
                        "doc.depth": "$min_depth"
                    }
                },
                {"$replaceRoot": {"newRoot": "$doc"}},
                {"$limit": limit * 3}  # Get more candidates for vector filtering
            ]
            
            if self.debug_mode:
                debug_info["graph_pipeline"] = graph_seed_pipeline
                debug_info["pipeline_steps"] = {}
                start_time = get_current_time()
                
            graph_candidates = list(self.collection.aggregate(graph_seed_pipeline))
            
            if self.debug_mode:
                debug_info["graph_candidates_count"] = len(graph_candidates)
                debug_info["graph_execution_time_ms"] = (get_current_time() - start_time) * 1000
                
                # Step-by-step breakdown for visualization
                debug_info["pipeline_steps"] = {
                    "step1_text_search": {
                        "description": "Text search on metadata (systems=3x, content_type=2x, context=1x)",
                        "query": query_text,
                        "expected_results": 5,
                        "pipeline": [graph_seed_pipeline[0], graph_seed_pipeline[1]]
                    },
                    "step2_graph_expansion": {
                        "description": f"$graphLookup expansion (maxDepth={max_depth})",
                        "relationship_types": relationship_types or ["all"],
                        "pipeline": [graph_seed_pipeline[2]]
                    },
                    "step3_combine_dedupe": {
                        "description": f"Combine seeds + expanded, deduplicate, get {limit * 3} candidates",
                        "candidates_multiplier": 3,
                        "actual_candidates": len(graph_candidates),
                        "pipeline": graph_seed_pipeline[3:6]
                    }
                }
                
            # Count seeds vs expanded in graph candidates
            seed_candidate_count = sum(1 for c in graph_candidates if c.get('source') == 'seed' and c.get('depth') == 0)
            expanded_candidate_count = len(graph_candidates) - seed_candidate_count
            
            logger.info(f"Graph-to-Vector: Found {len(graph_candidates)} graph candidates ({seed_candidate_count} seeds, {expanded_candidate_count} expanded)")
            
            # Phase 2: Vector filtering on graph candidates
            if query_embedding and graph_candidates:
                candidate_ids = [doc["id"] for doc in graph_candidates]
                
                vector_filter_pipeline = [
                    {
                        "$vectorSearch": {
                            "index": self.vector_index_name,
                            "path": self.vector_field_name,
                            "queryVector": query_embedding,
                            "numCandidates": len(candidate_ids) * 2,
                            "limit": limit,
                            "filter": {"id": {"$in": candidate_ids}}
                        }
                    },
                    self._get_common_projection("vectorSearchScore")
                ]
                
                if self.debug_mode:
                    debug_info["vector_filter_pipeline"] = vector_filter_pipeline
                    start_time = get_current_time()
                    
                    # Add step 4 debug info
                    debug_info["pipeline_steps"]["step4_vector_filter"] = {
                        "description": f"Vector search filter on {len(candidate_ids)} candidates → {limit} final results",
                        "input_candidates": len(candidate_ids),
                        "final_limit": limit,
                        "pipeline": vector_filter_pipeline
                    }
                    
                vector_results = list(self.collection.aggregate(vector_filter_pipeline))
                
                # Count seeds vs expanded in final results
                seed_count = sum(1 for r in vector_results if r.get('source') == 'seed' and r.get('depth') == 0)
                expanded_count = len(vector_results) - seed_count
                
                if self.debug_mode:
                    debug_info["vector_results_count"] = len(vector_results)
                    debug_info["seed_count"] = seed_count
                    debug_info["expanded_count"] = expanded_count
                    debug_info["vector_execution_time_ms"] = (get_current_time() - start_time) * 1000
                    debug_info["pipeline_steps"]["step4_vector_filter"]["actual_results"] = {
                        "total": len(vector_results),
                        "seeds": seed_count,
                        "expanded": expanded_count
                    }
                    
                logger.info(f"Graph-to-Vector: Filtered to {len(vector_results)} final results ({seed_count} seeds, {expanded_count} expanded)")
                logger.info(f"  → Pipeline stages: 1) Text search (5 seeds) → 2) $graphLookup (maxDepth={max_depth}) → 3) Dedupe+Track source → 4) Vector filter")
                
                # Store debug info for retrieval
                if self.debug_mode:
                    self.last_debug_info = debug_info
                    
                return self._format_search_results(vector_results)
            
            return []
            
        except Exception as e:
            logger.error(f"Error in graph-to-vector search: {str(e)}")
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
        """Vector-first expansion search using $graphLookup"""
        
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
            
            # Phase 1: Vector Discovery with Graph Expansion
            vector_seed_pipeline = [
                {
                    "$vectorSearch": {
                        "index": self.vector_index_name,
                        "path": self.vector_field_name,
                        "queryVector": query_embedding,
                        "numCandidates": 50,
                        "limit": 5  # Start with top vector matches
                    }
                },
                # Use $graphLookup to expand from vector seeds
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
                # Combine seeds and neighbors with metadata
                {
                    "$addFields": {
                        "all_docs": {
                            "$concatArrays": [
                                [{
                                    "doc": "$$ROOT", 
                                    "source": "vector_seed",
                                    "score": {"$meta": "vectorSearchScore"},
                                    "depth": 0
                                }],
                                {
                                    "$map": {
                                        "input": "$graph_neighbors",
                                        "as": "neighbor", 
                                        "in": {
                                            "doc": "$$neighbor",
                                            "source": "graph_expansion",
                                            "score": {"$subtract": [0.5, {"$multiply": [0.1, {"$ifNull": ["$$neighbor.traversal_depth", 1]}]}]},  # Decay score by depth
                                            "depth": {"$ifNull": ["$$neighbor.traversal_depth", 1]}
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
                {"$unwind": "$all_docs"},
                {"$replaceRoot": {"newRoot": "$all_docs"}},
                # Deduplicate with seed prioritization
                {
                    "$group": {
                        "_id": "$doc.id",
                        "doc": {"$first": "$doc"},
                        "max_score": {"$max": "$score"},
                        # Prioritize vector_seed source over graph_expansion
                        "source": {
                            "$first": {
                                "$cond": [
                                    {"$eq": ["$source", "vector_seed"]},
                                    "vector_seed",
                                    "$source"
                                ]
                            }
                        },
                        "min_depth": {"$min": "$depth"},
                        # Track if this document was a seed (1) or expansion (0)
                        "is_seed": {
                            "$max": {
                                "$cond": [
                                    {"$eq": ["$source", "vector_seed"]},
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                },
                # Use $facet to separate seeds and expanded, guaranteeing 5 seeds
                {
                    "$facet": {
                        "seeds": [
                            {"$match": {"is_seed": 1}},
                            {"$sort": {"max_score": -1}},
                            {"$limit": 5}  # Guarantee exactly 5 seeds
                        ],
                        "expanded": [
                            {"$match": {"is_seed": 0}},
                            {"$sort": {"max_score": -1, "min_depth": 1}},
                            {"$limit": limit}  # Get expanded results
                        ]
                    }
                },
                # Combine seeds and expanded
                {
                    "$project": {
                        "all_results": {
                            "$concatArrays": ["$seeds", "$expanded"]
                        }
                    }
                },
                {"$unwind": "$all_results"},
                {"$replaceRoot": {"newRoot": "$all_results"}},
                {"$limit": limit},
                {
                    "$project": {
                        "_id": 0,
                        "score": "$max_score",
                        "chunk_id": "$doc.id",
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
                        "source": "$source",
                        "depth": "$min_depth"
                    }
                }
            ]
            
            if self.debug_mode:
                debug_info["vector_graph_pipeline"] = vector_seed_pipeline
                debug_info["pipeline_steps"] = {
                    "step1_vector_search": {
                        "description": "Vector search for 5 seed documents",
                        "query": query_text,
                        "expected_results": 5,
                        "numCandidates": 50,
                        "pipeline": [vector_seed_pipeline[0]]
                    },
                    "step2_graph_expansion": {
                        "description": f"$graphLookup expansion from seeds (maxDepth={max_depth})",
                        "relationship_types": relationship_types or ["all"],
                        "pipeline": [vector_seed_pipeline[1]]
                    },
                    "step3_combine_dedupe_facet": {
                        "description": f"Deduplicate, separate seeds (5) and expanded (up to {limit}), then combine",
                        "score_decay": "0.5 - (0.1 × depth)",
                        "facet_logic": "Seeds: is_seed=1, limit 5 | Expanded: is_seed=0, limit variable",
                        "final_limit": limit
                    }
                }
                start_time = get_current_time()
                
            results = list(self.collection.aggregate(vector_seed_pipeline))
            
            # Count seeds vs expanded in results
            seed_count = sum(1 for r in results if r.get('source') == 'vector_seed' and r.get('depth') == 0)
            expanded_count = len(results) - seed_count
            
            if self.debug_mode:
                debug_info["result_count"] = len(results)
                debug_info["seed_count"] = seed_count
                debug_info["expanded_count"] = expanded_count
                debug_info["execution_time_ms"] = (get_current_time() - start_time) * 1000
                debug_info["pipeline_steps"]["step3_combine_dedupe_facet"]["actual_results"] = {
                    "total": len(results),
                    "seeds": seed_count,
                    "expanded": expanded_count
                }
                
            logger.info(f"Vector-to-Graph: Found {len(results)} total results ({seed_count} seeds, {expanded_count} expanded)")
            logger.info(f"  → Pipeline stages: 1) Vector search (5 seeds) → 2) $graphLookup (maxDepth={max_depth}) → 3) Dedupe+Facet (separate seeds/expanded) → 4) Combine")
            
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
        max_depth: int = 2
    ) -> KnowledgeGraphResponse:
        """Generate knowledge graph data in Cytoscape.js format using $graphLookup"""
        
        debug_info = {} if self.debug_mode else None
        
        # Check if collection is initialized
        if not hasattr(self, 'collection') or self.collection is None:
            logger.error("MongoDB collection is not available")
            return KnowledgeGraphResponse(elements=[], style=[])
            
        try:
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
                start_time = get_current_time()
                
            graph_data = list(self.collection.aggregate(graph_pipeline))
            
            if self.debug_mode:
                debug_info["graph_data_count"] = len(graph_data)
                debug_info["execution_time_ms"] = (get_current_time() - start_time) * 1000
                
            logger.info(f"Knowledge Graph: Found {len(graph_data)} nodes via $graphLookup")
            
            # Convert to Cytoscape format
            nodes = []
            edges = []
            highlighted_node_ids = []
            
            # Create a set to track processed edges (avoid duplicates)
            processed_edges = set()
            
            # Create nodes
            for item in graph_data:
                chunk = item["chunk_data"]
                node_id = chunk["id"]
                
                # Determine node type and styling
                node_class = "chunk-node"
                if item["is_seed"]:
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
                        "is_seed": item["is_seed"],
                        "depth": item["min_depth"]
                    },
                    classes=node_class
                ))
                
                # Create edges from relationships
                for rel in chunk.get("relationships", []):
                    if rel["target_type"] == "Chunk":
                        # Only create edges to chunks that exist in our graph
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
            
            return KnowledgeGraphResponse(
                elements=elements,
                query_context=query,
                highlighted_node_ids=highlighted_node_ids,
                style=cytoscape_style
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