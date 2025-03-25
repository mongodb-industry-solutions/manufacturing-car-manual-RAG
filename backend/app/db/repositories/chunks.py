from typing import List, Dict, Any, Optional
from bson import ObjectId
from pymongo.collection import Collection

from app.db.mongodb import get_mongodb
from app.core.config import get_settings
from app.models.chunks import Chunk, ChunkList

class ChunkRepository:
    """Repository for managing document chunks in MongoDB"""
    
    def __init__(self):
        """Initialize the repository with MongoDB collection"""
        self.settings = get_settings()
        self.mongodb = get_mongodb()
        self.collection = self.mongodb.get_collection(self.settings.CHUNKS_COLLECTION)
        
        # Ensure vector search index exists
        self.mongodb.create_vector_search_index(
            collection_name=self.settings.CHUNKS_COLLECTION,
            index_name=self.settings.VECTOR_INDEX_NAME,
            vector_field=self.settings.VECTOR_FIELD_NAME,
            dimensions=self.settings.VECTOR_DIMENSIONS
        )
    
    async def create_chunk(self, chunk: Chunk, embedding: List[float]) -> str:
        """Create a new chunk with embedding in MongoDB"""
        # Convert Pydantic model to dict
        chunk_dict = chunk.dict()
        
        # Add the embedding vector
        chunk_dict[self.settings.VECTOR_FIELD_NAME] = embedding
        
        # Insert into MongoDB
        result = self.collection.insert_one(chunk_dict)
        return str(result.inserted_id)
    
    async def get_chunk(self, chunk_id: str) -> Optional[Chunk]:
        """Get a chunk by ID"""
        # Try with original ID first
        result = self.collection.find_one({"id": chunk_id})
        
        # If not found, try with MongoDB ObjectId
        if not result and ObjectId.is_valid(chunk_id):
            result = self.collection.find_one({"_id": ObjectId(chunk_id)})
        
        if result:
            # Remove embedding vector and MongoDB ID before returning
            if self.settings.VECTOR_FIELD_NAME in result:
                del result[self.settings.VECTOR_FIELD_NAME]
            if "_id" in result:
                del result["_id"]
            return Chunk(**result)
        return None
    
    async def get_chunks(self, skip: int = 0, limit: int = 100) -> ChunkList:
        """Get multiple chunks with pagination"""
        total = self.collection.count_documents({})
        cursor = self.collection.find({}).skip(skip).limit(limit)
        
        chunks = []
        for doc in cursor:
            # Remove embedding vector and MongoDB ID before returning
            if self.settings.VECTOR_FIELD_NAME in doc:
                del doc[self.settings.VECTOR_FIELD_NAME]
            if "_id" in doc:
                del doc["_id"]
            chunks.append(Chunk(**doc))
        
        return ChunkList(total=total, chunks=chunks)
    
    async def update_chunk(self, chunk_id: str, chunk: Dict[str, Any]) -> bool:
        """Update a chunk by ID"""
        result = self.collection.update_one(
            {"id": chunk_id},
            {"$set": chunk}
        )
        return result.modified_count > 0
    
    async def delete_chunk(self, chunk_id: str) -> bool:
        """Delete a chunk by ID"""
        result = self.collection.delete_one({"id": chunk_id})
        return result.deleted_count > 0
