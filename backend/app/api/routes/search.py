from typing import List, Optional
import logging
from fastapi import APIRouter, Depends, HTTPException, Query

from app.models.search import (
    SearchRequest, VectorSearchRequest, TextSearchRequest, HybridSearchRequest,
    SearchResponse, SearchResult
)
from app.services.embedding import EmbeddingService
from app.db.repositories.search import SearchRepository

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/vector", response_model=SearchResponse)
async def vector_search(request: VectorSearchRequest):
    """Perform vector search using embedding similarity"""
    try:
        # Generate embedding for the query
        embedding_service = EmbeddingService()
        query_embedding = await embedding_service.generate_embedding(request.query)
        
        # Perform vector search
        search_repo = SearchRepository()
        if not hasattr(search_repo, 'collection') or search_repo.collection is None:
            logger.error("MongoDB collection is not available")
            return SearchResponse(
                query=request.query,
                method="vector",
                results=[],
                total=0
            )
            
        search_results = await search_repo.vector_search(query_embedding, request.limit)
        
        # Return formatted response
        return SearchResponse(
            query=request.query,
            method="vector",
            results=search_results,
            total=len(search_results)
        )
    except Exception as e:
        logger.error(f"Error in vector search: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error in vector search: {str(e)}")

@router.post("/text", response_model=SearchResponse)
async def text_search(request: TextSearchRequest):
    """Perform text search using keywords"""
    try:
        # Perform text search
        search_repo = SearchRepository()
        if not hasattr(search_repo, 'collection') or search_repo.collection is None:
            logger.error("MongoDB collection is not available")
            return SearchResponse(
                query=request.query,
                method="text",
                results=[],
                total=0
            )
            
        search_results = await search_repo.text_search(request.query, request.limit)
        
        # Return formatted response
        return SearchResponse(
            query=request.query,
            method="text",
            results=search_results,
            total=len(search_results)
        )
    except Exception as e:
        logger.error(f"Error in text search: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error in text search: {str(e)}")

@router.post("/hybrid", response_model=SearchResponse)
async def hybrid_search(request: HybridSearchRequest):
    """Perform hybrid search using both vector and text search with RRF"""
    try:
        search_repo = SearchRepository()
        
        # Check if MongoDB collection is available
        if not hasattr(search_repo, 'collection') or search_repo.collection is None:
            logger.error("MongoDB collection is not available")
            return SearchResponse(
                query=request.query,
                method="hybrid_rrf",
                results=[],
                total=0
            )
        
        # Generate embedding for the query
        embedding_service = EmbeddingService()
        query_embedding = await embedding_service.generate_embedding(request.query)
        
        # Perform both search types
        vector_results = await search_repo.vector_search(query_embedding, request.limit)
        text_results = await search_repo.text_search(request.query, request.limit)
        
        # Combine results using RRF with real score calculations
        combined_results = await search_repo.hybrid_search_rrf(
            vector_results=vector_results, 
            text_results=text_results,
            query=request.query,
            embedding=query_embedding
        )
        
        # Limit results to requested number
        combined_results = combined_results[:request.limit]
        
        # Return formatted response
        return SearchResponse(
            query=request.query,
            method="hybrid_rrf",
            results=combined_results,
            total=len(combined_results)
        )
    except Exception as e:
        logger.error(f"Error in hybrid search: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error in hybrid search: {str(e)}")

