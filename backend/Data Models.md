# app/models/chunks.py

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class SafetyNotice(BaseModel):
"""Safety notice within a chunk"""
type: str
content: str

class ProceduralStep(BaseModel):
"""Procedural step within a chunk"""
marker: str
instruction: str

class ChunkMetadata(BaseModel):
"""Metadata for a document chunk"""
page_count: int = Field(..., description="Number of pages covered by this chunk")
chunk_length: int = Field(..., description="Length of the chunk text in characters")
systems: Optional[List[str]] = Field(None, description="Vehicle systems referenced in the chunk")
parts: Optional[List[str]] = Field(None, description="Part numbers referenced in the chunk")

class Chunk(BaseModel):
"""Document chunk with rich context"""
id: str = Field(..., description="Unique identifier for the chunk")
text: str = Field(..., description="Text content of the chunk")
context: Optional[str] = Field(None, description="Context string for the chunk")
breadcrumb_trail: Optional[str] = Field(None, description="Hierarchical context path")
page_numbers: List[int] = Field(..., description="Page numbers covered by this chunk")
content_type: Optional[List[str]] = Field(None, description="Types of content in the chunk")
heading_level_1: Optional[str] = Field(None, description="Top-level heading")
heading_level_2: Optional[str] = Field(None, description="Second-level heading")
heading_level_3: Optional[str] = Field(None, description="Third-level heading")
safety_notices: Optional[List[SafetyNotice]] = Field(None, description="Safety warnings in the chunk")
procedural_steps: Optional[List[ProceduralStep]] = Field(None, description="Step-by-step procedures")
part_numbers: Optional[List[str]] = Field(None, description="Part numbers mentioned in the chunk")
vehicle_systems: Optional[List[str]] = Field(None, description="Vehicle systems referenced")
metadata: ChunkMetadata = Field(..., description="Additional metadata about the chunk")
next_chunk_id: Optional[str] = Field(None, description="ID of the next chunk in sequence")
prev_chunk_id: Optional[str] = Field(None, description="ID of the previous chunk in sequence")

    class Config:
        schema_extra = {
            "example": {
                "id": "chunk_0042",
                "text": "To change a flat tire, first ensure the vehicle is safely parked on level ground with the parking brake engaged...",
                "breadcrumb_trail": "Roadside Emergencies > Changing a Tire",
                "page_numbers": [145, 146],
                "content_type": ["procedure", "safety"],
                "heading_level_1": "Roadside Emergencies",
                "heading_level_2": "Changing a Tire",
                "safety_notices": [{"type": "WARNING", "content": "Never get under a vehicle that is supported only by a jack."}],
                "procedural_steps": [
                    {"marker": "1", "instruction": "Park on a level surface, set parking brake, and activate hazard flashers."},
                    {"marker": "2", "instruction": "Place wheel chocks in front and behind the wheel diagonal to the flat tire."}
                ],
                "vehicle_systems": ["suspension", "brakes"],
                "metadata": {"page_count": 2, "chunk_length": 523}
            }
        }

class ChunkList(BaseModel):
"""Response model for a list of chunks"""
total: int = Field(..., description="Total number of chunks matching the query")
chunks: List[Chunk] = Field(..., description="List of chunks")

# app/models/search.py

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
