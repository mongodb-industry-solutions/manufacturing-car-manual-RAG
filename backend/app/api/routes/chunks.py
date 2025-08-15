from typing import Optional, List
import logging
from fastapi import APIRouter, HTTPException, Query, Depends

from app.models.chunks import Chunk, ChunkList
from app.services.embedding import EmbeddingService
from app.db.repositories.chunks import ChunkRepository

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/", response_model=dict)
async def create_chunk(chunk: Chunk):
    """Create a new document chunk and generate its embedding"""
    try:
        # Generate embedding for the chunk
        embedding_service = EmbeddingService()
        embedding = await embedding_service.generate_embedding(chunk.text)
        
        # Store chunk with embedding
        chunk_repo = ChunkRepository()
        chunk_id = await chunk_repo.create_chunk(chunk, embedding)
        
        return {"id": chunk.id, "message": "Chunk created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/filters", response_model=dict)
async def get_available_filters():
    """Get all available filter values for content types and vehicle systems"""
    try:
        chunk_repo = ChunkRepository()
        if not hasattr(chunk_repo, 'collection') or chunk_repo.collection is None:
            logger.error("MongoDB collection is not available")
            return {"content_types": [], "vehicle_systems": []}
            
        return await chunk_repo.get_available_filters()
    except Exception as e:
        logger.error(f"Error retrieving filters: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving filters: {str(e)}")

@router.get("", response_model=ChunkList)
@router.get("/", response_model=ChunkList)
async def get_chunks(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=10000),
    content_types: Optional[List[str]] = Query(None),
    vehicle_systems: Optional[List[str]] = Query(None),
    has_safety_notices: Optional[bool] = Query(None),
    has_procedures: Optional[bool] = Query(None),
    text_search: Optional[str] = Query(None),
    include_embeddings: bool = Query(False, description="Include embedding data in response (impacts performance)")
):
    """
    Get multiple chunks with pagination and filtering
    
    - **skip**: Number of chunks to skip for pagination
    - **limit**: Maximum number of chunks to return
    - **content_types**: Filter by content types (e.g., procedure, diagram)
    - **vehicle_systems**: Filter by vehicle systems (e.g., brakes, engine)
    - **has_safety_notices**: Filter chunks with safety notices
    - **has_procedures**: Filter chunks with procedural steps
    - **text_search**: Text to search for in chunk content and headings
    """
    try:
        # Debug: log all received parameters
        logger.info(f"Received parameters: content_types={content_types}, vehicle_systems={vehicle_systems}, has_safety_notices={has_safety_notices}, has_procedures={has_procedures}, text_search={text_search}")
        
        # Build filters
        filters = {}
        if content_types:
            filters['content_types'] = content_types
        if vehicle_systems:
            filters['vehicle_systems'] = vehicle_systems
        if has_safety_notices is not None:
            filters['has_safety_notices'] = has_safety_notices
        if has_procedures is not None:
            filters['has_procedures'] = has_procedures
        if text_search:
            filters['text_search'] = text_search
        
        chunk_repo = ChunkRepository()
        if not hasattr(chunk_repo, 'collection') or chunk_repo.collection is None:
            logger.error("MongoDB collection is not available")
            return ChunkList(total=0, chunks=[])
            
        return await chunk_repo.get_chunks(skip, limit, filters, include_embeddings)
    except Exception as e:
        logger.error(f"Error retrieving chunks: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving chunks: {str(e)}")
        
@router.get("/{chunk_id}", response_model=Chunk)
async def get_chunk(chunk_id: str):
    """Get a chunk by ID"""
    try:
        chunk_repo = ChunkRepository()
        if not hasattr(chunk_repo, 'collection') or chunk_repo.collection is None:
            logger.error("MongoDB collection is not available")
            raise HTTPException(status_code=503, detail="Database service unavailable")
            
        chunk = await chunk_repo.get_chunk(chunk_id)
        
        if not chunk:
            raise HTTPException(status_code=404, detail="Chunk not found")
        
        return chunk
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error retrieving chunk: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving chunk: {str(e)}")

@router.put("/{chunk_id}", response_model=dict)
async def update_chunk(chunk_id: str, chunk: Chunk):
    """Update a chunk by ID"""
    try:
        # Check if the chunk exists
        chunk_repo = ChunkRepository()
        existing_chunk = await chunk_repo.get_chunk(chunk_id)
        
        if not existing_chunk:
            raise HTTPException(status_code=404, detail="Chunk not found")
        
        # If text content has changed, regenerate embedding
        embedding = None
        if existing_chunk.text != chunk.text:
            embedding_service = EmbeddingService()
            embedding = await embedding_service.generate_embedding(chunk.text)
        
        # Update chunk in the database
        chunk_dict = chunk.model_dump()
        if embedding:
            result = await chunk_repo.update_chunk(chunk_id, {**chunk_dict, "embedding": embedding})
        else:
            result = await chunk_repo.update_chunk(chunk_id, chunk_dict)
        
        if not result:
            raise HTTPException(status_code=404, detail="Chunk not found")
        
        return {"id": chunk_id, "message": "Chunk updated successfully"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{chunk_id}", response_model=dict)
async def delete_chunk(chunk_id: str):
    """Delete a chunk by ID"""
    try:
        chunk_repo = ChunkRepository()
        result = await chunk_repo.delete_chunk(chunk_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Chunk not found")
        
        return {"id": chunk_id, "message": "Chunk deleted successfully"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
