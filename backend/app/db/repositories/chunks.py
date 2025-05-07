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
        
        # Check if MongoDB connection is initialized
        if self.mongodb is not None:
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
        # Check if collection is initialized
        if not hasattr(self, 'collection') or self.collection is None:
            raise ValueError("MongoDB collection not initialized")
            
        # Convert Pydantic model to dict
        chunk_dict = chunk.model_dump()
        
        # Add the embedding vector
        chunk_dict[self.settings.VECTOR_FIELD_NAME] = embedding
        
        # Insert into MongoDB
        result = self.collection.insert_one(chunk_dict)
        return str(result.inserted_id)
    
    async def get_chunk(self, chunk_id: str) -> Optional[Chunk]:
        """Get a chunk by ID"""
        # Check if collection is initialized
        if not hasattr(self, 'collection') or self.collection is None:
            return None
            
        # Try with original ID first (new chunk_id format)
        result = self.collection.find_one({"id": chunk_id})
        
        # If not found, try with MongoDB ObjectId
        if not result and ObjectId.is_valid(chunk_id):
            result = self.collection.find_one({"_id": ObjectId(chunk_id)})
            
        # Maybe it's stored with a specific ID format or we need to access by MongoDB _id
        if not result:
            # Try a regex search for id that might be in a different format
            result = self.collection.find_one({"id": {"$regex": f".*{chunk_id}.*"}})
        
        if result:
            # Keep _id as a string representation for debugging/reference
            if "_id" in result:
                result["_id"] = str(result["_id"])
            
            # Ensure we don't return the embedding vector (but keep timestamp if available)
            if self.settings.VECTOR_FIELD_NAME in result:
                # Preserve embedding timestamp if it exists
                embedding_timestamp = None
                if "embedding_timestamp" in result:
                    embedding_timestamp = result.get("embedding_timestamp")
                    
                # Remove the actual embedding vector
                del result[self.settings.VECTOR_FIELD_NAME]
                
                # Add back the timestamp if it existed
                if embedding_timestamp:
                    result["embedding_timestamp"] = embedding_timestamp
            
            # Ensure the id is set for clients expecting it
            if "id" not in result and "_id" in result:
                result["id"] = result["_id"]
                
            return Chunk(**result)
        return None
    
    async def get_chunks(self, skip: int = 0, limit: int = 100, filters: dict = None) -> ChunkList:
        """
        Get multiple chunks with pagination and filtering
        
        Args:
            skip: Number of documents to skip
            limit: Maximum number of documents to return
            filters: Dictionary containing filter parameters:
                - content_types: List of content types to include
                - vehicle_systems: List of vehicle systems to include
                - has_safety_notices: Whether chunks must have safety notices
                - has_procedures: Whether chunks must have procedural steps
                - text_search: Text to search within chunks
        """
        # Check if collection is initialized
        if not hasattr(self, 'collection') or self.collection is None:
            return ChunkList(total=0, chunks=[])
            
        # Build the query filter
        query_filter = {}
        
        if filters:
            # Filter by content types
            if filters.get('content_types'):
                query_filter['content_type'] = {'$in': filters['content_types']}
            
            # Filter by vehicle systems
            if filters.get('vehicle_systems'):
                query_filter['vehicle_systems'] = {'$in': filters['vehicle_systems']}
            
            # Filter for chunks with safety notices - check both direct safety_notices and metadata.has_safety
            if filters.get('has_safety_notices'):
                query_filter['$or'] = [
                    {'safety_notices.0': {'$exists': True}},
                    {'metadata.has_safety': True}
                ]
            
            # Filter for chunks with procedural steps
            if filters.get('has_procedures'):
                query_filter['procedural_steps.0'] = {'$exists': True}
            
            # Text search within chunks (across multiple fields)
            if filters.get('text_search'):
                # Create a text index if needed
                self.collection.create_index([
                    ("text", "text"),
                    ("heading_level_1", "text"),
                    ("heading_level_2", "text"),
                    ("heading_level_3", "text")
                ])
                
                query_filter['$text'] = {'$search': filters['text_search']}
        
        # Count total matching documents
        total = self.collection.count_documents(query_filter)
        
        # Execute the query with pagination
        cursor = self.collection.find(query_filter).skip(skip).limit(limit)
        
        # Sort by _id if no specific sorting is needed
        if not filters or not filters.get('text_search'):
            cursor = cursor.sort('_id', 1)
        else:
            # If text search is used, sort by text score
            cursor = cursor.sort([('score', {'$meta': 'textScore'})])
        
        # Process results
        chunks = []
        for doc in cursor:
            # Keep _id as a string representation for debugging/reference
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
            
            # Ensure we don't return the embedding vector (but keep timestamp if available)
            if self.settings.VECTOR_FIELD_NAME in doc:
                # Preserve embedding timestamp if it exists
                embedding_timestamp = None
                if "embedding_timestamp" in doc:
                    embedding_timestamp = doc.get("embedding_timestamp")
                    
                # Remove the actual embedding vector
                del doc[self.settings.VECTOR_FIELD_NAME]
                
                # Add back the timestamp if it existed
                if embedding_timestamp:
                    doc["embedding_timestamp"] = embedding_timestamp
            
            # Ensure the id is set for clients expecting it
            if "id" not in doc and "_id" in doc:
                doc["id"] = doc["_id"]
                
            # Handle has_safety metadata flag
            if "metadata" in doc and isinstance(doc["metadata"], dict):
                if doc["metadata"].get("has_safety") == True:
                    # Make sure we properly indicate safety information in the response
                    if "safety_notices" not in doc or not doc["safety_notices"]:
                        # If we don't have explicit notices but know safety information is present
                        doc["metadata"]["has_safety"] = True
            
            chunks.append(Chunk(**doc))
        
        return ChunkList(total=total, chunks=chunks)
        
    async def get_available_filters(self) -> dict:
        """Get all available filter values for content types and vehicle systems"""
        # Check if collection is initialized
        if not hasattr(self, 'collection') or self.collection is None:
            return {
                "content_types": [],
                "vehicle_systems": []
            }
            
        pipeline = [
            {
                "$facet": {
                    "content_types": [
                        {"$unwind": "$content_type"},
                        {"$group": {"_id": "$content_type"}},
                        {"$sort": {"_id": 1}}
                    ],
                    "vehicle_systems": [
                        {"$unwind": "$vehicle_systems"},
                        {"$group": {"_id": "$vehicle_systems"}},
                        {"$sort": {"_id": 1}}
                    ]
                }
            },
            {
                "$project": {
                    "content_types": "$content_types._id",
                    "vehicle_systems": "$vehicle_systems._id"
                }
            }
        ]
        
        result = list(self.collection.aggregate(pipeline))
        
        if result:
            return {
                "content_types": result[0].get("content_types", []),
                "vehicle_systems": result[0].get("vehicle_systems", [])
            }
        
        return {
            "content_types": [],
            "vehicle_systems": []
        }
    
    async def update_chunk(self, chunk_id: str, chunk: Dict[str, Any]) -> bool:
        """Update a chunk by ID"""
        # Check if collection is initialized
        if not hasattr(self, 'collection') or self.collection is None:
            return False
            
        result = self.collection.update_one(
            {"id": chunk_id},
            {"$set": chunk}
        )
        return result.modified_count > 0
    
    async def delete_chunk(self, chunk_id: str) -> bool:
        """Delete a chunk by ID"""
        # Check if collection is initialized
        if not hasattr(self, 'collection') or self.collection is None:
            return False
            
        result = self.collection.delete_one({"id": chunk_id})
        return result.deleted_count > 0
