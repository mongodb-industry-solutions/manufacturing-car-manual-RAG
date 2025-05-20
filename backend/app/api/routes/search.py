from typing import List, Optional, Dict, Any
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Header

from app.models.search import (
    SearchRequest, VectorSearchRequest, TextSearchRequest, HybridSearchRequest,
    SearchResponse, SearchResult
)
from app.services.embedding import EmbeddingService
# Import the new search repository
from app.db.repositories.search_new import SearchRepository

logger = logging.getLogger(__name__)
router = APIRouter()

def get_debug_flag(x_debug: Optional[str] = Header(None)) -> bool:
    """Check if debug mode is enabled via header"""
    return x_debug is not None and x_debug.lower() == "true"

@router.post("/vector", response_model=SearchResponse)
async def vector_search(request: VectorSearchRequest, x_debug: Optional[str] = Header(None)):
    """
    Perform vector search using embedding similarity
    
    - **query**: Text to search for
    - **limit**: Maximum number of results to return (1-20)
    - **num_candidates_multiplier**: Multiplier for numCandidates (default=10)
    
    For debug information, set the X-Debug header to "true"
    """
    debug_mode = get_debug_flag(x_debug)
    debug_info = {} if debug_mode else None
    
    try:
        # Log the request parameters
        logger.info(f"Vector search request: query='{request.query}', limit={request.limit}")
        if debug_mode:
            debug_info["request"] = {
                "query": request.query,
                "limit": request.limit,
                "num_candidates_multiplier": request.num_candidates_multiplier
            }
        
        # Generate embedding for the query
        embedding_service = EmbeddingService()
        query_embedding = await embedding_service.generate_embedding(request.query)
        
        if not query_embedding:
            error_message = "Failed to generate embedding for query"
            logger.error(error_message)
            if debug_mode:
                debug_info["error"] = error_message
                
            return SearchResponse(
                query=request.query,
                method="vector",
                results=[],
                total=0,
                debug_info=debug_info
            )
        
        # Perform vector search with new implementation
        search_repo = SearchRepository(debug_mode=debug_mode)
        
        if not hasattr(search_repo, 'collection') or search_repo.collection is None:
            error_message = "MongoDB collection is not available"
            logger.error(error_message)
            if debug_mode:
                debug_info["error"] = error_message
                
            return SearchResponse(
                query=request.query,
                method="vector",
                results=[],
                total=0,
                debug_info=debug_info
            )
        
        # Use new vectorSearch implementation
        search_results = await search_repo.vector_search(
            query_embedding=query_embedding, 
            limit=request.limit,
            num_candidates_multiplier=request.num_candidates_multiplier
        )
        
        # Return formatted response
        response = SearchResponse(
            query=request.query,
            method="vector",
            results=search_results,
            total=len(search_results),
            debug_info=debug_info
        )
        
        logger.info(f"Vector search completed: found {len(search_results)} results")
        return response
        
    except Exception as e:
        error_message = f"Error in vector search: {str(e)}"
        logger.error(error_message)
        if debug_mode:
            debug_info["error"] = error_message
            return SearchResponse(
                query=request.query,
                method="vector",
                results=[],
                total=0,
                debug_info=debug_info
            )
        raise HTTPException(status_code=500, detail=error_message)

@router.post("/text", response_model=SearchResponse)
async def text_search(request: TextSearchRequest, x_debug: Optional[str] = Header(None)):
    """
    Perform text search using keywords
    
    - **query**: Text to search for
    - **limit**: Maximum number of results to return (1-20)
    - **fuzzy**: Whether to use fuzzy matching (default=true)
    - **max_edits**: Maximum edit distance for fuzzy matching (0-2, default=1)
    
    For debug information, set the X-Debug header to "true"
    """
    debug_mode = get_debug_flag(x_debug)
    debug_info = {} if debug_mode else None
    
    try:
        # Log the request parameters
        logger.info(f"Text search request: query='{request.query}', limit={request.limit}")
        if debug_mode:
            debug_info["request"] = {
                "query": request.query,
                "limit": request.limit,
                "fuzzy": request.fuzzy,
                "max_edits": request.max_edits
            }
        
        # Perform text search with new implementation
        search_repo = SearchRepository(debug_mode=debug_mode)
        
        if not hasattr(search_repo, 'collection') or search_repo.collection is None:
            error_message = "MongoDB collection is not available"
            logger.error(error_message)
            if debug_mode:
                debug_info["error"] = error_message
                
            return SearchResponse(
                query=request.query,
                method="text",
                results=[],
                total=0,
                debug_info=debug_info
            )
        
        # Use new text search implementation
        search_results = await search_repo.text_search(
            query_text=request.query,
            limit=request.limit,
            fuzzy=request.fuzzy,
            max_edits=request.max_edits
        )
        
        # Return formatted response
        response = SearchResponse(
            query=request.query,
            method="text",
            results=search_results,
            total=len(search_results),
            debug_info=debug_info
        )
        
        logger.info(f"Text search completed: found {len(search_results)} results")
        return response
        
    except Exception as e:
        error_message = f"Error in text search: {str(e)}"
        logger.error(error_message)
        if debug_mode:
            debug_info["error"] = error_message
            return SearchResponse(
                query=request.query,
                method="text",
                results=[],
                total=0,
                debug_info=debug_info
            )
        raise HTTPException(status_code=500, detail=error_message)

