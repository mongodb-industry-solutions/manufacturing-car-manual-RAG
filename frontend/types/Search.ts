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
  raw_score?: number;
  // Support new flattened structure
  chunk_id?: string;
  text?: string;
  context?: string;
  breadcrumb_trail?: string;
  page_numbers?: number[];
  content_type?: string[];
  metadata?: any;
  vehicle_systems?: string[];
  heading_level_1?: string;
  heading_level_2?: string;
  heading_level_3?: string;
  // Backward compatibility with older structure
  chunk?: Chunk;
}

export interface SearchResponse {
  query: string;
  method: string;
  results: SearchResult[];
  total: number;
  debug_info?: any;
}

export interface SearchRequest {
  query: string;
  limit: number;
}

export interface VectorSearchRequest extends SearchRequest {}

export interface TextSearchRequest extends SearchRequest {}

export interface HybridSearchRequest extends SearchRequest {}

/**
 * Interface for question-answering results
 */
export interface AskResponse {
  query: string;
  answer: string;
  sources?: {
    id: string;
    text: string;
    heading?: string;
    score: number;
  }[];
}