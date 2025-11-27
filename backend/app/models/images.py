from typing import List, Optional
from pydantic import BaseModel, Field

from .chunks import ImageMetadata

class ImageDocument(BaseModel):
    """Image document stored in MongoDB with multimodal embeddings"""
    id: str = Field(..., description="Unique image identifier")
    gridfs_file_id: str = Field(..., description="GridFS file reference")
    multimodal_embedding: List[float] = Field(..., description="Voyage multimodal embedding (1024 dimensions)")
    metadata: Optional[ImageMetadata] = Field(None, description="Image metadata (optional for custom images)")
    associated_chunk_ids: List[str] = Field(default_factory=list, description="IDs of associated text chunks")
    breadcrumb_trail: Optional[str] = Field(None, description="Hierarchical context inherited from chunk")
    page_number: Optional[int] = Field(None, description="Page number where image appears")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "image_00001",
                "gridfs_file_id": "507f1f77bcf86cd799439011",
                "multimodal_embedding": [0.123, -0.456, 0.789],
                "metadata": {
                    "gridfs_file_id": "507f1f77bcf86cd799439011",
                    "filename": "engine_diagram_page_42.jpg",
                    "content_type": "image/jpeg",
                    "associated_chunk_ids": ["chunk_00123", "chunk_00124"],
                    "page_number": 42,
                    "caption": "V8 Engine Component Layout",
                    "diagram_type": "mechanical"
                },
                "associated_chunk_ids": ["chunk_00123", "chunk_00124"],
                "breadcrumb_trail": "Engine > Components > Layout",
                "page_number": 42
            }
        }
    }

class ImageSearchResult(BaseModel):
    """Search result for multimodal image search"""
    score: float = Field(..., description="Relevance score")
    image_id: str = Field(..., description="Image document ID")
    gridfs_file_id: str = Field(..., description="GridFS file reference for image retrieval")

    # Rich metadata fields
    title: Optional[str] = Field(None, description="Image title")
    description: Optional[str] = Field(None, description="Detailed description")
    keywords: Optional[List[str]] = Field(None, description="Searchable keywords")
    languages: Optional[List[str]] = Field(None, description="Languages in image")
    category: Optional[str] = Field(None, description="Category/group")

    # Legacy/compatibility fields
    page_number: Optional[int] = Field(None, description="Page number")
    breadcrumb_trail: Optional[str] = Field(None, description="Context path")
    caption: Optional[str] = Field(None, description="Image caption")
    diagram_type: Optional[str] = Field(None, description="Type of diagram")
    associated_chunk_ids: List[str] = Field(default_factory=list, description="Related text chunks")

    # Associated text chunk data (from parallel text search)
    associated_chunks: Optional[List[dict]] = Field(None, description="Text chunks related to this image")

class ImageList(BaseModel):
    """Response model for a list of images"""
    total: int = Field(..., description="Total number of images")
    images: List[ImageDocument] = Field(..., description="List of image documents")

