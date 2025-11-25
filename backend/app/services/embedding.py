from typing import List, Dict, Any, Optional
import logging
import os
from google.cloud import aiplatform
import google.auth
from vertexai.preview.language_models import TextEmbeddingModel

from app.core.config import get_settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    """Service for generating text embeddings using Google Vertex AI"""
    
    def __init__(self):
        """Initialize the embedding service with Vertex AI configuration"""
        self.settings = get_settings()
        self.model_id = self.settings.EMBEDDINGS_MODEL_ID
        self._initialize_client()
        self.model = TextEmbeddingModel.from_pretrained(self.model_id)
        logger.info(f"Initialized Vertex AI embedding model: {self.model_id}")
    
    def _initialize_client(self):
        """Initialize the Vertex AI client with Application Default Credentials"""
        try:
            # Use Application Default Credentials (ADC)
            # This automatically detects the authentication method:
            # - In GKE with Workload Identity: uses the mapped service account
            # - Locally: uses GOOGLE_APPLICATION_CREDENTIALS or gcloud auth
            # - Other environments: falls back to other methods
            credentials, project = google.auth.default()
            
            # Log the detected authentication method for debugging
            logger.info(f"Detected GCP credentials type: {type(credentials).__name__}")
            logger.info(f"Using GCP project: {self.settings.GCP_PROJECT_ID}")
            
            # Initialize Vertex AI client with detected credentials
            aiplatform.init(
                project=self.settings.GCP_PROJECT_ID,
                location=self.settings.GCP_LOCATION,
                credentials=credentials
            )
            
            logger.info(f"Successfully initialized Vertex AI client for project {self.settings.GCP_PROJECT_ID}")
        except Exception as e:
            logger.error(f"Failed to initialize Vertex AI client: {e}")
            logger.error(f"Make sure the service account has 'Vertex AI User' role")
            raise
    
    async def generate_embedding(self, text: str) -> List[float]:
        """Generate text embedding using Vertex AI TextEmbedding model"""
        try:
            # Generate embeddings
            embeddings = self.model.get_embeddings([text])
            
            # Extract the embedding vector
            if embeddings and len(embeddings) > 0:
                embedding_vector = embeddings[0].values
                logger.info(f"Successfully generated embedding with {len(embedding_vector)} dimensions")
                return embedding_vector
            
            raise ValueError("Empty embedding response from Vertex AI")
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise