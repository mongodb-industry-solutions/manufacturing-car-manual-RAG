#!/usr/bin/env python3
"""
Voyage AI Reranker Service

This module provides reranking functionality using Voyage AI's reranker models
to improve search result relevance for car manual queries.
"""

import os
import json
import requests
import time
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class VoyageRerankerService:
    """Service for reranking search results using Voyage AI reranker models"""

    def __init__(self, api_key: Optional[str] = None, model: str = "rerank-2.5"):
        """
        Initialize the Voyage reranker service

        Args:
            api_key: Voyage API key (defaults to VOYAGE_API_KEY env var)
            model: Reranker model to use (default: rerank-2.5)
        """
        self.api_key = api_key or os.getenv("VOYAGE_API_KEY")
        if not self.api_key:
            raise ValueError("Voyage API key is required. Set VOYAGE_API_KEY environment variable.")

        self.model = model
        self.base_url = "https://api.voyageai.com/v1/rerank"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        logger.info(f"Initialized Voyage reranker service with model: {model}")

    def _prepare_documents(self, results: List[Dict[str, Any]]) -> List[str]:
        """
        Convert search results into text documents for reranking

        Args:
            results: List of search result documents

        Returns:
            List of text strings representing each document
        """
        documents = []

        for result in results:
            doc_parts = []

            # Main text content (most important)
            if result.get("text"):
                doc_parts.append(f"Content: {result['text']}")

            # Context information
            if result.get("context"):
                doc_parts.append(f"Context: {result['context']}")

            # Breadcrumb trail (hierarchical context)
            if result.get("breadcrumb_trail"):
                doc_parts.append(f"Location: {result['breadcrumb_trail']}")

            # Heading hierarchy
            if result.get("heading_level_1"):
                doc_parts.append(f"Section: {result['heading_level_1']}")
            if result.get("heading_level_2"):
                doc_parts.append(f"Subsection: {result['heading_level_2']}")
            if result.get("heading_level_3"):
                doc_parts.append(f"Topic: {result['heading_level_3']}")

            # Vehicle systems
            if result.get("vehicle_systems"):
                systems = ", ".join(result["vehicle_systems"])
                doc_parts.append(f"Systems: {systems}")

            # Content type
            if result.get("content_type"):
                content_types = ", ".join(result["content_type"])
                doc_parts.append(f"Type: {content_types}")

            # Combine all parts
            document_text = " | ".join(doc_parts)

            # Ensure document is not too long (32k token limit for rerank-2.5)
            if len(document_text) > 8000:  # Conservative character limit
                # Prioritize most important fields
                priority_parts = []
                for part in doc_parts:
                    if any(keyword in part.lower() for keyword in ["content:", "context:", "location:"]):
                        priority_parts.append(part)
                    elif len(" | ".join(priority_parts)) < 6000:
                        priority_parts.append(part)
                    else:
                        break
                document_text = " | ".join(priority_parts)

            documents.append(document_text)

        return documents

    def rerank(
        self,
        query: str,
        results: List[Dict[str, Any]],
        include_position_tracking: bool = True
    ) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Rerank search results using Voyage AI reranker

        Args:
            query: The search query
            results: List of search result documents
            include_position_tracking: Whether to include position change metadata

        Returns:
            Tuple of (reranked_results, reranking_metadata)
        """
        if not results:
            return results, {"reranking_applied": False, "reason": "No results to rerank"}

        if not query.strip():
            return results, {"reranking_applied": False, "reason": "Empty query"}

        start_time = time.time()

        try:
            # Prepare documents for reranking
            documents = self._prepare_documents(results)

            # Track original positions if requested
            original_positions = {}
            if include_position_tracking:
                for i, result in enumerate(results):
                    result_id = result.get("chunk_id", f"result_{i}")
                    original_positions[result_id] = i + 1  # 1-based positions

            # Prepare reranker request
            rerank_request = {
                "query": query,
                "documents": documents,
                "model": self.model
            }

            logger.debug(f"Sending rerank request: query='{query[:100]}...', {len(documents)} documents")

            # Call Voyage reranker API
            response = requests.post(
                self.base_url,
                headers=self.headers,
                json=rerank_request,
                timeout=30
            )

            if response.status_code != 200:
                logger.error(f"Reranker API error {response.status_code}: {response.text}")
                return results, {
                    "reranking_applied": False,
                    "reason": f"API error: {response.status_code}",
                    "error_details": response.text
                }

            rerank_response = response.json()
            end_time = time.time()
            rerank_time = end_time - start_time

            # Process reranking results
            reranked_results = []
            position_changes = []

            for rank_result in rerank_response.get("data", []):
                index = rank_result["index"]
                reranker_score = rank_result["relevance_score"]

                # Get original result
                original_result = results[index].copy()

                # Add reranking metadata
                original_result["reranker_score"] = reranker_score
                original_result["reranking_applied"] = True

                # Add position tracking if requested
                if include_position_tracking:
                    result_id = original_result.get("chunk_id", f"result_{index}")
                    original_pos = original_positions.get(result_id, index + 1)
                    new_pos = len(reranked_results) + 1
                    position_change = original_pos - new_pos  # Positive = moved up, negative = moved down

                    original_result["original_position"] = original_pos
                    original_result["new_position"] = new_pos
                    original_result["position_change"] = position_change

                    position_changes.append({
                        "result_id": result_id,
                        "original_position": original_pos,
                        "new_position": new_pos,
                        "position_change": position_change,
                        "reranker_score": reranker_score
                    })

                reranked_results.append(original_result)

            # Calculate reranking statistics
            total_results = len(results)
            reranked_count = len(reranked_results)

            moved_up = len([pc for pc in position_changes if pc["position_change"] > 0])
            moved_down = len([pc for pc in position_changes if pc["position_change"] < 0])
            unchanged = len([pc for pc in position_changes if pc["position_change"] == 0])

            # Reranking metadata
            reranking_metadata = {
                "reranking_applied": True,
                "reranker_model": self.model,
                "rerank_time": rerank_time,
                "original_count": total_results,
                "reranked_count": reranked_count,
                "query": query,
                "timestamp": datetime.now().isoformat(),
                "position_stats": {
                    "moved_up": moved_up,
                    "moved_down": moved_down,
                    "unchanged": unchanged,
                    "total_tracked": len(position_changes)
                } if include_position_tracking else None,
                "score_range": {
                    "min_score": min(r["reranker_score"] for r in reranked_results) if reranked_results else None,
                    "max_score": max(r["reranker_score"] for r in reranked_results) if reranked_results else None,
                    "avg_score": sum(r["reranker_score"] for r in reranked_results) / len(reranked_results) if reranked_results else None
                }
            }

            logger.info(f"Reranking completed: {reranked_count}/{total_results} results, "
                       f"{moved_up} moved up, {moved_down} moved down, {unchanged} unchanged")

            return reranked_results, reranking_metadata

        except requests.exceptions.RequestException as e:
            logger.error(f"Network error during reranking: {e}")
            return results, {
                "reranking_applied": False,
                "reason": "Network error",
                "error_details": str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error during reranking: {e}")
            return results, {
                "reranking_applied": False,
                "reason": "Unexpected error",
                "error_details": str(e)
            }

    def is_available(self) -> bool:
        """Check if the reranker service is available"""
        return bool(self.api_key)

    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the current reranker model"""
        return {
            "model": self.model,
            "max_documents": 1000,
            "max_query_tokens": 8000,
            "context_length": 32000,
            "available": self.is_available()
        }

