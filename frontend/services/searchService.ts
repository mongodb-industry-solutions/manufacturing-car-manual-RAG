/**
 * Search service for car manual RAG application
 */
import { apiPost, apiGet } from './api';
import { 
  SearchRequest, 
  VectorSearchRequest, 
  TextSearchRequest, 
  HybridSearchRequest, 
  SearchResponse,
  AskResponse
} from '../types/Search';
import { Chunk, ChunkList } from '../types/Chunk';

export const searchService = {
  /**
   * Perform vector search using embeddings
   */
  vectorSearch: async (request: VectorSearchRequest): Promise<SearchResponse> => {
    const response = await apiPost<SearchResponse>('/search/vector', request);
    
    // Ensure backward compatibility for frontend components
    if (response && response.results) {
      response.results = response.results.map(result => {
        // If the result uses the new flattened format, wrap it in a chunk structure
        // to maintain compatibility with the UI components that still expect chunk.id
        if (result.chunk_id && !result.chunk) {
          return {
            ...result,
            chunk: {
              id: result.chunk_id,
              text: result.text || '',
              context: result.context,
              breadcrumb_trail: result.breadcrumb_trail,
              page_numbers: result.page_numbers || [],
              content_type: result.content_type,
              metadata: result.metadata,
              vehicle_systems: result.vehicle_systems
            }
          };
        }
        return result;
      });
    }
    
    return response;
  },
  
  /**
   * Perform text search using keywords
   */
  textSearch: async (request: TextSearchRequest): Promise<SearchResponse> => {
    const response = await apiPost<SearchResponse>('/search/text', request);
    
    // Ensure backward compatibility for frontend components
    if (response && response.results) {
      response.results = response.results.map(result => {
        // If the result uses the new flattened format, wrap it in a chunk structure
        // to maintain compatibility with the UI components that still expect chunk.id
        if (result.chunk_id && !result.chunk) {
          return {
            ...result,
            chunk: {
              id: result.chunk_id,
              text: result.text || '',
              context: result.context,
              breadcrumb_trail: result.breadcrumb_trail,
              page_numbers: result.page_numbers || [],
              content_type: result.content_type,
              metadata: result.metadata,
              vehicle_systems: result.vehicle_systems
            }
          };
        }
        return result;
      });
    }
    
    return response;
  },
  
  /**
   * Perform hybrid search combining vector and text approaches
   */
  hybridSearch: async (request: HybridSearchRequest): Promise<SearchResponse> => {
    const response = await apiPost<SearchResponse>('/search/hybrid', request);
    
    // Ensure backward compatibility for frontend components
    if (response && response.results) {
      response.results = response.results.map(result => {
        // If the result uses the new flattened format, wrap it in a chunk structure
        // to maintain compatibility with the UI components that still expect chunk.id
        if (result.chunk_id && !result.chunk) {
          return {
            ...result,
            chunk: {
              id: result.chunk_id,
              text: result.text || '',
              context: result.context,
              breadcrumb_trail: result.breadcrumb_trail,
              page_numbers: result.page_numbers || [],
              content_type: result.content_type,
              metadata: result.metadata,
              vehicle_systems: result.vehicle_systems
            }
          };
        }
        return result;
      });
    }
    
    return response;
  },
  
  
  /**
   * Get a single chunk by ID
   */
  getChunk: async (chunkId: string): Promise<Chunk> => {
    return apiGet<Chunk>(`/chunks/${chunkId}`);
  },
  
  /**
   * Get a list of chunks with pagination
   */
  getChunks: async (skip: number = 0, limit: number = 100): Promise<ChunkList> => {
    return apiGet<ChunkList>('/chunks', { skip, limit });
  },

  /**
   * Ask a question and get an AI-generated answer with sources
   */
  askQuestion: async (query: string, limit: number = 3): Promise<AskResponse> => {
    return apiPost<AskResponse>('/ask', { query, limit });
  }
};