/**
 * Custom hook for search functionality
 */
import { useState } from 'react';
import { 
  SearchMethod, 
  SearchRequest, 
  HybridSearchRequest,
  SearchResponse,
  HybridMethod
} from '../types/Search';
import { searchService } from '../services/searchService';

export interface UseSearchResult {
  search: (
    method: SearchMethod, 
    query: string, 
    limit?: number,
    hybridOptions?: { 
      method: HybridMethod, 
      vector_weight: number, 
      text_weight: number 
    }
  ) => Promise<SearchResponse>;
  loading: boolean;
  error: string | null;
  results: SearchResponse | null;
}

export const useSearch = (): UseSearchResult => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResponse | null>(null);
  
  const search = async (
    method: SearchMethod, 
    query: string, 
    limit: number = 5,
    hybridOptions?: { 
      method: HybridMethod, 
      vector_weight: number, 
      text_weight: number 
    }
  ): Promise<SearchResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      let response: SearchResponse;
      
      switch (method) {
        case 'vector':
          response = await searchService.vectorSearch({ query, limit });
          break;
        case 'text':
          response = await searchService.textSearch({ query, limit });
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
  
  return { search, loading, error, results };
};