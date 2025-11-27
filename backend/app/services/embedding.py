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
            # Auto-configure GOOGLE_APPLICATION_CREDENTIALS for Workload Identity
            # Check for common credential configuration file locations
            if not os.environ.get('GOOGLE_APPLICATION_CREDENTIALS'):
                potential_cred_files = [
                    '/etc/gcp/credential-configuration.json',  # GKE Workload Identity (hyphenated)
                    '/etc/gcp/credential_configuration.json',  # Alternative (underscore)
                    '/etc/gcp/config.json',
                    '/etc/gcp/application_default_credentials.json',
                    '/var/secrets/google/key.json'
                ]
                
                for cred_file in potential_cred_files:
                    if os.path.exists(cred_file):
                        logger.info(f"Found credential file: {cred_file}")
                        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = cred_file
                        break
            
            # Use Application Default Credentials (ADC)
            # Automatically detects: Workload Identity, service account file, or gcloud auth
            credentials, project = google.auth.default()
            
            logger.info(f"Authenticated as {type(credentials).__name__} for project {self.settings.GCP_PROJECT_ID}")
            logger.info(f"Detected project from credentials: {project}")
            
            # Initialize Vertex AI client
            aiplatform.init(
                project=self.settings.GCP_PROJECT_ID,
                location=self.settings.GCP_LOCATION,
                credentials=credentials
            )
            
            logger.info(f"Successfully initialized Vertex AI client")
        except Exception as e:
            logger.error(f"Failed to initialize Vertex AI: {e}")
            logger.error(f"Verify service account has 'Vertex AI User' role")
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