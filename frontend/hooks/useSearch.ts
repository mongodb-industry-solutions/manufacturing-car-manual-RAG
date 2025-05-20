/**
 * Custom hook for search functionality with caching support
 */
import { useState, useRef, useEffect } from 'react';
import { 
  SearchMethod, 
  SearchRequest, 
  HybridSearchRequest,
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

export interface UseSearchResult {
  search: (
    method: SearchMethod, 
    query: string, 
    limit?: number,
    hybridOptions?: { 
      rrf_k?: number
    }
  ) => Promise<SearchResponse>;
  loading: boolean;
  error: string | null;
  results: SearchResponse | null;
  clearCache: () => void;
}

export const useSearch = (): UseSearchResult => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResponse | null>(null);
  
  // Use a ref to track if we're mounting/initial rendering
  const initialRender = useRef(true);
  
  // This handles restoring cached results when the component mounts
  useEffect(() => {
    // Check URL params to see if we should restore from cache
    if (typeof window !== 'undefined' && initialRender.current) {
      initialRender.current = false;
      
      const urlParams = new URLSearchParams(window.location.search);
      const queryParam = urlParams.get('q');
      const methodParam = urlParams.get('method') as SearchMethod | null;
      const krfParam = urlParams.get('krf');
      
      if (queryParam) {
        // Use method from URL or default to hybrid if not specified
        const method = (methodParam && ['vector', 'text', 'hybrid'].includes(methodParam)) 
          ? methodParam as SearchMethod 
          : 'hybrid';
        
        // Get rrf_k value from URL or use default
        const rrf_k = method === 'hybrid' ? 
          (krfParam ? parseInt(krfParam, 10) : 60) : undefined;
          
        // Create a cache key  
        const cacheKey = getCacheKey(method, queryParam, 10, 
          method === 'hybrid' ? { rrf_k } : undefined);
        
        // Check if we have cached results
        if (GLOBAL_SEARCH_CACHE[cacheKey]) {
          console.log('Restoring search results from cache:', cacheKey);
          setResults(GLOBAL_SEARCH_CACHE[cacheKey]);
        } else {
          console.log('No cached results found for key:', cacheKey);
          // Don't auto-search here; the component will handle this
        }
      }
    }
  }, []);
  
  // Generate a consistent cache key for searches
  const getCacheKey = (
    method: SearchMethod, 
    query: string, 
    limit: number = 5,
    hybridOptions?: { rrf_k?: number }
  ): string => {
    if (method === 'hybrid' && hybridOptions) {
      return `${method}:${query}:${limit}:${hybridOptions.rrf_k}`;
    } else {
      return `${method}:${query}:${limit}`;
    }
  };
  
  const search = async (
    method: SearchMethod, 
    query: string, 
    limit: number = 5,
    hybridOptions?: { 
      rrf_k?: number 
    }
  ): Promise<SearchResponse> => {
    // Generate a cache key for this search
    const cacheKey = getCacheKey(method, query, limit, hybridOptions);
    
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
          response = await searchService.vectorSearch({ query, limit });
          
          // For vector search, clear any text_score fields in results to avoid confusion
          if (response && response.results) {
            response.results = response.results.map(result => ({
              ...result, 
              text_score: undefined // Clear text_score for vector search
            }));
          }
          break;
          
        case 'text':
          response = await searchService.textSearch({ query, limit });
          
          // For text search, clear any vector_score fields in results to avoid confusion
          if (response && response.results) {
            response.results = response.results.map(result => ({
              ...result, 
              vector_score: undefined // Clear vector_score for text search
            }));
          }
          break;
          
        case 'hybrid':
          if (!hybridOptions) {
            throw new Error('Hybrid search requires options');
          }
          response = await searchService.hybridSearch({
            query,
            limit,
            ...hybridOptions
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
  };
  
  // Function to clear the cache if needed
  const clearCache = () => {
    // Clear all cache entries
    Object.keys(GLOBAL_SEARCH_CACHE).forEach(key => {
      delete GLOBAL_SEARCH_CACHE[key];
    });
  };
  
  return { search, loading, error, results, clearCache };
};