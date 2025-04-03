/**
 * Search types for car manual RAG application
 */
import { Chunk } from './Chunk';

export type SearchMethod = 'vector' | 'text' | 'hybrid';
export type HybridMethod = 'rrf';

export interface SearchResult {
  score: number;
  vector_score?: number;
  text_score?: number;
  chunk: Chunk;
}

export interface SearchResponse {
  query: string;
  method: string;
  results: SearchResult[];
  total: number;
}

export interface SearchRequest {
  query: string;
  limit: number;
}

export interface VectorSearchRequest extends SearchRequest {}

export interface TextSearchRequest extends SearchRequest {}

export interface HybridSearchRequest extends SearchRequest {
  rrf_k?: number;
}