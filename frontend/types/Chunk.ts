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
  page_count: number;
  chunk_length: number;
  systems?: string[];
  parts?: string[];
}

export interface Chunk {
  id: string;
  text: string;
  context?: string;
  breadcrumb_trail?: string;
  page_numbers: number[];
  content_type?: string[];
  heading_level_1?: string;
  heading_level_2?: string;
  heading_level_3?: string;
  safety_notices?: SafetyNotice[];
  procedural_steps?: ProceduralStep[];
  part_numbers?: string[];
  vehicle_systems?: string[];
  metadata: ChunkMetadata;
  next_chunk_id?: string;
  prev_chunk_id?: string;
}

export interface ChunkList {
  total: number;
  chunks: Chunk[];
}