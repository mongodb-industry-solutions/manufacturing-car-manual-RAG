from typing import List, Dict, Any, Optional
import logging
from bson import ObjectId
from pymongo.collection import Collection

from app.db.mongodb import get_mongodb
from app.core.config import get_settings
from app.models.chunks import Chunk, ChunkList

logger = logging.getLogger(__name__)

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
            
            # Transform the embedding vector to a truncated representation for display
            logger.info(f"Checking for embedding field: {self.settings.VECTOR_FIELD_NAME}")
            logger.info(f"Fields in result: {list(result.keys())}")
            
            if self.settings.VECTOR_FIELD_NAME in result:
                logger.info(f"Found embedding field in result")
                # Preserve embedding timestamp if it exists
                embedding_timestamp = None
                if "embedding_timestamp" in result:
                    embedding_timestamp = result.get("embedding_timestamp")
                    
                # Get the full embedding vector
                full_embedding = result[self.settings.VECTOR_FIELD_NAME]
                logger.info(f"Embedding type: {type(full_embedding)}, length: {len(full_embedding) if isinstance(full_embedding, list) else 'N/A'}")
                
                # Create a truncated representation showing first 5 values and total dimensions
                if isinstance(full_embedding, list) and len(full_embedding) > 0:
                    truncated_values = [round(float(val), 3) for val in full_embedding[:5]]
                    result[self.settings.VECTOR_FIELD_NAME] = {
                        "values": f"[{', '.join(map(str, truncated_values))}, ...]",
                        "dimensions": len(full_embedding),
                        "note": "Truncated for display - showing first 5 of 768 dimensions"
                    }
                    logger.info(f"Created truncated embedding representation")
                else:
                    # Remove if invalid
                    logger.warning(f"Invalid embedding format, removing field")
                    del result[self.settings.VECTOR_FIELD_NAME]
                
                # Add back the timestamp if it existed
                if embedding_timestamp:
                    result["embedding_timestamp"] = embedding_timestamp
            else:
                logger.warning(f"No embedding field found in result")
            
            # Ensure the id is set for clients expecting it
            if "id" not in result and "_id" in result:
                result["id"] = result["_id"]
            
            # Log final result structure
            logger.info(f"Final result fields before return: {list(result.keys())}")
            if self.settings.VECTOR_FIELD_NAME in result:
                logger.info(f"Embedding field is present in final result: {result[self.settings.VECTOR_FIELD_NAME]}")
                
            return Chunk(**result)
        return None
    
    async def get_chunks(self, skip: int = 0, limit: int = 100, filters: dict = None, include_embeddings: bool = False) -> ChunkList:
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
            include_embeddings: Whether to include embedding data in response (default: False for performance)
        """
        logger.info(f"get_chunks called with skip={skip}, limit={limit}, filters={filters}")
        
        # Check if collection is initialized
        if not hasattr(self, 'collection') or self.collection is None:
            return ChunkList(total=0, chunks=[])
            
        # Build aggregation pipeline for server-side filtering
        pipeline = []
        
        # Build match stage for filtering
        match_stage = {}
        
        # If no filters provided, we still need to match all documents
        # Otherwise the facet will operate on an empty pipeline
        
        if filters:
            # Filter by content types - must contain ALL selected types
            if filters.get('content_types'):
                match_stage['content_type'] = {'$all': filters['content_types']}
            
            # Filter by vehicle systems (stored in metadata.systems) - must contain ALL selected systems
            if filters.get('vehicle_systems'):
                match_stage['metadata.systems'] = {'$all': filters['vehicle_systems']}
            
            # Build separate conditions for safety and procedures to avoid $or conflicts
            special_conditions = []
            
            # Filter for chunks with safety notices
            if filters.get('has_safety_notices'):
                safety_condition = {
                    '$or': [
                        {'safety_notices.0': {'$exists': True}},
                        {'metadata.has_safety': True},
                        {'content_type': 'safety'},
                        {'text': {'$regex': '⚠️|warning|caution', '$options': 'i'}}
                    ]
                }
                special_conditions.append(safety_condition)
            
            # Filter for chunks with procedural steps
            if filters.get('has_procedures'):
                procedure_condition = {
                    '$or': [
                        {'procedural_steps.0': {'$exists': True}},
                        {'content_type': {'$in': ['procedure', 'procedural']}},
                        {'text': {'$regex': r'\d+\.\s+[A-Z]|Step\s+\d+', '$options': 'i'}}
                    ]
                }
                special_conditions.append(procedure_condition)
            
            # Combine special conditions with $and if multiple exist
            if special_conditions:
                if len(special_conditions) == 1:
                    # Single special condition, merge it directly
                    if '$or' in special_conditions[0]:
                        match_stage['$or'] = special_conditions[0]['$or']
                else:
                    # Multiple special conditions, use $and
                    match_stage['$and'] = special_conditions
            
            # Text search using existing Atlas Search index
            if filters.get('text_search'):
                # Use $search stage for Atlas Search instead of $text
                search_stage = {
                    '$search': {
                        'index': 'manual_text_search_index',
                        'text': {
                            'query': filters['text_search'],
                            'path': ['text', 'context', 'breadcrumb_trail']
                        }
                    }
                }
                pipeline.append(search_stage)
        
        # Add match stage if we have filters (except text search which uses $search)
        if match_stage:
            pipeline.append({'$match': match_stage})
            logger.info(f"Added match stage to pipeline: {match_stage}")
        
        # Add facet stage to get both count and data
        facet_stage = {
            '$facet': {
                'total': [{'$count': 'count'}],
                'data': [
                    {'$skip': skip},
                    {'$limit': limit}
                ]
            }
        }
        pipeline.append(facet_stage)
        
        # Log the complete pipeline for debugging
        logger.info(f"Executing aggregation pipeline with {len(pipeline)} stages")
        logger.info(f"Pipeline: {pipeline}")
        
        # Execute aggregation pipeline
        result = list(self.collection.aggregate(pipeline))
        
        if not result:
            logger.warning("Aggregation returned no results")
            return ChunkList(total=0, chunks=[])
        
        # Extract total count and data
        facet_result = result[0]
        total = facet_result['total'][0]['count'] if facet_result['total'] else 0
        documents = facet_result['data']
        
        logger.info(f"Query returned {len(documents)} documents out of {total} total matching filter criteria")
        
        # Process results
        chunks = []
        for doc in documents:
            # Keep _id as a string representation for debugging/reference
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
            
            # Only process embeddings if explicitly requested (performance optimization)
            if include_embeddings and self.settings.VECTOR_FIELD_NAME in doc:
                # Preserve embedding timestamp if it exists
                embedding_timestamp = None
                if "embedding_timestamp" in doc:
                    embedding_timestamp = doc.get("embedding_timestamp")
                    
                # Get the full embedding vector
                full_embedding = doc[self.settings.VECTOR_FIELD_NAME]
                
                # Create a truncated representation showing first 5 values and total dimensions
                if isinstance(full_embedding, list) and len(full_embedding) > 0:
                    truncated_values = [round(float(val), 3) for val in full_embedding[:5]]
                    doc[self.settings.VECTOR_FIELD_NAME] = {
                        "values": f"[{', '.join(map(str, truncated_values))}, ...]",
                        "dimensions": len(full_embedding),
                        "note": "Truncated for display - showing first 5 of 768 dimensions"
                    }
                else:
                    # Remove if invalid
                    del doc[self.settings.VECTOR_FIELD_NAME]
                
                # Add back the timestamp if it existed
                if embedding_timestamp:
                    doc["embedding_timestamp"] = embedding_timestamp
            elif self.settings.VECTOR_FIELD_NAME in doc:
                # Remove embedding data when not requested for performance
                del doc[self.settings.VECTOR_FIELD_NAME]
            
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
                        {"$unwind": "$metadata.systems"},
                        {"$group": {"_id": "$metadata.systems"}},
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
