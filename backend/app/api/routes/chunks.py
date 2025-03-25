from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, Depends

from app.models.chunks import Chunk, ChunkList
from app.services.embedding import EmbeddingService
from app.db.repositories.chunks import ChunkRepository

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

@router.get("/{chunk_id}", response_model=Chunk)
async def get_chunk(chunk_id: str):
    """Get a chunk by ID"""
    try:
        chunk_repo = ChunkRepository()
        chunk = await chunk_repo.get_chunk(chunk_id)
        
        if not chunk:
            raise HTTPException(status_code=404, detail="Chunk not found")
        
        return chunk
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=ChunkList)
async def get_chunks(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=1000)):
    """Get multiple chunks with pagination"""
    try:
        chunk_repo = ChunkRepository()
        return await chunk_repo.get_chunks(skip, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
        chunk_dict = chunk.dict()
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
