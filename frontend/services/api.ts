/**
 * API client service for interacting with the backend
 */
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log errors for debugging
    console.error('API Error:', error.response?.data || error.message);
    
    // Rethrow to be handled by the caller
    return Promise.reject(error);
  }
);

// Export helper functions for common operations
export const apiGet = async <T>(url: string, params?: any): Promise<T> => {
  const response = await api.get<T>(url, { params });
  return response.data;
};

export const apiPost = async <T>(url: string, data?: any, params?: any): Promise<T> => {
  const response = await api.post<T>(url, data, { params });
  return response.data;
};

export const apiPut = async <T>(url: string, data: any): Promise<T> => {
  const response = await api.put<T>(url, data);
  return response.data;
};

export const apiDelete = async <T>(url: string): Promise<T> => {
  const response = await api.delete<T>(url);
  return response.data;
};