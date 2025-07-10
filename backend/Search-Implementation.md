# Search Implementation in Car Manual Backend

## Overview

The backend implements a sophisticated search functionality for a car manual system with three main search methods:

1. **Vector Search**: Uses embedding similarity to find semantically similar content
2. **Text Search**: Performs keyword-based search using MongoDB's text indexing
3. **Hybrid Search**: Combines vector and text search using MongoDB's native $rankFusion aggregation stage

## Architecture Components

### API Endpoints (`backend/app/api/routes/search.py`)

- **Vector Search** (`/vector`): Semantic similarity search
- **Text Search** (`/text`): Keyword-based search
- **Hybrid Search** (`/hybrid`): Combined approach using RRF method

### Data Models (`backend/app/models/search.py`)

- **SearchRequest**: Base model with query string and result limit
- **VectorSearchRequest/TextSearchRequest**: Specific search type models
- **HybridSearchRequest**: Adds weight parameters for vector and text components
- **SearchResponse**: Standard response format with results
- **SearchResult**: Individual result with relevance scores and chunk data

### Chunk Model (`backend/app/models/chunks.py`)

- **Chunk**: Rich document segment with metadata including:
  - Hierarchical headings
  - Safety notices
  - Procedural steps
  - Page references
  - Content type

### Database Interactions (`backend/app/db/repositories/search.py`)

- **MongoDB**: Uses MongoDB Atlas for document storage
- **Vector Search**: Leverages MongoDB Atlas Vector Search with a vector index
- **Text Search**: Uses MongoDB text indexing capabilities
- **Repository Pattern**: SearchRepository encapsulates database operations

### Embedding Service (`backend/app/services/embedding.py`)

- Uses Google Vertex AI embedding models (text-embedding-005)
- Generates 768-dimension vectors
- Converts text queries to semantic vectors

## Search Algorithms

### Vector Search

```python
async def vector_search(self, embedding: List[float], limit: int = 5) -> List[SearchResult]:
    pipeline = [
        {
            "$vectorSearch": {
                "index": self.settings.VECTOR_INDEX_NAME,
                "path": self.settings.VECTOR_FIELD_NAME,
                "queryVector": embedding,
                "numCandidates": limit * 10,  # Consider more candidates for better results
                "limit": limit
            }
        },
        {
            "$project": {
                "_id": 0,
                "score": {"$meta": "vectorSearchScore"},
                "chunk": "$$ROOT"
            }
        }
    ]
    
    results = list(self.collection.aggregate(pipeline))
    search_results = []
    
    for result in results:
        score = result.get("score", 0.0)
        
        # Clean up the chunk data for response
        chunk_data = result.get("chunk", {})
        if self.settings.VECTOR_FIELD_NAME in chunk_data:
            del chunk_data[self.settings.VECTOR_FIELD_NAME]
        
        # Create search result object
        search_result = SearchResult(
            score=score,
            vector_score=score,
            chunk=Chunk(**chunk_data)
        )
        search_results.append(search_result)
    
    return search_results
```

Key points:
- Uses MongoDB's `$vectorSearch` aggregation stage for nearest neighbor search
- Sets `numCandidates` to 10x `limit` for better recall
- Captures vector search score in the result
- Removes the embedding vectors from results to reduce payload size

### Text Search with Score Normalization

```python
async def text_search(self, query: str, limit: int = 5) -> List[SearchResult]:
    # Create text index if not exists
    self.collection.create_index([("text", "text")])
    
    # Perform text search
    results = self.collection.find(
        {"$text": {"$search": query}},
        {"score": {"$meta": "textScore"}}
    ).sort([("score", {"$meta": "textScore"})]).limit(limit)
    
    # Convert cursor to list to allow multiple iterations
    results_list = list(results)
    
    # Find the maximum score for normalization
    max_score = 1.0  # Default in case results are empty
    if results_list:
        max_score = max(result.get("score", 0.0) for result in results_list)
        
    search_results = []
    for result in results_list:
        raw_score = result.get("score", 0.0)
        
        # Normalize the score to a 0-1 range
        normalized_score = raw_score / max_score if max_score > 0 else 0.0
        
        # Create search result object
        search_result = SearchResult(
            score=normalized_score,
            text_score=normalized_score,
            chunk=Chunk(**result)
        )
        search_results.append(search_result)
    
    return search_results
```

Key points:
- Creates MongoDB text index if not exists
- Uses `$text` operator with `$search` for text search
- Retrieves raw text scores using MongoDB's `$meta: "textScore"`
- Normalizes scores to 0-1 range by dividing by the maximum score
- This ensures UI displays percentages correctly (≤ 100%)

## Hybrid Search Method

### MongoDB $rankFusion Implementation

