/**
 * Car manual chunk data types
 */

export interface SafetyNotice {
  type: string;
  content: string;
}

export interface ProceduralStep {
  marker: string;
  instruction: string;
}

export interface ChunkMetadata {
  source_pages?: string;
  page_count: number;
  chunk_length: number;
  has_safety?: boolean;
  systems?: string[];
  parts?: string[];
}

export interface Chunk {
  _id?: { $oid: string }; // MongoDB ObjectId format
  id?: string; // The chunk_id format (e.g., chunk_00001)
  text: string;
  context?: string;
  breadcrumb_trail?: string;
  page_numbers: number[];
  content_type?: string[];
  heading_level_1?: string;
  heading_level_2?: string;
  heading_level_3?: string;
  has_overlap_prefix?: boolean;
  safety_notices?: SafetyNotice[];
  procedural_steps?: ProceduralStep[];
  part_numbers?: string[];
  vehicle_systems?: string[];
  metadata: ChunkMetadata;
  next_chunk_id?: string;
  related_chunks?: string[];
  embedding?: number[] | { $numberDouble: string }[];
  embedding_timestamp?: string;
}

export interface ChunkList {
  total: number;
  chunks: Chunk[];
}