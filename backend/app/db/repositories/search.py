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
            
            # Convert cursor to list to allow multiple iterations
            results_list = list(results)
            
            # Find the maximum score for normalization
            max_score = 1.0  # Default in case results are empty
            if results_list:
                max_score = max(result.get("score", 0.0) for result in results_list)
                
            search_results = []
            for result in results_list:
                raw_score = result.get("score", 0.0)
                
                # Normalize the score to a 0-1 range
                normalized_score = raw_score / max_score if max_score > 0 else 0.0
                
                # Remove MongoDB-specific fields
                if "_id" in result:
                    del result["_id"]
                if "score" in result:
                    del result["score"]
                if self.settings.VECTOR_FIELD_NAME in result:
                    del result[self.settings.VECTOR_FIELD_NAME]
                
                # Create search result object
                search_result = SearchResult(
                    score=normalized_score,
                    text_score=normalized_score,
                    chunk=Chunk(**result)
                )
                search_results.append(search_result)
            
            return search_results
        except Exception as e:
            logger.error(f"Text search error: {e}")
            raise
    
    async def calculate_vector_score(self, chunk_id: str, embedding: List[float]) -> float:
        """Calculate vector score for a specific chunk"""
        try:
            # First perform vector search without filtering by chunk_id
            # $vectorSearch must be the first stage in the pipeline
            pipeline = [
                {
                    "$vectorSearch": {
                        "index": self.settings.VECTOR_INDEX_NAME,
                        "path": self.settings.VECTOR_FIELD_NAME,
                        "queryVector": embedding,
                        "numCandidates": 100,  # Increase candidates to ensure we find the specific chunk
                        "limit": 100           # Increase limit to ensure we find the specific chunk
                    }
                },
                {
                    "$match": {
                        "id": chunk_id  # Filter after vector search
                    }
                },
                {
                    "$project": {
                        "score": {"$meta": "vectorSearchScore"}
                    }
                },
                {
                    "$limit": 1
                }
            ]
            
            results = list(self.collection.aggregate(pipeline))
            if results:
                return results[0].get("score", 0.0)
            
            # If no results with vectorSearch, the document might not be semantically similar enough
            # Just return a low score
            return 0.01
        except Exception as e:
            logger.error(f"Error calculating vector score: {e}")
            return 0.0
            
    async def calculate_text_score(self, chunk_id: str, query: str) -> float:
        """Calculate text score for a specific chunk"""
        try:
            # Create text index if not exists
            self.collection.create_index([("text", "text")])
            
            # Find the maximum text score for normalization
            max_score_result = list(self.collection.find(
                {"$text": {"$search": query}},
                {"score": {"$meta": "textScore"}}
            ).sort([("score", {"$meta": "textScore"})]).limit(1))
            
            max_score = 1.0
            if max_score_result:
                max_score = max_score_result[0].get("score", 1.0)
            
            # Get the text score for this specific chunk
            result = self.collection.find_one(
                {"id": chunk_id, "$text": {"$search": query}},
                {"score": {"$meta": "textScore"}}
            )
            
            if result:
                raw_score = result.get("score", 0.0)
                # Normalize the score
                return raw_score / max_score if max_score > 0 else 0.0
            return 0.0
        except Exception as e:
            logger.error(f"Error calculating text score: {e}")
            return 0.0
    
    async def hybrid_search_rrf(self, vector_results: List[SearchResult], text_results: List[SearchResult], query: str, embedding: List[float], k: int = 60) -> List[SearchResult]:
        """Combine vector and text search results using Reciprocal Rank Fusion"""
        # Create a map of chunk_id to search result for easy lookup
        result_map = {}
        
        # Create dictionaries for quick lookup of chunks by ID
        vector_chunks = {result.chunk.id: result for result in vector_results}
        text_chunks = {result.chunk.id: result for result in text_results}
        
        # Create a set of all unique chunk IDs
        all_chunk_ids = set(vector_chunks.keys()) | set(text_chunks.keys())
        
        # Process every unique chunk
        vector_rank = {chunk_id: i for i, chunk_id in enumerate(v.chunk.id for v in vector_results)}
        text_rank = {chunk_id: i for i, chunk_id in enumerate(t.chunk.id for t in text_results)}
        
        for chunk_id in all_chunk_ids:
            # Initialize with default values
            chunk = vector_chunks[chunk_id].chunk if chunk_id in vector_chunks else text_chunks[chunk_id].chunk
            vector_score = None
            text_score = None
            rrf_score = 0.0
            
            # Add vector score and RRF component if present in vector results
            if chunk_id in vector_chunks:
                vector_score = vector_chunks[chunk_id].vector_score
                rrf_score += 1.0 / (k + vector_rank[chunk_id])
            else:
                # Calculate vector score for chunks not in vector results
                vector_score = await self.calculate_vector_score(chunk_id, embedding)
            
            # Add text score and RRF component if present in text results
            if chunk_id in text_chunks:
                text_score = text_chunks[chunk_id].text_score
                rrf_score += 1.0 / (k + text_rank[chunk_id])
            else:
                # Calculate text score for chunks not in text results
                text_score = await self.calculate_text_score(chunk_id, query)
            
            # Store all scores and chunk data
            result_map[chunk_id] = {
                "chunk": chunk,
                "vector_score": vector_score,
                "text_score": text_score,
                "rrf_score": rrf_score
            }
        
        # Find the maximum RRF score for normalization
        max_rrf_score = max((data["rrf_score"] for data in result_map.values()), default=1.0)
        
        # Convert to list and sort by RRF score
        combined_results = []
        for chunk_id, data in result_map.items():
            # Normalize RRF score to 0-1 range by dividing by maximum score
            normalized_score = data["rrf_score"] / max_rrf_score if max_rrf_score > 0 else 0.0
            
            combined_results.append(SearchResult(
                score=normalized_score,  # Use normalized score instead of raw RRF score
                vector_score=data["vector_score"],  # Real calculated score, not a placeholder
                text_score=data["text_score"],  # Real calculated score, not a placeholder
                chunk=data["chunk"]
            ))
        
        # Sort by normalized score (descending)
        combined_results.sort(key=lambda x: x.score, reverse=True)
        return combined_results
    
