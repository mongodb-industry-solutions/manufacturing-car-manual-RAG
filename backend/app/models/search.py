from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field, validator
from .chunks import Chunk

class SearchResult(BaseModel):
    """A single search result with score and chunk data"""
    score: float = Field(..., description="Relevance score (0.0 to 1.0)")
    vector_score: Optional[float] = Field(None, description="Vector search component score")
    text_score: Optional[float] = Field(None, description="Text search component score")
    chunk: Chunk = Field(..., description="The matching chunk")

class SearchRequest(BaseModel):
    """Request model for search endpoints"""
    query: str = Field(..., description="The search query")
    limit: int = Field(5, ge=1, le=20, description="Maximum number of results to return")

class VectorSearchRequest(SearchRequest):
    """Request model for vector search"""
    pass

class TextSearchRequest(SearchRequest):
    """Request model for text search"""
    pass

class HybridSearchRequest(SearchRequest):
    """Request model for hybrid search"""
    method: Literal["rrf", "weighted", "union"] = Field(
        "rrf",
        description="Method to combine vector and text search results"
    )
    vector_weight: float = Field(
        0.7,
        ge=0.0,
        le=1.0,
        description="Weight for vector search (0.0 to 1.0)"
    )
    text_weight: float = Field(
        0.3,
        ge=0.0,
        le=1.0,
        description="Weight for text search (0.0 to 1.0)"
    )

    @validator('text_weight')
    def weights_sum_to_one(cls, v, values):
        """Ensure weights sum to approximately 1.0"""
        if 'vector_weight' in values and abs(values['vector_weight'] + v - 1.0) > 0.01:
            raise ValueError('vector_weight and text_weight must sum to 1.0')
        return v

class SearchResponse(BaseModel):
    """Response model for search endpoints"""
    query: str = Field(..., description="The original search query")
    method: str = Field(..., description="The search method used")
    results: List[SearchResult] = Field(..., description="Search results")
    total: int = Field(..., description="Total number of results found")
