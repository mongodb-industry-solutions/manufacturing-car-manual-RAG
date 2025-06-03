/**
 * Custom hook for managing document chunks with localStorage caching
 */
import { useState, useCallback, useEffect } from 'react';
import { searchService } from '../services/searchService';
import { Chunk, ChunkList } from '../types/Chunk';

// Cache config
const CACHE_KEY_CHUNKS = 'car_manual_chunks_cache';
const CACHE_KEY_CHUNK = 'car_manual_chunk_cache_';
const CACHE_TTL = 1000 * 60 * 60; // 1 hour cache TTL

// Helper to check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

// Cache handler for localStorage
const cacheManager = {
  setCache: (key: string, data: any): void => {
    if (!isBrowser) return;
    
    const cacheItem = {
      timestamp: Date.now(),
      data
    };
    localStorage.setItem(key, JSON.stringify(cacheItem));
  },
  
  getCache: <T>(key: string): T | null => {
    if (!isBrowser) return null;
    
    const cachedData = localStorage.getItem(key);
    if (!cachedData) return null;
    
    try {
      const cacheItem = JSON.parse(cachedData);
      const now = Date.now();
      
      // Check if cache is still valid
      if (now - cacheItem.timestamp < CACHE_TTL) {
        return cacheItem.data as T;
      }
      
      // Cache is stale, remove it
      localStorage.removeItem(key);
      return null;
    } catch (err) {
      console.error('Error parsing cache:', err);
      localStorage.removeItem(key);
      return null;
    }
  },
  
  clearCache: (key: string): void => {
    if (!isBrowser) return;
    localStorage.removeItem(key);
  }
};

export interface UseChunksResult {
  getChunk: (id: string) => Promise<Chunk>;
  getChunks: (skip?: number, limit?: number) => Promise<ChunkList>;
  chunk: Chunk | null;
  chunks: ChunkList | null;
  loading: boolean;
  error: string | null;
  clearCache: () => void;
}

export const useChunks = (): UseChunksResult => {
  const [chunk, setChunk] = useState<Chunk | null>(null);
  const [chunks, setChunks] = useState<ChunkList | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize state from cache on mount
  useEffect(() => {
    if (isBrowser) {
      const cachedChunks = cacheManager.getCache<ChunkList>(CACHE_KEY_CHUNKS);
      if (cachedChunks) {
        console.log('Using cached chunks data');
        setChunks(cachedChunks);
      }
    }
  }, []);

  // Function to clear all cache
  const clearCache = useCallback(() => {
    if (isBrowser) {
      cacheManager.clearCache(CACHE_KEY_CHUNKS);
      // Clear any individual chunk caches too
      const localStorageKeys = Object.keys(localStorage);
      localStorageKeys.forEach(key => {
        if (key.startsWith(CACHE_KEY_CHUNK)) {
          localStorage.removeItem(key);
        }
      });
    }
  }, []);

  // Use useCallback to memoize these functions so they don't change on every render
  const getChunk = useCallback(async (id: string): Promise<Chunk> => {
    setLoading(true);
    setError(null);
    
    // Check cache first
    const cacheKey = `${CACHE_KEY_CHUNK}${id}`;
    const cachedChunk = cacheManager.getCache<Chunk>(cacheKey);
    
    if (cachedChunk) {
      console.log('Using cached chunk:', id, 'Has embedding:', !!cachedChunk.embedding);
      setChunk(cachedChunk);
      setLoading(false);
      return cachedChunk;
    }
    
    try {
      const response = await searchService.getChunk(id);
      
      // Ensure chunk has an id (if it comes with MongoDB _id but no id field)
      if (!response.id && response._id && response._id.$oid) {
        response.id = response._id.$oid;
      }
      
      // For backward compatibility with any existing code looking for id
      if (!response.id && response._id) {
        response.id = typeof response._id === 'string' 
          ? response._id 
          : (response._id as any).$oid || String(response._id);
      }
      
      console.log('Fetched chunk from API:', id, 'Has embedding:', !!response.embedding);
      if (response.embedding) {
        console.log('Embedding data:', response.embedding);
      }
      
      setChunk(response);
      
      // Cache the chunk
      cacheManager.setCache(cacheKey, response);
      
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getChunks = useCallback(async (skip: number = 0, limit: number = 1000): Promise<ChunkList> => {
    setLoading(true);
    setError(null);
    
    // Check cache first (only for the main chunks request)
    if (skip === 0) {
      const cachedChunks = cacheManager.getCache<ChunkList>(CACHE_KEY_CHUNKS);
      if (cachedChunks) {
        setChunks(cachedChunks);
        setLoading(false);
        return cachedChunks;
      }
    }
    
    try {
      const response = await searchService.getChunks(skip, limit);
      
      // Process chunks to ensure proper id field
      if (response.chunks && response.chunks.length > 0) {
        response.chunks = response.chunks.map(chunk => {
          // Ensure chunk has an id (if it comes with MongoDB _id but no id field)
          if (!chunk.id && chunk._id && chunk._id.$oid) {
            chunk.id = chunk._id.$oid;
          }
          
          // For backward compatibility with any existing code looking for id
          if (!chunk.id && chunk._id) {
            chunk.id = typeof chunk._id === 'string' 
              ? chunk._id 
              : (chunk._id as any).$oid || String(chunk._id);
          }
          
          return chunk;
        });
      }
      
      setChunks(response);
      
      // Cache only the main chunks list (not paginated subsets)
      if (skip === 0) {
        cacheManager.setCache(CACHE_KEY_CHUNKS, response);
      }
      
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { getChunk, getChunks, chunk, chunks, loading, error, clearCache };
};