```python
async def hybrid_search_rrf(
    self,
    query_text: str,
    query_embedding: List[float],
    limit: int = 5,
    vector_weight: float = 0.5,
    text_weight: float = 0.5,
    num_candidates_multiplier: int = 15
) -> List[SearchResult]:
    """Combine vector and text search results using MongoDB's native $rankFusion"""
    
    # Calculate intermediate limit for robustness
    intermediate_limit = limit * 2
    num_candidates = limit * num_candidates_multiplier

    # Build the $rankFusion aggregation pipeline
    rank_fusion_pipeline = [
        {
            "$rankFusion": {
                "input": {
                    "pipelines": {
                        "vector": [
                            {
                                "$vectorSearch": {
                                    "index": self.vector_index_name,
                                    "path": self.vector_field_name,
                                    "queryVector": query_embedding,
                                    "numCandidates": num_candidates,
                                    "limit": intermediate_limit
                                }
                            }
                        ],
                        "text": [
                            {
                                "$search": {
                                    "index": self.text_index_name,
                                    "text": {
                                        "query": query_text,
                                        "path": ["text", "context", "breadcrumb_trail"],
                                        "fuzzy": {"maxEdits": 1, "prefixLength": 3}
                                    }
                                }
                            },
                            {"$limit": intermediate_limit}
                        ]
                    }
                },
                "combination": {
                    "weights": {
                        "vector": vector_weight,
                        "text": text_weight
                    }
                },
                "scoreDetails": True
            }
        },
        {"$limit": limit},
        {
            "$addFields": {
                "score": {"$meta": "score"},
                "score_details": {"$meta": "scoreDetails"}
            }
        },
        {
            "$project": {
                "_id": 0,
                "score": 1,
                "score_details": 1,
                "chunk_id": "$id",
                "text": 1,
                "context": 1,
                "breadcrumb_trail": 1,
                "page_numbers": 1,
                "content_type": 1,
                "metadata": 1,
                "vehicle_systems": 1
            }
        }
    ]
    
    # Execute the aggregation pipeline
    results = list(self.collection.aggregate(rank_fusion_pipeline))
    
    # Process results and extract individual scores
    search_results = []
    for result in results:
        score = result.get("score", 0.0)
        vector_score = 0.0
        text_score = 0.0
        
        # Extract individual pipeline scores from scoreDetails
        score_details = result.get("score_details", {})
        if score_details and 'details' in score_details:
            details = score_details['details']
            if isinstance(details, list):
                for detail in details:
                    if isinstance(detail, dict):
                        pipeline_name = detail.get('inputPipelineName', '')
                        pipeline_value = detail.get('value', 0.0)
                        
                        if pipeline_name == 'vector':
                            vector_score = pipeline_value
                        elif pipeline_name == 'text':
                            text_score = pipeline_value
        
        search_result = SearchResult(
            score=score,
            vector_score=vector_score,
            text_score=text_score,
            raw_score=score,
            chunk_id=result.get("chunk_id"),
            text=result.get("text", ""),
            context=result.get("context"),
            breadcrumb_trail=result.get("breadcrumb_trail"),
            page_numbers=result.get("page_numbers"),
            content_type=result.get("content_type"),
            metadata=result.get("metadata"),
            vehicle_systems=result.get("vehicle_systems")
        )
        search_results.append(search_result)
    
    return search_results
```

Key points:
- Uses MongoDB's native $rankFusion aggregation stage for optimal performance
- Automatically handles Reciprocal Rank Fusion calculations at the database level
- Reduces pipeline complexity from ~25 stages to ~4 stages
- Extracts individual pipeline scores from scoreDetails metadata
- No manual score normalization - displays raw scores from MongoDB
- Configurable weights for vector and text components

## Frontend Integration

### Score Handling in UI

The frontend displays raw scores without normalization:

```typescript
// Score display with 4 decimal places for precision
const scoreDisplay = score.toFixed(4);

// Individual scores displayed for hybrid search
if (searchMethod === 'hybrid') {
  const vectorScoreDisplay = vectorScore ? vectorScore.toFixed(4) : '0.0000';
  const textScoreDisplay = textScore ? textScore.toFixed(4) : '0.0000';
}

// No score clearing or normalization - raw values from MongoDB are displayed
```

### URL Construction

Ensures proper URL formatting to avoid trailing slashes and redirects:

```typescript
// Search endpoints should NOT have trailing slashes
if (segments.length === 2 && 
    segments[0] === 'search' && 
    ['vector', 'text', 'hybrid'].includes(segments[1])) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}
```

## Configuration Settings

- **Models**: Configurable embedding models via config.json
- **Vector Search**: Configurable dimensions, index name, field name
- **MongoDB**: Connection settings, database and collection names
- **Environment Variables**: Flexible configuration through environment variables

## MongoDB Connection and Vector Index

```python
def create_vector_search_index(self, collection_name: str, index_name: str, vector_field: str, dimensions: int = 768):
    """Create a vector search index on a collection"""
    # Define the vector search index configuration
    index_config = {
        "name": index_name,
        "type": "vectorSearch",
        "definition": {
            "fields": [
                {
                    "path": vector_field,
                    "type": "vector",
                    "numDimensions": dimensions,
                    "similarity": "cosine"
                }
            ]
        }
    }
    
    # Create the index
    result = collection.create_search_index(index_config)
    return result
```

## Performance and Scalability Considerations

- **Indexing**: MongoDB text indexes and vector indexes enable efficient searches
- **Caching**: Could be added for frequent queries to reduce embedding generation
- **Pagination**: All search methods support limiting results (important for large collections)
- **Async Operations**: All database and embedding operations are async for non-blocking I/O