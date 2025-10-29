from typing import List, Optional
import logging
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import StreamingResponse
import io

from app.models.images import ImageDocument, ImageList
from app.models.search import SearchResult
from app.db.repositories.images import ImageRepository
from app.db.repositories.chunks import ChunkRepository
from app.db.gridfs_manager import GridFSManager

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/all", response_model=ImageList)
async def get_all_images(limit: Optional[int] = None):
    """
    Get all images with metadata (for sample image selection)
    
    - **limit**: Optional limit on number of results
    """
    try:
        image_repo = ImageRepository()
        images = image_repo.get_all_images(limit=limit)
        
        return ImageList(
            total=len(images),
            images=images
        )
    except Exception as e:
        logger.error(f"Error fetching all images: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{image_id}", response_model=ImageDocument)
async def get_image_metadata(image_id: str):
    """
    Get image document metadata by ID
    
    - **image_id**: Image document ID
    """
    try:
        image_repo = ImageRepository()
        image_doc = image_repo.get_image_by_id(image_id)
        
        if not image_doc:
            raise HTTPException(status_code=404, detail=f"Image not found: {image_id}")
        
        return image_doc
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching image metadata: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{image_id}/file")
async def get_image_file(image_id: str):
    """
    Get the actual image file from GridFS
    
    - **image_id**: Image document ID
    
    Returns the image file as binary data
    """
    try:
        # Get image document to find GridFS file ID
        image_repo = ImageRepository()
        image_doc = image_repo.get_image_by_id(image_id)
        
        if not image_doc:
            raise HTTPException(status_code=404, detail=f"Image not found: {image_id}")
        
        # Retrieve image from GridFS
        gridfs_manager = GridFSManager()
        image_bytes = gridfs_manager.get_image(image_doc.gridfs_file_id)

        # Get content type from metadata (if available) or default to JPEG
        if image_doc.metadata:
            content_type = image_doc.metadata.content_type or "image/jpeg"
            filename = image_doc.metadata.filename or f"{image_id}.jpg"
        else:
            # For custom images without metadata
            content_type = "image/jpeg"
            filename = f"{image_id}.jpg"

        # Sanitize filename to ASCII for HTTP header compatibility
        # Replace non-ASCII characters with underscores
        safe_filename = filename.encode('ascii', 'replace').decode('ascii').replace('?', '_')

        # Return as streaming response
        return StreamingResponse(
            io.BytesIO(image_bytes),
            media_type=content_type,
            headers={
                "Content-Disposition": f'inline; filename="{safe_filename}"'
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching image file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{image_id}/chunks", response_model=List[SearchResult])
async def get_image_chunks(image_id: str):
    """
    Get associated text chunks for an image
    
    - **image_id**: Image document ID
    
    Returns list of associated text chunks
    """
    try:
        # Get image document
        image_repo = ImageRepository()
        image_doc = image_repo.get_image_by_id(image_id)
        
        if not image_doc:
            raise HTTPException(status_code=404, detail=f"Image not found: {image_id}")
        
        if not image_doc.associated_chunk_ids:
            return []
        
        # Fetch associated chunks
        chunk_repo = ChunkRepository()
        chunks_results = []
        
        for chunk_id in image_doc.associated_chunk_ids:
            chunk = await chunk_repo.get_chunk_by_id(chunk_id)
            if chunk:
                # Convert to SearchResult format
                search_result = SearchResult(
                    score=1.0,  # Not a search result, so score is 1.0
                    chunk_id=chunk.id,
                    text=chunk.text,
                    context=chunk.context,
                    breadcrumb_trail=chunk.breadcrumb_trail,
                    page_numbers=chunk.page_numbers,
                    content_type=chunk.content_type,
                    metadata=chunk.metadata.model_dump() if chunk.metadata else None,
                    vehicle_systems=chunk.vehicle_systems,
                    heading_level_1=chunk.heading_level_1,
                    heading_level_2=chunk.heading_level_2,
                    heading_level_3=chunk.heading_level_3
                )
                chunks_results.append(search_result)
        
        return chunks_results
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching image chunks: {e}")
        raise HTTPException(status_code=500, detail=str(e))

