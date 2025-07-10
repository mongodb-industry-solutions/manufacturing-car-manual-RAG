/**
 * API related types for car manual RAG application
 */

export interface ApiErrorResponse {
  detail: string;
  status_code?: number;
}

export interface ApiSuccessResponse<T> {
  data: T;
}

export interface ApiPaginationParams {
  skip?: number;
  limit?: number;
}