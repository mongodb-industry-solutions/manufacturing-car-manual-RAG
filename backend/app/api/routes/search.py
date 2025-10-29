from typing import List, Optional, Dict, Any
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Header

from app.models.search import (
    SearchRequest, VectorSearchRequest, TextSearchRequest, HybridSearchRequest, GraphSearchRequest,
    SearchResponse, SearchResult, MultimodalSearchRequest, MultimodalSearchResponse, ImageResultWithChunks
)
from app.services.embedding import EmbeddingService
from app.services.reranker import VoyageRerankerService
# Import the new search repository
from app.db.repositories.search_new import SearchRepository
from app.core.config import get_settings

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
        
        # Apply reranking if requested
        reranking_metadata = None
        if request.use_reranker and search_results:
            try:
                settings = get_settings()
                reranker_service = VoyageRerankerService(api_key=settings.VOYAGE_API_KEY)
                # Convert SearchResult objects to dicts for reranking
                results_dicts = [result.model_dump() if hasattr(result, 'model_dump') else result for result in search_results]
                reranked_dicts, reranking_metadata = reranker_service.rerank(
                    query=request.query,
                    results=results_dicts,
                    include_position_tracking=True
                )
                # Convert back to SearchResult objects
                search_results = [SearchResult(**r) for r in reranked_dicts]
                logger.info(f"Reranking applied: {len(search_results)} results reranked")
            except Exception as e:
                logger.warning(f"Reranking failed, using original results: {e}")
                reranking_metadata = {
                    "reranking_applied": False,
                    "reason": "Reranking error",
                    "error": str(e)
                }
        
        # Return formatted response
        response = SearchResponse(
            query=request.query,
            method="vector",
            results=search_results,
            total=len(search_results),
            debug_info=debug_info,
            reranking_metadata=reranking_metadata
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
        
        # Apply reranking if requested
        reranking_metadata = None
        if request.use_reranker and search_results:
            try:
                settings = get_settings()
                reranker_service = VoyageRerankerService(api_key=settings.VOYAGE_API_KEY)
                # Convert SearchResult objects to dicts for reranking
                results_dicts = [result.model_dump() if hasattr(result, 'model_dump') else result for result in search_results]
                reranked_dicts, reranking_metadata = reranker_service.rerank(
                    query=request.query,
                    results=results_dicts,
                    include_position_tracking=True
                )
                # Convert back to SearchResult objects
                search_results = [SearchResult(**r) for r in reranked_dicts]
                logger.info(f"Reranking applied: {len(search_results)} results reranked")
            except Exception as e:
                logger.warning(f"Reranking failed, using original results: {e}")
                reranking_metadata = {
                    "reranking_applied": False,
                    "reason": "Reranking error",
                    "error": str(e)
                }
        
        # Return formatted response
        response = SearchResponse(
            query=request.query,
            method="text",
            results=search_results,
            total=len(search_results),
            debug_info=debug_info,
            reranking_metadata=reranking_metadata
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
    - **vector_weight**: Weight for vector search scores (0.0-1.0, default=0.5)
    - **text_weight**: Weight for text search scores (0.0-1.0, default=0.5)
    - **num_candidates_multiplier**: Multiplier for candidates (default=15)
    
    For debug information, set the X-Debug header to "true"
    """
    debug_mode = get_debug_flag(x_debug)
    debug_info = {} if debug_mode else None
    
    try:
        # Log the request parameters
        logger.info(f"Hybrid search request: query='{request.query}', limit={request.limit}")
        if debug_mode:
            debug_info["request"] = {
                "query": request.query,
                "limit": request.limit,
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
            num_candidates_multiplier=request.num_candidates_multiplier
        )
        
        # Apply reranking if requested
        reranking_metadata = None
        if request.use_reranker and search_results:
            try:
                settings = get_settings()
                reranker_service = VoyageRerankerService(api_key=settings.VOYAGE_API_KEY)
                # Convert SearchResult objects to dicts for reranking
                results_dicts = [result.model_dump() if hasattr(result, 'model_dump') else result for result in search_results]
                reranked_dicts, reranking_metadata = reranker_service.rerank(
                    query=request.query,
                    results=results_dicts,
                    include_position_tracking=True
                )
                # Convert back to SearchResult objects
                search_results = [SearchResult(**r) for r in reranked_dicts]
                logger.info(f"Reranking applied: {len(search_results)} results reranked")
            except Exception as e:
                logger.warning(f"Reranking failed, using original results: {e}")
                reranking_metadata = {
                    "reranking_applied": False,
                    "reason": "Reranking error",
                    "error": str(e)
                }
        
        # Return formatted response
        response = SearchResponse(
            query=request.query,
            method="hybrid_rrf",
            results=search_results,
            total=len(search_results),
            debug_info=debug_info,
            reranking_metadata=reranking_metadata
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

@router.post("/multimodal", response_model=MultimodalSearchResponse)
async def multimodal_search(request: MultimodalSearchRequest, x_debug: Optional[str] = Header(None)):
    """
    Perform multimodal search using text or image input
    
    - **query_type**: "text" or "image"
    - **query_text**: Text query (required if query_type="text")
    - **image_base64**: Base64 encoded image (required if query_type="image")
    - **limit**: Maximum number of image results to return (1-50)
    - **include_text_chunks**: Whether to include associated text chunks
    
    For text queries: performs parallel multimodal image search + text vector search
    For image queries: performs multimodal image search only
    
    For debug information, set the X-Debug header to "true"
    """
    debug_mode = get_debug_flag(x_debug)
    debug_info = {} if debug_mode else None
    
    try:
        # Import multimodal services
        from app.services.multimodal_embedding import MultimodalEmbeddingService
        from app.db.repositories.images import ImageRepository
        from app.db.repositories.chunks import ChunkRepository
        import base64
        
        logger.info(f"Multimodal search request: query_type='{request.query_type}', limit={request.limit}")
        
        if debug_mode:
            debug_info["request"] = {
                "query_type": request.query_type,
                "limit": request.limit,
                "include_text_chunks": request.include_text_chunks
            }
        
        # Initialize services
        multimodal_service = MultimodalEmbeddingService()
        image_repo = ImageRepository()
        chunk_repo = ChunkRepository()
        
        # Generate embedding based on query type
        if request.query_type == "text":
            if not request.query_text:
                raise HTTPException(status_code=400, detail="query_text is required for text queries")
            
            logger.info(f"Generating multimodal text embedding for query: '{request.query_text}'")
            query_embedding = await multimodal_service.generate_text_embedding(request.query_text)
            query_display = request.query_text
            
        elif request.query_type == "image":
            if not request.image_base64:
                raise HTTPException(status_code=400, detail="image_base64 is required for image queries")
            
            logger.info("Generating multimodal image embedding")
            # Decode base64 image
            image_bytes = base64.b64decode(request.image_base64)
            query_embedding = await multimodal_service.generate_image_embedding(image_bytes)
            query_display = "[Image Query]"
            
        else:
            raise HTTPException(status_code=400, detail=f"Invalid query_type: {request.query_type}")
        
        logger.info(f"Generated multimodal embedding with {len(query_embedding)} dimensions")
        
        # Perform multimodal vector search on images
        logger.info("Performing multimodal vector search on images...")
        image_results = await image_repo.multimodal_vector_search(
            query_embedding=query_embedding,
            limit=request.limit,
            num_candidates_multiplier=request.num_candidates_multiplier
        )
        
        logger.info(f"Found {len(image_results)} image results")
        
        # Fetch associated text chunks for each image if requested
        results_with_chunks = []
        for img_result in image_results:
            associated_chunks = None
            
            if request.include_text_chunks and img_result.associated_chunk_ids:
                associated_chunks = []
                for chunk_id in img_result.associated_chunk_ids:
                    try:
                        chunk = await chunk_repo.get_chunk_by_id(chunk_id)
                        if chunk:
                            search_result = SearchResult(
                                score=1.0,
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
                            associated_chunks.append(search_result)
                    except Exception as e:
                        logger.warning(f"Could not fetch chunk {chunk_id}: {e}")
            
            result_with_chunks = ImageResultWithChunks(
                score=img_result.score,
                image_id=img_result.image_id,
                gridfs_file_id=img_result.gridfs_file_id,

                # NEW: Include rich metadata
                title=img_result.title,
                description=img_result.description,
                keywords=img_result.keywords,
                languages=img_result.languages,
                category=img_result.category,

                # Existing fields
                page_number=img_result.page_number,
                breadcrumb_trail=img_result.breadcrumb_trail,
                caption=img_result.caption,
                diagram_type=img_result.diagram_type,
                associated_chunks=associated_chunks
            )
            results_with_chunks.append(result_with_chunks)

        # Build response
        response = MultimodalSearchResponse(
            query_type=request.query_type,
            query_text=request.query_text if request.query_type == "text" else None,
            image_results=results_with_chunks,
            text_results=None,
            total_images=len(results_with_chunks),
            total_text=None
        )

        logger.info(f"Multimodal search completed: {len(results_with_chunks)} images")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        error_message = f"Error in multimodal search: {str(e)}"
        logger.error(error_message)
        import traceback
        traceback.print_exc()
        
        if debug_mode:
            debug_info["error"] = error_message
            debug_info["traceback"] = traceback.format_exc()
        
        raise HTTPException(status_code=500, detail=error_message)
