/**
 * Search service for car manual RAG application
 */
import { apiPost, apiGet } from './api';
import { 
  SearchRequest, 
  VectorSearchRequest, 
  TextSearchRequest, 
  HybridSearchRequest, 
  SearchResponse
} from '../types/Search';
import { Chunk, ChunkList } from '../types/Chunk';

export const searchService = {
  /**
   * Perform vector search using embeddings
   */
  vectorSearch: async (request: VectorSearchRequest): Promise<SearchResponse> => {
    return apiPost<SearchResponse>('/search/vector', request);
  },
  
  /**
   * Perform text search using keywords
   */
  textSearch: async (request: TextSearchRequest): Promise<SearchResponse> => {
    return apiPost<SearchResponse>('/search/text', request);
  },
  
  /**
   * Perform hybrid search combining vector and text approaches
   */
  hybridSearch: async (request: HybridSearchRequest): Promise<SearchResponse> => {
    return apiPost<SearchResponse>('/search/hybrid', request);
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
  }
};