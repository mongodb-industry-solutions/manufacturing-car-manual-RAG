/**
 * Search types for car manual RAG application
 */
import { Chunk } from './Chunk';

export type SearchMethod = 'vector' | 'text' | 'hybrid' | 'graph';
export type HybridMethod = 'rrf';
export type GraphExpansionMethod = 'graph_to_vector' | 'vector_to_graph';

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

export interface GraphSearchRequest extends SearchRequest {
  expansion_method: GraphExpansionMethod;
  relationship_types?: string[];
  graph_weight?: number;
  vector_weight?: number;
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