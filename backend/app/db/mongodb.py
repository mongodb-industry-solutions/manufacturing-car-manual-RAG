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
            self._client = None
            self._db = None
    
    def get_collection(self, collection_name: str) -> Optional[Collection]:
        """Get a collection from the database"""
        try:
            if self._db is None:
                self._initialize_connection()
                
            if self._db is None:
                logger.error("Failed to get database connection")
                return None
                
            return self._db[collection_name]
        except Exception as e:
            logger.error(f"Error getting collection: {e}")
            return None
    
    def close_connection(self):
        """Close the MongoDB connection"""
        if self._client is not None:
            self._client.close()
            self._client = None
            self._db = None
            logger.info("MongoDB connection closed")
    
    def create_vector_search_index(self, collection_name: str, index_name: str, vector_field: str, dimensions: int = 1024):
        """Create a vector search index on a collection"""
        try:
            collection = self.get_collection(collection_name)
            if collection is None:
                logger.error("Cannot create vector search index: collection is None")
                return {"status": "error", "message": "Database connection unavailable"}
            
            # Check if index already exists first
            existing_indexes = collection.list_search_indexes()
            for index in existing_indexes:
                if index.get("name") == index_name:
                    logger.debug(f"Vector search index '{index_name}' already exists")
                    return {"status": "success", "message": f"Vector search index '{index_name}' already exists"}
                
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
            # Handle the "already exists" error case more explicitly
            if "already defined" in str(e) or "already exists" in str(e):
                # This is an expected condition, so just log at debug level
                logger.debug(f"Vector search index '{index_name}' already exists")
                return {"status": "success", "message": f"Vector search index '{index_name}' already exists"}
            
            # Log other errors as actual errors
            logger.error(f"Error creating vector search index: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    def __bool__(self):
        """Define truth value for the MongoDB instance"""
        return self._db is not None
    
    def __del__(self):
        """Clean up connection when object is destroyed"""
        self.close_connection()

# Instantiate the MongoDB connection
def get_mongodb() -> MongoDB:
    """Get MongoDB connection instance"""
    return MongoDB()
