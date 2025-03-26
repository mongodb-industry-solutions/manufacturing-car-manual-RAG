from typing import List, Dict, Any, Optional, Union
import logging

from app.db.mongodb import get_mongodb
from app.core.config import get_settings
from app.models.chunks import Chunk
from app.models.search import SearchResult

logger = logging.getLogger(__name__)

class SearchRepository:
    """Repository for performing vector and text searches in MongoDB"""
    
    def __init__(self):
        """Initialize the repository with MongoDB collection"""
        self.settings = get_settings()
        self.mongodb = get_mongodb()
        
        # Check if MongoDB connection is initialized
        if self.mongodb is not None:
            self.collection = self.mongodb.get_collection(self.settings.CHUNKS_COLLECTION)
    
    async def vector_search(self, embedding: List[float], limit: int = 5) -> List[SearchResult]:
        """Perform vector search using the embedding"""
        # Check if collection is initialized
        if not hasattr(self, 'collection') or self.collection is None:
            return []
            
        try:
            pipeline = [
                {
                    "$vectorSearch": {
                        "index": self.settings.VECTOR_INDEX_NAME,
                        "path": self.settings.VECTOR_FIELD_NAME,
                        "queryVector": embedding,
                        "numCandidates": limit * 10,  # Consider more candidates for better results
                        "limit": limit
                    }
                },
                {
                    "$project": {
                        "_id": 0,
                        "score": {"$meta": "vectorSearchScore"},
                        "chunk": "$$ROOT"
                    }
                }
            ]
            
            results = list(self.collection.aggregate(pipeline))
            search_results = []
            
            for result in results:
                score = result.get("score", 0.0)
                
                # Clean up the chunk data for response
                chunk_data = result.get("chunk", {})
                if self.settings.VECTOR_FIELD_NAME in chunk_data:
                    del chunk_data[self.settings.VECTOR_FIELD_NAME]
                
                # Create search result object
                search_result = SearchResult(
                    score=score,
                    vector_score=score,
                    chunk=Chunk(**chunk_data)
                )
                search_results.append(search_result)
            
            return search_results
        except Exception as e:
            logger.error(f"Vector search error: {e}")
            raise
    
    async def text_search(self, query: str, limit: int = 5) -> List[SearchResult]:
        """Perform text search using the query string"""
        # Check if collection is initialized
        if not hasattr(self, 'collection') or self.collection is None:
            return []
            
        try:
            # Create text index if not exists
            self.collection.create_index([("text", "text")])
            
            # Perform text search
            results = self.collection.find(
                {"$text": {"$search": query}},
                {"score": {"$meta": "textScore"}}
            ).sort([("score", {"$meta": "textScore"})]).limit(limit)
            
            search_results = []
            for result in results:
                score = result.get("score", 0.0)
                
                # Remove MongoDB-specific fields
                if "_id" in result:
                    del result["_id"]
                if "score" in result:
                    del result["score"]
                if self.settings.VECTOR_FIELD_NAME in result:
                    del result[self.settings.VECTOR_FIELD_NAME]
                
                # Create search result object
                search_result = SearchResult(
                    score=score,
                    text_score=score,
                    chunk=Chunk(**result)
                )
                search_results.append(search_result)
            
            return search_results
        except Exception as e:
            logger.error(f"Text search error: {e}")
            raise
    
    async def hybrid_search_rrf(self, vector_results: List[SearchResult], text_results: List[SearchResult], k: int = 60) -> List[SearchResult]:
        """Combine vector and text search results using Reciprocal Rank Fusion"""
        # Create a map of chunk_id to search result for easy lookup
        result_map = {}
        
        # Process vector results
        for i, result in enumerate(vector_results):
            chunk_id = result.chunk.id
            # RRF formula: 1 / (k + rank), where rank is 0-based
            rrf_score = 1.0 / (k + i)
            result_map[chunk_id] = {
                "chunk": result.chunk,
                "vector_score": result.vector_score,
                "rrf_score": rrf_score
            }
        
        # Process text results and combine scores
        for i, result in enumerate(text_results):
            chunk_id = result.chunk.id
            rrf_score = 1.0 / (k + i)
            
            if chunk_id in result_map:
                # Update existing entry
                result_map[chunk_id]["text_score"] = result.text_score
                result_map[chunk_id]["rrf_score"] += rrf_score
            else:
                # Add new entry
                result_map[chunk_id] = {
                    "chunk": result.chunk,
                    "text_score": result.text_score,
                    "rrf_score": rrf_score
                }
        
        # Convert to list and sort by RRF score
        combined_results = []
        for chunk_id, data in result_map.items():
            combined_results.append(SearchResult(
                score=data["rrf_score"],
                vector_score=data.get("vector_score"),
                text_score=data.get("text_score"),
                chunk=data["chunk"]
            ))
        
        # Sort by RRF score (descending)
        combined_results.sort(key=lambda x: x.score, reverse=True)
        return combined_results
    
    async def hybrid_search_weighted(self, vector_results: List[SearchResult], text_results: List[SearchResult], 
                                    vector_weight: float = 0.7, text_weight: float = 0.3) -> List[SearchResult]:
        """Combine vector and text search results using weighted scoring"""
        # Create a map of chunk_id to search result for easy lookup
        result_map = {}
        
        # Process vector results
        for result in vector_results:
            chunk_id = result.chunk.id
            result_map[chunk_id] = {
                "chunk": result.chunk,
                "vector_score": result.vector_score,
                "weighted_score": result.vector_score * vector_weight
            }
        
        # Process text results and combine scores
        for result in text_results:
            chunk_id = result.chunk.id
            weighted_text_score = result.text_score * text_weight
            
            if chunk_id in result_map:
                # Update existing entry
                result_map[chunk_id]["text_score"] = result.text_score
                result_map[chunk_id]["weighted_score"] += weighted_text_score
            else:
                # Add new entry
                result_map[chunk_id] = {
                    "chunk": result.chunk,
                    "text_score": result.text_score,
                    "weighted_score": weighted_text_score
                }
        
        # Convert to list and sort by weighted score
        combined_results = []
        for chunk_id, data in result_map.items():
            combined_results.append(SearchResult(
                score=data["weighted_score"],
                vector_score=data.get("vector_score"),
                text_score=data.get("text_score"),
                chunk=data["chunk"]
            ))
        
        # Sort by weighted score (descending)
        combined_results.sort(key=lambda x: x.score, reverse=True)
        return combined_results
        
    async def hybrid_search_intersection(self, vector_results: List[SearchResult], text_results: List[SearchResult]) -> List[SearchResult]:
        """Combine vector and text search results by taking the intersection (only results in both sets)"""
        # Create a map of chunk_id to search result for both result sets
        vector_map = {result.chunk.id: result for result in vector_results}
        text_map = {result.chunk.id: result for result in text_results}
        
        # Find the intersection of IDs
        common_ids = set(vector_map.keys()).intersection(set(text_map.keys()))
        
        # Create combined results for the common IDs
        combined_results = []
        for chunk_id in common_ids:
            vector_result = vector_map[chunk_id]
            text_result = text_map[chunk_id]
            
            # Average the scores for ranking (could be customized)
            avg_score = (vector_result.score + text_result.score) / 2.0
            
            combined_results.append(SearchResult(
                score=avg_score,
                vector_score=vector_result.score,
                text_score=text_result.score,
                chunk=vector_result.chunk
            ))
        
        # Sort by average score (descending)
        combined_results.sort(key=lambda x: x.score, reverse=True)
        return combined_results
