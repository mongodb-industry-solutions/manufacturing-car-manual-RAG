/**
 * Custom hook for managing document chunks
 */
import { useState } from 'react';
import { searchService } from '../services/searchService';
import { Chunk, ChunkList } from '../types/Chunk';

export interface UseChunksResult {
  getChunk: (id: string) => Promise<Chunk>;
  getChunks: (skip?: number, limit?: number) => Promise<ChunkList>;
  chunk: Chunk | null;
  chunks: ChunkList | null;
  loading: boolean;
  error: string | null;
}

export const useChunks = (): UseChunksResult => {
  const [chunk, setChunk] = useState<Chunk | null>(null);
  const [chunks, setChunks] = useState<ChunkList | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getChunk = async (id: string): Promise<Chunk> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await searchService.getChunk(id);
      setChunk(response);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getChunks = async (skip: number = 0, limit: number = 100): Promise<ChunkList> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await searchService.getChunks(skip, limit);
      setChunks(response);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { getChunk, getChunks, chunk, chunks, loading, error };
};