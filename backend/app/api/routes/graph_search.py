from typing import List, Optional
import logging
from fastapi import APIRouter, Header, HTTPException

from app.models.search import GraphSearchRequest, SearchResponse, KnowledgeGraphResponse, SearchResult
from app.services.embedding import EmbeddingService
from app.services.reranker import VoyageRerankerService
from app.db.repositories.search_new import SearchRepository
from app.core.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter()

def get_debug_flag(x_debug: Optional[str] = Header(None)) -> bool:
    """Check if debug mode is enabled via header"""
    return x_debug is not None and x_debug.lower() == "true"

@router.post("/graph", response_model=SearchResponse)
async def graph_search(request: GraphSearchRequest, x_debug: Optional[str] = Header(None)):
    """
    Perform Hybrid Graph Search using $vectorSearch + $graphLookup
    
    Combines semantic vector search with relationship traversal for enhanced results.
    Uses vector search to find initial seeds, then expands through document relationships.
    
    - **query**: Text to search for
    - **limit**: Maximum number of results to return (1-20)
    - **relationship_types**: Filter specific relationship types
    - **max_depth**: Fixed at 2 for optimal performance
    
    For debug information, set the X-Debug header to "true"
    """
    debug_mode = get_debug_flag(x_debug)
    debug_info = {} if debug_mode else None
    
    try:
        # Log the request parameters
        logger.info(f"Hybrid Graph search request: query='{request.query}', depth=2 (fixed)")
        if debug_mode:
            debug_info["request"] = {
                "query": request.query,
                "limit": request.limit,
                "max_depth": 2,
                "relationship_types": request.relationship_types
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
                method="hybrid_graph",
                results=[],
                total=0,
                debug_info=debug_info
            )
        
        # Initialize search repository
        search_repo = SearchRepository(debug_mode=debug_mode)
        
        if not hasattr(search_repo, 'collection') or search_repo.collection is None:
            error_message = "MongoDB collection is not available"
            logger.error(error_message)
            if debug_mode:
                debug_info["error"] = error_message
                
            return SearchResponse(
                query=request.query,
                method="hybrid_graph",
                results=[],
                total=0,
                debug_info=debug_info
            )
        
        # Perform Hybrid Graph Search using vector-to-graph expansion
        # Fixed traversal depth at 2 for optimal performance
        search_results = await search_repo.vector_to_graph_search(
            query_text=request.query,
            query_embedding=query_embedding,
            max_depth=2,
            limit=request.limit,
            relationship_types=request.relationship_types
        )
        
        # Get debug info from repository if available
        if debug_mode and hasattr(search_repo, 'last_debug_info') and search_repo.last_debug_info:
            debug_info.update(search_repo.last_debug_info)
        
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
            method="hybrid_graph",
            results=search_results,
            total=len(search_results),
            debug_info=debug_info,
            reranking_metadata=reranking_metadata
        )
        
        logger.info(f"Hybrid Graph search completed: found {len(search_results)} results")
        return response
        
    except Exception as e:
        error_message = f"Error in Hybrid Graph search: {str(e)}"
        logger.error(error_message)
        import traceback
        traceback.print_exc()
        
        if debug_mode:
            debug_info["error"] = error_message
            debug_info["traceback"] = traceback.format_exc()
            return SearchResponse(
                query=request.query,
                method="hybrid_graph",
                results=[],
                total=0,
                debug_info=debug_info
            )
        raise HTTPException(status_code=500, detail=error_message)

@router.get("/knowledge-graph", response_model=KnowledgeGraphResponse)
async def get_knowledge_graph(
    query: Optional[str] = None,
    chunk_ids: Optional[List[str]] = None,
    max_nodes: int = 50,
    max_depth: int = 2,
    include_all: bool = False,
    filter_systems: Optional[List[str]] = None,
    filter_content_types: Optional[List[str]] = None,
    min_connections: int = 0,
    x_debug: Optional[str] = Header(None)
):
    """
    Get knowledge graph data for Cytoscape visualization
    
    **Query Mode (default):**
    - **query**: Optional text query to find starting nodes
    - **chunk_ids**: Optional list of specific chunk IDs to start from
    - **max_depth**: Maximum $graphLookup traversal depth (default=2, max=4)
    
    **Full Graph Mode:**
    - **include_all**: Set to True to fetch all chunks (ignores query/chunk_ids)
    - **filter_systems**: Optional list of vehicle systems to filter by
    - **filter_content_types**: Optional list of content types to filter by
    - **min_connections**: Minimum number of relationships a node must have (0 = all)
    
    **Common:**
    - **max_nodes**: Maximum number of nodes to return (default=50, max=1000 for full graph)
    
    Returns graph data in Cytoscape.js format for visualization
    """
    debug_mode = get_debug_flag(x_debug)
    
    try:
        logger.info(f"Knowledge graph request: include_all={include_all}, query='{query}', chunk_ids={chunk_ids}, max_nodes={max_nodes}")
        
        # Initialize search repository
        search_repo = SearchRepository(debug_mode=debug_mode)
        
        if not hasattr(search_repo, 'collection') or search_repo.collection is None:
            error_message = "MongoDB collection is not available"
            logger.error(error_message)
            raise HTTPException(status_code=500, detail=error_message)
        
        # Set appropriate limits based on mode
        if include_all:
            max_nodes_limit = min(max_nodes, 1000)  # Allow up to 1000 nodes for full graph
        else:
            max_nodes_limit = min(max_nodes, 100)   # Cap at 100 for query mode
        
        # Get knowledge graph data
        knowledge_graph = await search_repo.get_knowledge_graph_data(
            query=query,
            chunk_ids=chunk_ids,
            max_nodes=max_nodes_limit,
            max_depth=min(max_depth, 4),
            include_all=include_all,
            filter_systems=filter_systems,
            filter_content_types=filter_content_types,
            min_connections=min_connections
        )
        
        logger.info(f"Knowledge graph completed: {knowledge_graph.total_nodes} nodes, {len(knowledge_graph.elements)} total elements")
        return knowledge_graph
        
    except Exception as e:
        error_message = f"Error generating knowledge graph: {str(e)}"
        logger.error(error_message)
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_message)