@router.post("/hybrid", response_model=SearchResponse)
async def hybrid_search(request: HybridSearchRequest, x_debug: Optional[str] = Header(None)):
    """
    Perform hybrid search using both vector and text search with explicit RRF
    
    - **query**: Text to search for
    - **limit**: Maximum number of results to return (1-20)
    - **rrf_k**: RRF constant for rank fusion (default=60)
    - **vector_weight**: Weight for vector search scores (0.0-1.0, default=0.5)
    - **text_weight**: Weight for text search scores (0.0-1.0, default=0.5)
    - **num_candidates_multiplier**: Multiplier for candidates (default=15)
    
    For debug information, set the X-Debug header to "true"
    """
    debug_mode = get_debug_flag(x_debug)
    debug_info = {} if debug_mode else None
    
    try:
        # Log the request parameters
        logger.info(f"Hybrid search request: query='{request.query}', limit={request.limit}, rrf_k={request.rrf_k}")
        if debug_mode:
            debug_info["request"] = {
                "query": request.query,
                "limit": request.limit,
                "rrf_k": request.rrf_k,
                "vector_weight": request.vector_weight,
                "text_weight": request.text_weight,
                "num_candidates_multiplier": request.num_candidates_multiplier
            }
            
        # Enable debugging to see more details
        debug_mode = True
        
        # Initialize search repository with debug mode
        search_repo = SearchRepository(debug_mode=debug_mode)
        
        # Check if MongoDB collection is available
        if not hasattr(search_repo, 'collection') or search_repo.collection is None:
            error_message = "MongoDB collection is not available"
            logger.error(error_message)
            if debug_mode:
                debug_info["error"] = error_message
                
            return SearchResponse(
                query=request.query,
                method="hybrid_rrf",
                results=[],
                total=0,
                debug_info=debug_info
            )
        
        # Generate embedding for the query
        embedding_service = EmbeddingService()
        query_embedding = await embedding_service.generate_embedding(request.query)
        
        if not query_embedding:
            error_message = "Failed to generate embedding for query"
            logger.error(error_message)
            if debug_mode:
                debug_info["error"] = error_message
                
            return SearchResponse(
                query=request.query,
                method="hybrid_rrf",
                results=[],
                total=0,
                debug_info=debug_info
            )
        
        # Use new hybrid search implementation with explicit RRF calculation
        search_results = await search_repo.hybrid_search_rrf(
            query_text=request.query,
            query_embedding=query_embedding,
            limit=request.limit,
            vector_weight=request.vector_weight,
            text_weight=request.text_weight,
            num_candidates_multiplier=request.num_candidates_multiplier,
            rrf_k=request.rrf_k
        )
        
        # Return formatted response
        response = SearchResponse(
            query=request.query,
            method="hybrid_rrf",
            results=search_results,
            total=len(search_results),
            debug_info=debug_info
        )
        
        logger.info(f"Hybrid search completed: found {len(search_results)} results")
        
        # Log more details about the response for debugging
        if debug_mode and search_results:
            for i, result in enumerate(search_results[:3]):  # Log first 3 results
                logger.info(f"Result {i+1}: score={result.score}, " + 
                           f"raw_score={getattr(result, 'raw_score', 0)}, " +
                           f"vs_score={result.vector_score}, " +
                           f"text_score={result.text_score}")
        elif not search_results:
            logger.warning("No results returned from hybrid search!")
            
        return response
        
    except Exception as e:
        error_message = f"Error in hybrid search: {str(e)}"
        logger.error(error_message)
        # Print full stack trace for debugging
        import traceback
        traceback.print_exc()
        
        if debug_mode:
            debug_info["error"] = error_message
            debug_info["traceback"] = traceback.format_exc()
            return SearchResponse(
                query=request.query,
                method="hybrid_rrf",
                results=[],
                total=0,
                debug_info=debug_info
            )
        raise HTTPException(status_code=500, detail=error_message)

