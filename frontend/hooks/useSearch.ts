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
      rrf_k?: number
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
      rrf_k?: number 
    }
  ): Promise<SearchResponse> => {
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