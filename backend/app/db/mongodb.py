from typing import Optional, List, Dict, Any
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
import logging

from app.core.config import get_settings

logger = logging.getLogger(__name__)

class MongoDB:
    """MongoDB database connection manager"""
    _instance = None
    _client: Optional[MongoClient] = None
    _db: Optional[Database] = None
    
    def __new__(cls):
        """Singleton pattern to ensure only one connection"""
        if cls._instance is None:
            cls._instance = super(MongoDB, cls).__new__(cls)
            cls._instance._initialize_connection()
        return cls._instance
    
    def _initialize_connection(self):
        """Initialize the MongoDB connection"""
        try:
            settings = get_settings()
            self._client = MongoClient(settings.MONGODB_URI, appname=settings.PROJECT_NAME)
            self._db = self._client[settings.DATABASE_NAME]
            logger.info(f"Connected to MongoDB: {settings.DATABASE_NAME}")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    def get_collection(self, collection_name: str) -> Collection:
        """Get a collection from the database"""
        if not self._db:
            self._initialize_connection()
        return self._db[collection_name]
    
    def close_connection(self):
        """Close the MongoDB connection"""
        if self._client:
            self._client.close()
            self._client = None
            self._db = None
            logger.info("MongoDB connection closed")
    
    def create_vector_search_index(self, collection_name: str, index_name: str, vector_field: str, dimensions: int = 1024):
        """Create a vector search index on a collection"""
        try:
            collection = self.get_collection(collection_name)
            
            # Define the vector search index configuration
            index_config = {
                "name": index_name,
                "type": "vectorSearch",
                "definition": {
                    "fields": [
                        {
                            "path": vector_field,
                            "type": "vector",
                            "numDimensions": dimensions,
                            "similarity": "cosine"
                        }
                    ]
                }
            }
            
            # Create the index
            result = collection.create_search_index(index_config)
            logger.info(f"Vector search index '{index_name}' created successfully")
            return result
        except Exception as e:
            if "already exists" in str(e):
                logger.warning(f"Vector search index '{index_name}' already exists")
                return {"status": "warning", "message": f"Vector search index '{index_name}' already exists"}
            logger.error(f"Error creating vector search index: {e}")
            raise
    
    def __del__(self):
        """Clean up connection when object is destroyed"""
        self.close_connection()

# Instantiate the MongoDB connection
def get_mongodb() -> MongoDB:
    """Get MongoDB connection instance"""
    return MongoDB()
