from typing import List, Optional
import logging
from fastapi import APIRouter, Header, HTTPException

from app.models.search import GraphSearchRequest, SearchResponse, KnowledgeGraphResponse
from app.services.embedding import EmbeddingService
from app.db.repositories.search_new import SearchRepository

logger = logging.getLogger(__name__)
router = APIRouter()

def get_debug_flag(x_debug: Optional[str] = Header(None)) -> bool:
    """Check if debug mode is enabled via header"""
    return x_debug is not None and x_debug.lower() == "true"

@router.post("/graph", response_model=SearchResponse)
async def graph_search(request: GraphSearchRequest, x_debug: Optional[str] = Header(None)):
    """
    Perform GraphRAG search using $graphLookup relationship expansion
    
    - **query**: Text to search for
    - **limit**: Maximum number of results to return (1-20)
    - **expansion_method**: "vector_to_graph" or "graph_to_vector"
    - **max_depth**: Maximum $graphLookup traversal depth (1-4)
    - **relationship_types**: Filter specific relationship types
    - **graph_weight**: Weight for graph expansion (0.0-1.0)
    - **vector_weight**: Weight for vector search (0.0-1.0)
    
    For debug information, set the X-Debug header to "true"
    """
    debug_mode = get_debug_flag(x_debug)
    debug_info = {} if debug_mode else None
    
    try:
        # Log the request parameters
        logger.info(f"GraphRAG search request: query='{request.query}', method={request.expansion_method}, depth=2 (fixed)")
        if debug_mode:
            debug_info["request"] = {
                "query": request.query,
                "limit": request.limit,
                "expansion_method": request.expansion_method,
                "max_depth": 2,
                "relationship_types": request.relationship_types,
                "graph_weight": request.graph_weight,
                "vector_weight": request.vector_weight
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
                method=f"graph_{request.expansion_method}",
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
                method=f"graph_{request.expansion_method}",
                results=[],
                total=0,
                debug_info=debug_info
            )
        
        # Perform GraphRAG search based on expansion method
        # Fixed traversal depth at 2 for optimal performance
        if request.expansion_method == "graph_to_vector":
            search_results = await search_repo.graph_to_vector_search(
                query_text=request.query,
                query_embedding=query_embedding,
                max_depth=2,
                limit=request.limit,
                relationship_types=request.relationship_types
            )
        elif request.expansion_method == "vector_to_graph":
            search_results = await search_repo.vector_to_graph_search(
                query_text=request.query,
                query_embedding=query_embedding,
                max_depth=2,
                limit=request.limit,
                relationship_types=request.relationship_types
            )
        else:
            error_message = f"Unknown expansion method: {request.expansion_method}"
            logger.error(error_message)
            if debug_mode:
                debug_info["error"] = error_message
                
            return SearchResponse(
                query=request.query,
                method=f"graph_{request.expansion_method}",
                results=[],
                total=0,
                debug_info=debug_info
            )
        
        # Get debug info from repository if available
        if debug_mode and hasattr(search_repo, 'last_debug_info') and search_repo.last_debug_info:
            debug_info.update(search_repo.last_debug_info)
        
        # Return formatted response
        response = SearchResponse(
            query=request.query,
            method=f"graph_{request.expansion_method}",
            results=search_results,
            total=len(search_results),
            debug_info=debug_info
        )
        
        logger.info(f"GraphRAG search completed: found {len(search_results)} results using {request.expansion_method}")
        return response
        
    except Exception as e:
        error_message = f"Error in GraphRAG search: {str(e)}"
        logger.error(error_message)
        import traceback
        traceback.print_exc()
        
        if debug_mode:
            debug_info["error"] = error_message
            debug_info["traceback"] = traceback.format_exc()
            return SearchResponse(
                query=request.query,
                method=f"graph_{request.expansion_method if hasattr(request, 'expansion_method') else 'unknown'}",
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
    x_debug: Optional[str] = Header(None)
):
    """
    Get knowledge graph data for Cytoscape visualization using $graphLookup
    
    - **query**: Optional text query to find starting nodes
    - **chunk_ids**: Optional list of specific chunk IDs to start from
    - **max_nodes**: Maximum number of nodes to return (default=50, max=100)
    - **max_depth**: Maximum $graphLookup traversal depth (default=2, max=4)
    
    Returns graph data in Cytoscape.js format for visualization
    """
    debug_mode = get_debug_flag(x_debug)
    
    try:
        logger.info(f"Knowledge graph request: query='{query}', chunk_ids={chunk_ids}, max_nodes={max_nodes}, max_depth={max_depth}")
        
        # Initialize search repository
        search_repo = SearchRepository(debug_mode=debug_mode)
        
        if not hasattr(search_repo, 'collection') or search_repo.collection is None:
            error_message = "MongoDB collection is not available"
            logger.error(error_message)
            raise HTTPException(status_code=500, detail=error_message)
        
        # Get knowledge graph data
        knowledge_graph = await search_repo.get_knowledge_graph_data(
            query=query,
            chunk_ids=chunk_ids,
            max_nodes=min(max_nodes, 100),  # Cap at 100 nodes
            max_depth=min(max_depth, 4)     # Cap at 4 depth
        )
        
        logger.info(f"Knowledge graph completed: {len(knowledge_graph.elements)} elements returned")
        return knowledge_graph
        
    except Exception as e:
        error_message = f"Error generating knowledge graph: {str(e)}"
        logger.error(error_message)
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_message)