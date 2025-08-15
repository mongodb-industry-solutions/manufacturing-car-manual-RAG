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
  paramsSerializer: {
    serialize: (params) => {
      // Configure array serialization for FastAPI compatibility
      // FastAPI expects: vehicle_systems=engine&vehicle_systems=brakes
      // Not: vehicle_systems[]=engine&vehicle_systems[]=brakes
      const searchParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          // For arrays, add each value as a separate parameter
          value.forEach(item => searchParams.append(key, item));
        } else if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      
      return searchParams.toString();
    }
  }
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

// Helper function to ensure URL is properly formatted
const normalizeUrl = (url: string): string => {
  // Extract the path segments
  const segments = url.split('/').filter(Boolean);
  
  // Collection endpoints need trailing slashes (like /chunks/)
  if (segments.length === 1 && ['chunks', 'search', 'health'].includes(segments[0])) {
    return url.endsWith('/') ? url : `${url}/`;
  }
  
  // Search endpoints should NOT have trailing slashes
  if (segments.length === 2 && 
      segments[0] === 'search' && 
      ['vector', 'text', 'hybrid', 'ask'].includes(segments[1])) {
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }
  
  // ID endpoints like /chunks/chunk_001 should NOT have trailing slashes
  if (segments.length === 2 && segments[0] === 'chunks') {
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }
  
  // Default - don't modify
  return url;
};

// Export helper functions for common operations
export const apiGet = async <T>(url: string, params?: any): Promise<T> => {
  const response = await api.get<T>(normalizeUrl(url), { params });
  return response.data;
};

export const apiPost = async <T>(url: string, data?: any, params?: any): Promise<T> => {
  const response = await api.post<T>(normalizeUrl(url), data, { params });
  return response.data;
};

export const apiPut = async <T>(url: string, data: any): Promise<T> => {
  const response = await api.put<T>(normalizeUrl(url), data);
  return response.data;
};

export const apiDelete = async <T>(url: string): Promise<T> => {
  const response = await api.delete<T>(normalizeUrl(url));
  return response.data;
};