from typing import List, Dict, Any, Optional, Literal, Union
from pydantic import BaseModel, Field, validator
from .chunks import Chunk

class SearchResult(BaseModel):
    """A single search result with score and chunk data"""
    score: float = Field(..., description="Raw relevance score (0.0 to 1.0 range for most algorithms)")
    vector_score: Optional[float] = Field(None, description="Vector search component score")
    text_score: Optional[float] = Field(None, description="Text search component score")
    raw_score: Optional[float] = Field(None, description="Raw unprocessed score for debugging")
    chunk_id: Optional[str] = Field(None, description="ID of the matching chunk")
    text: str = Field(..., description="Text content of the chunk")
    context: Optional[str] = Field(None, description="Context string for the chunk")
    breadcrumb_trail: Optional[str] = Field(None, description="Hierarchical context path")
    page_numbers: Optional[List[int]] = Field(None, description="Page numbers covered by this chunk")
    content_type: Optional[List[str]] = Field(None, description="Types of content in the chunk")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata about the chunk")
    vehicle_systems: Optional[List[str]] = Field(None, description="Vehicle systems referenced")
    # GraphRAG-specific fields
    source: Optional[str] = Field(None, description="Source of result: 'vector_seed', 'graph_expansion', 'seed', 'graph'")
    depth: Optional[int] = Field(None, description="Graph traversal depth (0 for seeds, 1+ for expanded)")
    # Heading hierarchy fields
    heading_level_1: Optional[str] = Field(None, description="Top-level heading")
    heading_level_2: Optional[str] = Field(None, description="Second-level heading")
    heading_level_3: Optional[str] = Field(None, description="Third-level heading")
    
    # This is still supported for backward compatibility
    chunk: Optional[Chunk] = Field(None, description="The full matching chunk object (deprecated)")

class SearchRequest(BaseModel):
    """Request model for search endpoints"""
    query: str = Field(..., description="The search query")
    limit: int = Field(5, ge=1, le=50, description="Maximum number of results to return")

class VectorSearchRequest(SearchRequest):
    """Request model for vector search"""
    num_candidates_multiplier: Optional[int] = Field(
        10, 
        ge=1, 
        le=50, 
        description="Multiplier for numCandidates parameter in vector search (limit * multiplier)"
    )

class TextSearchRequest(SearchRequest):
    """Request model for text search"""
    fuzzy: Optional[bool] = Field(
        True,
        description="Whether to use fuzzy matching for text search"
    )
    max_edits: Optional[int] = Field(
        1, 
        ge=0, 
        le=2,
        description="Maximum edit distance for fuzzy matching (0-2)"
    )

class HybridSearchRequest(SearchRequest):
    """Request model for hybrid search using MongoDB $rankFusion"""
    vector_weight: float = Field(
        0.5,
        ge=0.0,
        le=1.0,
        description="Weight applied to vector search scores (0.0-1.0)"
    )
    text_weight: float = Field(
        0.5,
        ge=0.0,
        le=1.0,
        description="Weight applied to text search scores (0.0-1.0)"
    )
    num_candidates_multiplier: int = Field(
        15,
        ge=1,
        le=50,
        description="Multiplier for determining initial candidates (limit * multiplier)"
    )

class GraphSearchRequest(SearchRequest):
    """Request model for GraphRAG search using $graphLookup"""
    expansion_method: Literal["graph_to_vector", "vector_to_graph"] = Field(
        "vector_to_graph", 
        description="Method for expanding search results"
    )
    relationship_types: Optional[List[str]] = Field(
        None, 
        description="Filter specific relationship types for $graphLookup (SEQUENTIAL_TO, RELATED_TO, MENTIONS_SYSTEM, IS_OF_TYPE)"
    )
    graph_weight: float = Field(
        0.6, 
        ge=0.0, 
        le=1.0,
        description="Weight applied to graph expansion results"
    )
    vector_weight: float = Field(
        0.4, 
        ge=0.0, 
        le=1.0,
        description="Weight applied to vector search results"
    )
    num_candidates_multiplier: int = Field(
        15,
        ge=1,
        le=50,
        description="Multiplier for determining vector search candidates"
    )

class CytoscapeNode(BaseModel):
    """Cytoscape.js node format for knowledge graph visualization"""
    data: Dict[str, Any] = Field(..., description="Node data including id, label, type")
    position: Optional[Dict[str, float]] = Field(None, description="x, y coordinates")
    classes: Optional[str] = Field(None, description="CSS classes for styling")
    
class CytoscapeEdge(BaseModel):
    """Cytoscape.js edge format for knowledge graph visualization"""
    data: Dict[str, Any] = Field(..., description="Edge data including source, target, type")
    classes: Optional[str] = Field(None, description="CSS classes for styling")

class KnowledgeGraphResponse(BaseModel):
    """Knowledge graph data in Cytoscape.js format"""
    elements: List[Union[CytoscapeNode, CytoscapeEdge]]
    query_context: Optional[str] = None
    highlighted_node_ids: List[str] = []
    style: List[Dict[str, Any]] = Field(..., description="Cytoscape styling definitions")

class SearchResponse(BaseModel):
    """Response model for search endpoints"""
    query: str = Field(..., description="The original search query")
    method: str = Field(..., description="The search method used")
    results: List[SearchResult] = Field(..., description="Search results")
    total: int = Field(..., description="Total number of results found")
    debug_info: Optional[Dict[str, Any]] = Field(None, description="Debug information about the search (if enabled)")
