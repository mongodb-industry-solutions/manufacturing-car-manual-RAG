from typing import List, Optional, Dict, Any
import logging
from pymongo.collection import Collection

from app.db.mongodb import get_mongodb
from app.core.config import get_settings
from app.models.images import ImageDocument, ImageSearchResult
from app.models.chunks import ImageMetadata

logger = logging.getLogger(__name__)

class ImageRepository:
    """Repository for image document operations in MongoDB"""
    
    def __init__(self):
        """Initialize the repository with MongoDB collection"""
        self.settings = get_settings()
        self.mongodb = get_mongodb()
        # Use unified manuals collection instead of separate images collection
        self.collection_name = self.settings.CHUNKS_COLLECTION

        # Get the collection
        if self.mongodb is not None:
            self.collection: Collection = self.mongodb.get_collection(self.collection_name)
            logger.info(f"Connected to unified collection: {self.collection_name}")
        else:
            logger.error("MongoDB connection is not available")
            self.collection = None
    
    def insert_image(self, image_doc: ImageDocument) -> str:
        """
        Insert an image document into the collection
        
        Args:
            image_doc: ImageDocument to insert
            
        Returns:
            Image ID of inserted document
        """
        try:
            if self.collection is None:
                raise ValueError("MongoDB collection is not available")
            
            # Convert to dict for insertion
            doc_dict = image_doc.model_dump()
            
            # Insert into collection
            result = self.collection.insert_one(doc_dict)
            logger.info(f"Inserted image document with id: {image_doc.id}")
            
            return image_doc.id
            
        except Exception as e:
            logger.error(f"Error inserting image document: {e}")
            raise
    
    def get_image_by_id(self, image_id: str) -> Optional[ImageDocument]:
        """
        Retrieve an image document by ID
        
        Args:
            image_id: Image document ID
            
        Returns:
            ImageDocument if found, None otherwise
        """
        try:
            if self.collection is None:
                raise ValueError("MongoDB collection is not available")
            
            # Query by ID
            doc = self.collection.find_one({"id": image_id})
            
            if doc:
                # Remove MongoDB's _id field
                doc.pop('_id', None)
                return ImageDocument(**doc)
            
            logger.warning(f"Image document not found: {image_id}")
            return None
            
        except Exception as e:
            logger.error(f"Error retrieving image document: {e}")
            raise
    
    def get_all_images(self, limit: Optional[int] = None) -> List[ImageDocument]:
        """
        Retrieve all image documents
        
        Args:
            limit: Optional limit on number of results
            
        Returns:
            List of ImageDocument objects
        """
        try:
            if self.collection is None:
                raise ValueError("MongoDB collection is not available")
            
            # Query all documents
            query = self.collection.find({})
            
            if limit:
                query = query.limit(limit)
            
            images = []
            for doc in query:
                # Remove MongoDB's _id field
                doc.pop('_id', None)
                images.append(ImageDocument(**doc))
            
            logger.info(f"Retrieved {len(images)} image documents")
            return images
            
        except Exception as e:
            logger.error(f"Error retrieving image documents: {e}")
            raise
    
    def get_images_by_page(self, page_number: int) -> List[ImageDocument]:
        """
        Retrieve image documents by page number
        
        Args:
            page_number: Page number to filter by
            
        Returns:
            List of ImageDocument objects
        """
        try:
            if self.collection is None:
                raise ValueError("MongoDB collection is not available")
            
            # Query by page number
            docs = self.collection.find({"page_number": page_number})
            
            images = []
            for doc in docs:
                # Remove MongoDB's _id field
                doc.pop('_id', None)
                images.append(ImageDocument(**doc))
            
            logger.info(f"Retrieved {len(images)} images for page {page_number}")
            return images
            
        except Exception as e:
            logger.error(f"Error retrieving images by page: {e}")
            raise
    
    def delete_image(self, image_id: str) -> bool:
        """
        Delete an image document by ID
        
        Args:
            image_id: Image document ID
            
        Returns:
            True if deleted, False otherwise
        """
        try:
            if self.collection is None:
                raise ValueError("MongoDB collection is not available")
            
            # Delete by ID
            result = self.collection.delete_one({"id": image_id})
            
            if result.deleted_count > 0:
                logger.info(f"Deleted image document: {image_id}")
                return True
            
            logger.warning(f"Image document not found for deletion: {image_id}")
            return False
            
        except Exception as e:
            logger.error(f"Error deleting image document: {e}")
            raise
    
    async def multimodal_vector_search(
        self,
        query_embedding: List[float],
        limit: int = 10,
        num_candidates_multiplier: int = 10
    ) -> List[ImageSearchResult]:
        """
        Perform vector search on multimodal embeddings in unified collection

        Args:
            query_embedding: Query embedding vector (1024 dimensions)
            limit: Maximum number of results
            num_candidates_multiplier: Multiplier for numCandidates

        Returns:
            List of ImageSearchResult objects
        """
        try:
            if self.collection is None:
                raise ValueError("MongoDB collection is not available")

            # Calculate numCandidates
            num_candidates = limit * num_candidates_multiplier

            # Build vector search pipeline
            # Note: No filter needed - vector search only returns documents with multimodal_embedding field
            pipeline = [
                {
                    "$vectorSearch": {
                        "index": self.settings.MULTIMODAL_VECTOR_INDEX_NAME,
                        "path": "multimodal_embedding",
                        "queryVector": query_embedding,
                        "numCandidates": num_candidates,
                        "limit": limit
                    }
                },
                {
                    "$project": {
                        "_id": 0,
                        "score": {"$meta": "vectorSearchScore"},
                        "image_id": "$id",
                        "gridfs_file_id": "$gridfs_file_id",

                        # NEW: Rich metadata fields
                        "title": 1,
                        "description": 1,
                        "keywords": 1,
                        "languages": 1,
                        "category": 1,

                        # Existing fields
                        "page_number": {"$arrayElemAt": ["$page_numbers", 0]},  # Get first page number
                        "breadcrumb_trail": 1,
                        "caption": "$description",  # Map description to caption for compatibility
                        "diagram_type": "$category",  # Map category to diagram_type for compatibility
                        "associated_chunk_ids": 1
                    }
                }
            ]

            # Execute pipeline
            results = list(self.collection.aggregate(pipeline))

            logger.info(f"Multimodal vector search found {len(results)} results in unified collection")

            # Convert to ImageSearchResult objects
            search_results = []
            for result in results:
                search_results.append(ImageSearchResult(**result))

            return search_results

        except Exception as e:
            logger.error(f"Error in multimodal vector search: {e}")
            raise
    
    def count_images(self) -> int:
        """
        Count total number of image documents
        
        Returns:
            Total count
        """
        try:
            if self.collection is None:
                raise ValueError("MongoDB collection is not available")
            
            return self.collection.count_documents({})
            
        except Exception as e:
            logger.error(f"Error counting image documents: {e}")
            raise

