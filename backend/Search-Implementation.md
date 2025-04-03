# Search Implementation in Car Manual Backend

## Overview

The backend implements a sophisticated search functionality for a car manual system with three main search methods:

1. **Vector Search**: Uses embedding similarity to find semantically similar content
2. **Text Search**: Performs keyword-based search using MongoDB's text indexing
3. **Hybrid Search**: Combines vector and text search using Reciprocal Rank Fusion (RRF)

## Architecture Components

### API Endpoints (`backend/app/api/routes/search.py`)

- **Vector Search** (`/vector`): Semantic similarity search
- **Text Search** (`/text`): Keyword-based search
- **Hybrid Search** (`/hybrid`): Combined approach using RRF method

### Data Models (`backend/app/models/search.py`)

- **SearchRequest**: Base model with query string and result limit
- **VectorSearchRequest/TextSearchRequest**: Specific search type models
- **HybridSearchRequest**: Adds RRF k-parameter configuration
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

### RRF (Reciprocal Rank Fusion)

```python
async def hybrid_search_rrf(self, vector_results: List[SearchResult], text_results: List[SearchResult], k: int = 60) -> List[SearchResult]:
    """Combine vector and text search results using Reciprocal Rank Fusion"""
    # Create a map of chunk_id to search result for easy lookup
    result_map = {}
    
    # Process vector results
    for i, result in enumerate(vector_results):
        chunk_id = result.chunk.id
        # RRF formula: 1 / (k + rank), where rank is 0-based
        rrf_score = 1.0 / (k + i)
        result_map[chunk_id] = {
            "chunk": result.chunk,
            "vector_score": result.vector_score,
            "text_score": 0.0,  # Initialize text_score to 0 for vector-only results
            "rrf_score": rrf_score
        }
    
    # Process text results and combine scores
    for i, result in enumerate(text_results):
        chunk_id = result.chunk.id
        rrf_score = 1.0 / (k + i)
        
        if chunk_id in result_map:
            # Update existing entry
            result_map[chunk_id]["text_score"] = result.text_score
            result_map[chunk_id]["rrf_score"] += rrf_score
        else:
            # Add new entry
            result_map[chunk_id] = {
                "chunk": result.chunk,
                "text_score": result.text_score,
                "vector_score": 0.0,  # Initialize vector_score to 0 for text-only results
                "rrf_score": rrf_score
            }
    
    # Find the maximum RRF score for normalization
    max_rrf_score = max((data["rrf_score"] for data in result_map.values()), default=1.0)
    
    # Convert to list and sort by RRF score
    combined_results = []
    for chunk_id, data in result_map.items():
        # Normalize RRF score to 0-1 range by dividing by maximum score
        normalized_score = data["rrf_score"] / max_rrf_score if max_rrf_score > 0 else 0.0
        
        combined_results.append(SearchResult(
            score=normalized_score,  # Use normalized score instead of raw RRF score
            vector_score=data["vector_score"],  # Always present now
            text_score=data["text_score"],  # Always present now
            chunk=data["chunk"]
        ))
    
    # Sort by normalized score (descending)
    combined_results.sort(key=lambda x: x.score, reverse=True)
    return combined_results
```

Key points:
- Implements the Reciprocal Rank Fusion algorithm with k=60
- Combines vector and text search results based on their rank positions
- Initializes missing scores (0.0) so every result has both vector and text scores
- Normalizes final RRF scores to 0-1 range for consistent UI display
- Ensures all three score types (overall, vector, text) are available for every result

## Frontend Integration

### Score Handling in UI

The frontend selectively displays scores based on the search method:

```typescript
// For vector search, clear any text_score fields in results to avoid confusion
if (method === 'vector' && response && response.results) {
  response.results = response.results.map(result => ({
    ...result, 
    text_score: undefined // Clear text_score for vector search
  }));
}

// For text search, clear any vector_score fields in results to avoid confusion
if (method === 'text' && response && response.results) {
  response.results = response.results.map(result => ({
    ...result, 
    vector_score: undefined // Clear vector_score for text search
  }));
}

// For hybrid search, both vector_score and text_score are preserved
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