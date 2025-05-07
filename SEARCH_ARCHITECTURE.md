# Search Architecture Documentation

This document provides an overview of the search architecture in the Car Manual RAG application, including implementation details, features, and optimizations made to the search functionality.

## Table of Contents

1. [Overview](#overview)
2. [Search Methods](#search-methods)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Search Caching](#search-caching)
6. [RRF Scoring Explained](#rrf-scoring-explained)
7. [UI Components](#ui-components)
8. [Browse Chunks Page](#browse-chunks-page)
9. [Optimizations & Fixes](#optimizations--fixes)

## Overview

The application implements a sophisticated search system for a car manual, using a combination of vector search, text search, and hybrid search methods. The system is built on MongoDB Atlas's search capabilities and uses a React/Next.js frontend.

## Search Methods

The application supports three search methods:

1. **Text Search**: Traditional keyword-based search using MongoDB Atlas Search, which finds exact matches or variations of words and phrases.

2. **Vector Search**: Semantic search using vector embeddings, which finds content that is conceptually similar to the query, even if the exact keywords aren't present.

3. **Hybrid Search**: Combines both text and vector search using Reciprocal Rank Fusion (RRF) to provide results that capture both keyword relevance and semantic similarity.

## Backend Implementation

### Search Routes (`/backend/app/api/routes/search.py`)

The backend exposes three main endpoints:
- `POST /search/text` - For keyword-based searches
- `POST /search/vector` - For vector/semantic searches 
- `POST /search/hybrid` - For combined searches using RRF

### Search Repository (`/backend/app/db/repositories/search_new.py`)

The search repository implements the core search functionality:

- **Text Search**: Uses MongoDB's `$search` pipeline stage with a text index to find keyword matches.
- **Vector Search**: Uses MongoDB's `$vectorSearch` pipeline stage to find semantically similar content.
- **Hybrid Search**: Implements a custom pipeline with RRF (Reciprocal Rank Fusion) to combine results from both methods.

### MongoDB Indexes

The application uses two primary search indexes in MongoDB Atlas:
- `manual_text_search_index` - For text search
- `manual_vector_index` - For vector search

## Frontend Implementation

### Search Page (`/frontend/app/search/page.tsx`)

The search page provides a user interface for performing searches and displaying results:

- Search input
- Method selector (text, vector, hybrid)
- Results display
- Additional options for hybrid search (RRF k-value slider)

### Search Hook (`/frontend/hooks/useSearch.ts`)

A custom React hook that manages search state and provides search functionality:

```typescript
const { search, loading, error, results, clearCache } = useSearch();
```

- `search` - Function to perform searches
- `loading` - Loading state
- `error` - Error state
- `results` - Search results
- `clearCache` - Function to clear the search cache

### Search Service (`/frontend/services/searchService.ts`)

Service that handles API calls to the backend search endpoints:

- `vectorSearch` - Calls the vector search endpoint
- `textSearch` - Calls the text search endpoint
- `hybridSearch` - Calls the hybrid search endpoint

## Search Caching

The application implements a sophisticated caching system to prevent unnecessary API calls, especially when navigating between pages:

```typescript
// Global cache object
const GLOBAL_SEARCH_CACHE: SearchCache = {};
```

- Cache keys are generated based on search parameters (method, query, limit, RRF k-value)
- Results are stored in a global cache object
- Cache is checked before performing new searches
- Cache is automatically restored when returning to the search page

### Cache Implementation Details

1. When a search is performed, the results are cached with a unique key
2. When the search page mounts, it checks URL parameters and attempts to restore results from cache
3. A "Clear Search Cache" button allows users to forcibly refresh results

## RRF Scoring Explained

Reciprocal Rank Fusion (RRF) is used for hybrid search, combining text and vector search results:

- **Formula**: `score = 1/(k + rank)`
- **k-value**: A constant (default: 60) that determines the impact of rank differences
- **Component Weights**: Vector and text results are weighted (default: 0.5 each)

### RRF Score Characteristics

- Low scores are mathematically expected (typically 1-5%)
- For a top result with k=60: `1/(60+0) = 0.0167` or 1.67%
- Lower k-values increase scores; higher k-values decrease scores

## UI Components

### SearchMethodSelector (`/frontend/components/search/SearchMethodSelector.tsx`)

Allows users to select the search method and configure parameters:

- Radio buttons for text, vector, and hybrid search
- RRF k-value slider for hybrid search (range: 5-100)
- Information tooltips explaining RRF scoring

### SearchResultCard (`/frontend/components/search/SearchResultCard.tsx`)

Displays individual search results with metadata:

- Result score visualization
- Content type badges
- Page numbers and other metadata
- "View Details" link to chunk details page

### SearchResultList (`/frontend/components/search/SearchResultList.tsx`)

Displays a list of search results:

- Handles empty state
- Shows result count
- Renders individual result cards

## Browse Chunks Page

The Browse Chunks page (`/frontend/app/browse/page.tsx`) allows users to explore chunks directly:

- Content type filtering
- Vehicle system filtering 
- Safety notice and procedural step filtering
- Text filtering
- Pagination

### Pagination Implementation

- Uses a combination of state and refs to manage page state
- Resets pagination when filters change
- Uses component keys to force re-renders when needed

## Optimizations & Fixes

Several optimizations and fixes have been implemented:

1. **Search Caching**: Prevents re-executing searches when navigating back from detail pages
2. **Pagination Reset**: Fixes invalid page errors by resetting pagination when filters change
3. **RRF Explanation**: Added tooltips and explanations for the naturally low RRF scores
4. **Custom Slider**: Implemented a custom HTML range input for RRF k-value adjustment
5. **HTML Nesting Fix**: Resolved invalid HTML nesting that caused hydration errors
6. **URL Parameter Persistence**: Added RRF k-value to URL parameters for consistent state

## Text Search Implementation Details

The text search implementation uses MongoDB Atlas's search capabilities:

```javascript
{
  "$search": {
    "index": "manual_text_search_index",
    "text": {
      "query": queryText,
      "path": ["text", "context", "breadcrumb_trail"],
      "fuzzy": {"maxEdits": 1, "prefixLength": 3}
    }
  }
}
```

The text index has the following definition:

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "breadcrumb_trail": {
        "analyzer": "lucene.english",
        "type": "string"
      },
      "content_type": {
        "type": "stringFacet"
      },
      "context": {
        "analyzer": "lucene.english",
        "type": "string"
      },
      "id": {
        "type": "token"
      },
      "page_numbers": {
        "type": "number"
      },
      "text": {
        "analyzer": "lucene.english",
        "type": "string"
      },
      "vehicle_systems": {
        "type": "stringFacet"
      }
    }
  }
}
```

## Vector Search Implementation Details

Vector search uses MongoDB Atlas's vector search capabilities with cosine similarity:

```javascript
{
  "$vectorSearch": {
    "index": "manual_vector_index",
    "path": "embedding",
    "queryVector": queryEmbedding,
    "numCandidates": numCandidates,
    "limit": limit
  }
}
```

## Hybrid Search RRF Implementation

The hybrid search uses a complex aggregation pipeline to:

1. Run both vector and text searches in parallel
2. Calculate RRF scores for each result set
3. Combine and normalize scores
4. Sort by the combined score

This provides a balanced approach that leverages both the semantic understanding of vector search and the keyword precision of text search.