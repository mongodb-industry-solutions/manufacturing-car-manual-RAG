/**
 * Custom hook for RAG question answering functionality
 */
import { useState } from 'react';
import { searchService } from '../services/searchService';
import { AskResponse } from '../types/Search';

export interface UseRAGResult {
  askQuestion: (query: string, limit?: number) => Promise<AskResponse>;
  answer: AskResponse | null;
  loading: boolean;
  error: string | null;
}

export const useRAG = (): UseRAGResult => {
  const [answer, setAnswer] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const askQuestion = async (query: string, limit: number = 3): Promise<AskResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await searchService.askQuestion(query, limit);
      setAnswer(response);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { askQuestion, answer, loading, error };
};