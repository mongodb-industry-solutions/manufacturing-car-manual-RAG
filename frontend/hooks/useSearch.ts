/**
 * Custom hook for search functionality with caching support
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  SearchMethod, 
  SearchRequest, 
  HybridSearchRequest,
  GraphSearchRequest,
  SearchResponse,
  HybridMethod
} from '../types/Search';
import { searchService } from '../services/searchService';

// Define a cache interface
interface SearchCache {
  [key: string]: SearchResponse;
}

// Create a static cache that persists between component mounts
const GLOBAL_SEARCH_CACHE: SearchCache = {};

// Cache version to invalidate old results after GraphRAG implementation
const CACHE_VERSION = 'v5_reranker_fix';

export interface UseSearchResult {
  search: (
    method: SearchMethod, 
    query: string, 
    limit?: number,
    // GraphRAG-specific parameters
    relationshipTypes?: string[],
    // Reranker parameter
    useReranker?: boolean
  ) => Promise<SearchResponse>;
  searchRef: React.MutableRefObject<((
    method: SearchMethod, 
    query: string, 
    limit?: number,
    relationshipTypes?: string[],
    useReranker?: boolean
  ) => Promise<SearchResponse>) | null>;
  loading: boolean;
  error: string | null;
  results: SearchResponse | null;
  clearCache: () => void;
}

export const useSearch = (): UseSearchResult => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResponse | null>(null);
  
  // Create a stable ref for the search function
  const searchRef = useRef<((
    method: SearchMethod, 
    query: string, 
    limit?: number,
    relationshipTypes?: string[],
    useReranker?: boolean
  ) => Promise<SearchResponse>) | null>(null);
  
  // Remove the automatic cache restoration on mount
  // The page component will handle URL params and trigger searches as needed
  
  // Generate a consistent cache key for searches (memoized)
  const getCacheKey = useCallback((
    method: SearchMethod,
    query: string,
    limit: number = 5,
    relationshipTypes?: string[],
    useReranker: boolean = false
  ): string => {
    if (method === 'graph') {
      const relTypes = relationshipTypes?.sort().join(',') || '';
      return `${CACHE_VERSION}:${method}:${query}:${limit}:${relTypes}:${useReranker}`;
    }
    return `${CACHE_VERSION}:${method}:${query}:${limit}:${useReranker}`;
  }, []);
  
  const search = useCallback(async (
    method: SearchMethod,
    query: string,
    limit: number = 5,
    relationshipTypes?: string[],
    useReranker: boolean = false
  ): Promise<SearchResponse> => {
    // Generate a cache key for this search
    const cacheKey = getCacheKey(method, query, limit, relationshipTypes, useReranker);
    
    // Check if we have a cached result for this exact search
    if (GLOBAL_SEARCH_CACHE[cacheKey]) {
      console.log('Using cached search results');
      const cachedResults = GLOBAL_SEARCH_CACHE[cacheKey];
      setResults(cachedResults);
      return cachedResults;
    }
    
    // No cache hit, perform the search
    setLoading(true);
    setError(null);
    
    try {
      let response: SearchResponse;
      
      switch (method) {
        case 'vector':
          response = await searchService.vectorSearch({ query, limit, use_reranker: useReranker });
          
          // For vector search, clear any text_score fields in results to avoid confusion
          if (response && response.results) {
            response.results = response.results.map(result => ({
              ...result, 
              text_score: undefined // Clear text_score for vector search
            }));
          }
          break;
          
        case 'text':
          response = await searchService.textSearch({ query, limit, use_reranker: useReranker });
          
          // For text search, clear any vector_score fields in results to avoid confusion
          if (response && response.results) {
            response.results = response.results.map(result => ({
              ...result, 
              vector_score: undefined // Clear vector_score for text search
            }));
          }
          break;
          
        case 'hybrid':
          response = await searchService.hybridSearch({
            query,
            limit,
            use_reranker: useReranker
          });
          break;
          
        case 'graph':
          response = await searchService.graphSearch({
            query,
            limit,
            relationship_types: relationshipTypes,
            use_reranker: useReranker
          });
          break;
          
        default:
          throw new Error(`Unknown search method: ${method}`);
      }
      
      // Cache the response
      GLOBAL_SEARCH_CACHE[cacheKey] = response;
      
      setResults(response);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []); // Empty deps - function doesn't depend on any state
  
  // Function to clear the cache if needed
  const clearCache = () => {
    // Clear all cache entries
    Object.keys(GLOBAL_SEARCH_CACHE).forEach(key => {
      delete GLOBAL_SEARCH_CACHE[key];
    });
  };
  
  // Keep searchRef in sync with the search function
  useEffect(() => {
    searchRef.current = search;
  }, [search]);
  
  return { search, searchRef, loading, error, results, clearCache };
};