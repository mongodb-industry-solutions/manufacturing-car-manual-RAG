from typing import Optional, Dict, Any
import logging
from pymongo import MongoClient
from gridfs import GridFS, GridOut
from bson import ObjectId

from app.core.config import get_settings
from app.db.mongodb import get_mongodb

logger = logging.getLogger(__name__)

class GridFSManager:
    """Manager for GridFS operations (image storage and retrieval)"""
    
    def __init__(self):
        """Initialize GridFS manager with MongoDB connection"""
        self.settings = get_settings()
        self.mongodb = get_mongodb()
        self.bucket_name = self.settings.GRIDFS_BUCKET_NAME
        
        # Get the database instance
        if self.mongodb._db is None:
            logger.error("MongoDB database connection is not available")
            raise ValueError("MongoDB database connection is not available")
        
        # Initialize GridFS with the database
        self.fs = GridFS(self.mongodb._db, collection=self.bucket_name)
        logger.info(f"Initialized GridFS manager with bucket: {self.bucket_name}")
    
    def store_image(self, image_path: str, metadata: Dict[str, Any]) -> str:
        """
        Store an image file in GridFS
        
        Args:
            image_path: Path to the image file
            metadata: Dictionary of metadata to store with the image
            
        Returns:
            GridFS file_id as string
        """
        try:
            # Read image file
            with open(image_path, 'rb') as image_file:
                image_bytes = image_file.read()
            
            # Store in GridFS with metadata
            file_id = self.fs.put(
                image_bytes,
                filename=metadata.get('filename', image_path.split('/')[-1]),
                content_type=metadata.get('content_type', 'image/jpeg'),
                metadata=metadata
            )
            
            logger.info(f"Stored image in GridFS with file_id: {file_id}")
            return str(file_id)
            
        except FileNotFoundError:
            logger.error(f"Image file not found: {image_path}")
            raise
        except Exception as e:
            logger.error(f"Error storing image in GridFS: {e}")
            raise
    
    def store_image_bytes(self, image_bytes: bytes, filename: str, metadata: Dict[str, Any]) -> str:
        """
        Store image bytes directly in GridFS
        
        Args:
            image_bytes: Raw image bytes
            filename: Filename to store
            metadata: Dictionary of metadata to store with the image
            
        Returns:
            GridFS file_id as string
        """
        try:
            # Store in GridFS with metadata
            file_id = self.fs.put(
                image_bytes,
                filename=filename,
                content_type=metadata.get('content_type', 'image/jpeg'),
                metadata=metadata
            )
            
            logger.info(f"Stored image bytes in GridFS with file_id: {file_id}")
            return str(file_id)
            
        except Exception as e:
            logger.error(f"Error storing image bytes in GridFS: {e}")
            raise
    
    def get_image(self, file_id: str) -> bytes:
        """
        Retrieve an image from GridFS by file_id
        
        Args:
            file_id: GridFS file_id as string
            
        Returns:
            Image bytes
        """
        try:
            # Convert string file_id to ObjectId
            object_id = ObjectId(file_id)
            
            # Retrieve from GridFS
            grid_out: GridOut = self.fs.get(object_id)
            image_bytes = grid_out.read()
            
            logger.info(f"Retrieved image from GridFS with file_id: {file_id}")
            return image_bytes
            
        except Exception as e:
            logger.error(f"Error retrieving image from GridFS: {e}")
            raise
    
    def get_image_metadata(self, file_id: str) -> Dict[str, Any]:
        """
        Retrieve metadata for an image in GridFS
        
        Args:
            file_id: GridFS file_id as string
            
        Returns:
            Dictionary of metadata
        """
        try:
            # Convert string file_id to ObjectId
            object_id = ObjectId(file_id)
            
            # Retrieve from GridFS
            grid_out: GridOut = self.fs.get(object_id)
            
            metadata = {
                'filename': grid_out.filename,
                'content_type': grid_out.content_type,
                'upload_date': grid_out.upload_date,
                'length': grid_out.length,
                'metadata': grid_out.metadata
            }
            
            logger.info(f"Retrieved metadata from GridFS with file_id: {file_id}")
            return metadata
            
        except Exception as e:
            logger.error(f"Error retrieving metadata from GridFS: {e}")
            raise
    
    def delete_image(self, file_id: str) -> bool:
        """
        Delete an image from GridFS
        
        Args:
            file_id: GridFS file_id as string
            
        Returns:
            True if successful
        """
        try:
            # Convert string file_id to ObjectId
            object_id = ObjectId(file_id)
            
            # Delete from GridFS
            self.fs.delete(object_id)
            
            logger.info(f"Deleted image from GridFS with file_id: {file_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting image from GridFS: {e}")
            raise
    
    def image_exists(self, file_id: str) -> bool:
        """
        Check if an image exists in GridFS
        
        Args:
            file_id: GridFS file_id as string
            
        Returns:
            True if image exists, False otherwise
        """
        try:
            # Convert string file_id to ObjectId
            object_id = ObjectId(file_id)
            
            # Check existence
            return self.fs.exists(object_id)
            
        except Exception as e:
            logger.error(f"Error checking image existence in GridFS: {e}")
            return False

