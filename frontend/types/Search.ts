/**
 * Search types for car manual RAG application
 */
import { Chunk } from './Chunk';

export type SearchMethod = 'vector' | 'text' | 'hybrid' | 'graph' | 'multimodal';
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
  // GraphRAG fields
  source?: string; // 'vector_seed', 'graph_expansion', 'seed', 'graph'
  depth?: number; // 0 for seeds, 1+ for expanded results
  // Reranker fields
  reranker_score?: number;
  original_position?: number;
  new_position?: number;
  position_change?: number;
  // Backward compatibility with older structure
  chunk?: Chunk;
}

export interface RerankingMetadata {
  reranking_applied: boolean;
  reranker_model?: string;
  rerank_time?: number;
  original_count?: number;
  reranked_count?: number;
  query?: string;
  timestamp?: string;
  position_stats?: {
    moved_up: number;
    moved_down: number;
    unchanged: number;
    total_tracked: number;
  };
  score_range?: {
    min_score: number;
    max_score: number;
    avg_score: number;
  };
  reason?: string;
  error?: string;
}

export interface SearchResponse {
  query: string;
  method: string;
  results: SearchResult[];
  total: number;
  debug_info?: any;
  reranking_metadata?: RerankingMetadata;
}

export interface SearchRequest {
  query: string;
  limit: number;
}

export interface VectorSearchRequest extends SearchRequest {}

export interface TextSearchRequest extends SearchRequest {}

export interface HybridSearchRequest extends SearchRequest {}

export interface GraphSearchRequest extends SearchRequest {
  relationship_types?: string[];
}

/**
 * Interface for knowledge graph visualization
 */
export interface CytoscapeNode {
  data: {
    id: string;
    label: string;
    type: string;
    [key: string]: any;
  };
  position?: { x: number; y: number };
  classes?: string;
}

export interface CytoscapeEdge {
  data: {
    id: string;
    source: string;
    target: string;
    relationship_type: string;
    [key: string]: any;
  };
  classes?: string;
}

export interface KnowledgeGraphResponse {
  elements: (CytoscapeNode | CytoscapeEdge)[];
  query_context?: string;
  highlighted_node_ids: string[];
  style: any[];
  total_nodes?: number;
  is_full_graph?: boolean;
  applied_filters?: {
    systems?: string[];
    content_types?: string[];
    min_connections?: number;
  };
}

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

/**
 * Multimodal Search Types
 */
export interface MultimodalSearchRequest {
  query_type: 'text' | 'image';
  query_text?: string;
  image_base64?: string;
  limit: number;
  include_text_chunks: boolean;
  num_candidates_multiplier?: number;
}

export interface ImageResult {
  score: number;
  image_id: string;
  gridfs_file_id: string;

  // Rich metadata fields
  title?: string;
  description?: string;
  keywords?: string[];
  languages?: string[];
  category?: string;

  // Legacy/compatibility fields
  page_number?: number;
  breadcrumb_trail?: string;
  caption?: string;
  diagram_type?: string;
  associated_chunks?: SearchResult[];

  // Multimodal embedding (for document view)
  multimodal_embedding?: number[];
}

export interface MultimodalSearchResponse {
  query_type: string;
  query_text?: string;
  image_results: ImageResult[];
  text_results?: SearchResult[];
  total_images: number;
  total_text?: number;
}

export interface ImageDocument {
  id: string;
  gridfs_file_id: string;
  page_number?: number;
  breadcrumb_trail?: string;
  metadata: {
    filename: string;
    caption?: string;
    diagram_type?: string;
    page_number?: number;
  };
}