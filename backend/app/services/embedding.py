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
            # ==== INVESTIGATION: Log environment and mounted volumes ====
            logger.info("=== GCP Authentication Investigation ===")
            
            # Check relevant environment variables
            logger.info("Environment variables:")
            gcp_env_vars = [
                'GOOGLE_APPLICATION_CREDENTIALS',
                'GOOGLE_CLOUD_PROJECT',
                'GCP_PROJECT_ID',
                'CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE',
                'CLOUDSDK_CONFIG'
            ]
            for var in gcp_env_vars:
                value = os.environ.get(var)
                logger.info(f"  {var}: {value if value else 'NOT SET'}")
            
            # Check mounted volumes
            logger.info("Checking mounted volumes:")
            
            # Check /etc/gcp (from gcp-wif-config ConfigMap)
            gcp_config_path = "/etc/gcp"
            if os.path.exists(gcp_config_path):
                logger.info(f"  {gcp_config_path} exists")
                try:
                    files = os.listdir(gcp_config_path)
                    logger.info(f"    Files: {files}")
                    for file in files:
                        file_path = os.path.join(gcp_config_path, file)
                        if os.path.isfile(file_path):
                            size = os.path.getsize(file_path)
                            logger.info(f"      {file}: {size} bytes")
                except Exception as e:
                    logger.warning(f"    Could not list files: {e}")
            else:
                logger.warning(f"  {gcp_config_path} does NOT exist")
            
            # Check /var/run/service-account (projected service account token)
            sa_token_path = "/var/run/service-account"
            if os.path.exists(sa_token_path):
                logger.info(f"  {sa_token_path} exists")
                try:
                    files = os.listdir(sa_token_path)
                    logger.info(f"    Files: {files}")
                    for file in files:
                        file_path = os.path.join(sa_token_path, file)
                        if os.path.isfile(file_path):
                            size = os.path.getsize(file_path)
                            logger.info(f"      {file}: {size} bytes")
                            # Log first 50 chars of token file for verification (if it's 'token')
                            if file == 'token':
                                try:
                                    with open(file_path, 'r') as f:
                                        token_preview = f.read(50)
                                        logger.info(f"      Token preview: {token_preview}...")
                                except Exception as e:
                                    logger.warning(f"      Could not read token: {e}")
                except Exception as e:
                    logger.warning(f"    Could not list files: {e}")
            else:
                logger.warning(f"  {sa_token_path} does NOT exist")
            
            logger.info("=== End Investigation ===")
            # ==== END INVESTIGATION ====
            
            # ==== AUTO-CONFIGURE WORKLOAD IDENTITY ====
            # Check for common Workload Identity credential configuration files
            # and set GOOGLE_APPLICATION_CREDENTIALS if not already set
            if not os.environ.get('GOOGLE_APPLICATION_CREDENTIALS'):
                logger.info("GOOGLE_APPLICATION_CREDENTIALS not set, checking for credential config files...")
                
                potential_cred_files = [
                    '/etc/gcp/credential_configuration.json',
                    '/etc/gcp/config.json',
                    '/etc/gcp/application_default_credentials.json',
                    '/var/secrets/google/key.json'
                ]
                
                for cred_file in potential_cred_files:
                    if os.path.exists(cred_file):
                        logger.info(f"Found credential file at {cred_file}, setting GOOGLE_APPLICATION_CREDENTIALS")
                        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = cred_file
                        break
                else:
                    logger.info("No credential configuration file found, relying on default ADC behavior")
            # ==== END AUTO-CONFIGURE ====
            
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
            logger.error("Troubleshooting steps:")
            logger.error("1. Verify the gcp-wif-config ConfigMap contains credential_configuration.json")
            logger.error("2. Verify the service account mapping: manufacturing-kanopy-sa@manufacturing-project-425012.iam.gserviceaccount.com")
            logger.error("3. Verify the service account has 'Vertex AI User' role (roles/aiplatform.user)")
            logger.error("4. Check the workloadIdentityConfig audience matches the projected token audience")
            logger.error("5. Ensure the Kubernetes service account is annotated with iam.gke.io/gcp-service-account")
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