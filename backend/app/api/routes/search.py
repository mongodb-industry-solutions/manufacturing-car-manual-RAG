from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from app.models.search import (
    SearchRequest, VectorSearchRequest, TextSearchRequest, HybridSearchRequest,
    SearchResponse, SearchResult
)
from app.services.embedding import EmbeddingService
from app.services.rag import RAGService
from app.db.repositories.search import SearchRepository

router = APIRouter()

@router.post("/vector", response_model=SearchResponse)
async def vector_search(request: VectorSearchRequest):
    """Perform vector search using embedding similarity"""
    try:
        # Generate embedding for the query
        embedding_service = EmbeddingService()
        query_embedding = await embedding_service.generate_embedding(request.query)
        
        # Perform vector search
        search_repo = SearchRepository()
        search_results = await search_repo.vector_search(query_embedding, request.limit)
        
        # Return formatted response
        return SearchResponse(
            query=request.query,
            method="vector",
            results=search_results,
            total=len(search_results)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/text", response_model=SearchResponse)
async def text_search(request: TextSearchRequest):
    """Perform text search using keywords"""
    try:
        # Perform text search
        search_repo = SearchRepository()
        search_results = await search_repo.text_search(request.query, request.limit)
        
        # Return formatted response
        return SearchResponse(
            query=request.query,
            method="text",
            results=search_results,
            total=len(search_results)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/hybrid", response_model=SearchResponse)
async def hybrid_search(request: HybridSearchRequest):
    """Perform hybrid search using both vector and text search"""
    try:
        search_repo = SearchRepository()
        
        # Generate embedding for the query
        embedding_service = EmbeddingService()
        query_embedding = await embedding_service.generate_embedding(request.query)
        
        # Perform both search types
        vector_results = await search_repo.vector_search(query_embedding, request.limit)
        text_results = await search_repo.text_search(request.query, request.limit)
        
        # Combine results based on the method
        combined_results = []
        if request.method == "rrf":
            combined_results = await search_repo.hybrid_search_rrf(vector_results, text_results)
        elif request.method == "weighted":
            combined_results = await search_repo.hybrid_search_weighted(
                vector_results, text_results,
                vector_weight=request.vector_weight,
                text_weight=request.text_weight
            )
        elif request.method == "union":
            # Simple union of the two result sets
            result_map = {}
            for result in vector_results + text_results:
                chunk_id = result.chunk.id
                if chunk_id not in result_map:
                    result_map[chunk_id] = result
            combined_results = list(result_map.values())
            combined_results.sort(key=lambda x: x.score, reverse=True)
        
        # Limit results to requested number
        combined_results = combined_results[:request.limit]
        
        # Return formatted response
        return SearchResponse(
            query=request.query,
            method=f"hybrid_{request.method}",
            results=combined_results,
            total=len(combined_results)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ask", response_model=dict)
async def ask_question(query: str = Query(...), limit: int = Query(3, ge=1, le=10)):
    """Ask a question and get an answer using RAG"""
    try:
        # Generate embedding for the query
        embedding_service = EmbeddingService()
        query_embedding = await embedding_service.generate_embedding(query)
        
        # Perform vector search to get context chunks
        search_repo = SearchRepository()
        search_results = await search_repo.vector_search(query_embedding, limit)
        
        # Extract chunks for context
        context_chunks = [result.chunk for result in search_results]
        
        # Generate answer using RAG
        rag_service = RAGService()
        answer = await rag_service.generate_answer(query, context_chunks)
        
        # Return answer and relevant chunks
        return {
            "query": query,
            "answer": answer,
            "sources": [
                {
                    "id": result.chunk.id,
                    "score": result.score,
                    "text": result.chunk.text,
                    "heading": result.chunk.heading_level_1 or ""
                }
                for result in search_results
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
