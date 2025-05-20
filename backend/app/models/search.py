from typing import List, Dict, Any, Optional, Literal, Union
from pydantic import BaseModel, Field, validator
from .chunks import Chunk

class SearchResult(BaseModel):
    """A single search result with score and chunk data"""
    score: float = Field(..., description="Relevance score (0.0 to 100.0, percentile-based)")
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
    
    # This is still supported for backward compatibility
    chunk: Optional[Chunk] = Field(None, description="The full matching chunk object (deprecated)")

class SearchRequest(BaseModel):
    """Request model for search endpoints"""
    query: str = Field(..., description="The search query")
    limit: int = Field(5, ge=1, le=20, description="Maximum number of results to return")

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
    """Request model for hybrid search using explicit RRF"""
    rrf_k: int = Field(
        60,
        ge=1,
        le=100,
        description="RRF k-value parameter for rank fusion (typically 60)"
    )
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

class SearchResponse(BaseModel):
    """Response model for search endpoints"""
    query: str = Field(..., description="The original search query")
    method: str = Field(..., description="The search method used")
    results: List[SearchResult] = Field(..., description="Search results")
    total: int = Field(..., description="Total number of results found")
    debug_info: Optional[Dict[str, Any]] = Field(None, description="Debug information about the search (if enabled)")
