from typing import Optional, List
from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # API configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Car Manual Explorer API"
    ORIGINS: str = Field("http://localhost:3000", env="ORIGINS")
    
    # Application configuration - Hardcoded for car manuals
    INDUSTRY: str = "automotive"
    APP_NAME: str = "Car Manual Explorer"
    APP_DESCRIPTION: str = "AI-powered car manual search and exploration system"
    
    # MongoDB configuration
    MONGODB_URI: str = Field(..., env="MONGODB_URI")
    DATABASE_NAME: str = Field(..., env="DATABASE_NAME")
    MONGODB_DB: Optional[str] = Field(None, env="DATABASE_NAME")  # Optional alias for DATABASE_NAME
    CHUNKS_COLLECTION: str = "manual_chunks"  # Hardcoded for car manuals
    
    # GCP Vertex AI configuration
    GCP_PROJECT_ID: str = Field(..., env="GCP_PROJECT_ID")
    GCP_LOCATION: str = Field("us-central1", env="GCP_LOCATION")
    
    # Model configuration - Hardcoded for car manuals
    EMBEDDINGS_MODEL_ID: str = "text-embedding-005"
    CHATCOMPLETIONS_MODEL_ID: str = "anthropic.claude-3-haiku-20240307-v1:0"
    
    # Search configuration - Hardcoded for car manuals
    VECTOR_DIMENSIONS: int = 768
    VECTOR_INDEX_NAME: str = "manual_vector_index"
    TEXT_INDEX_NAME: str = "manual_text_search_index"
    VECTOR_FIELD_NAME: str = "embedding"
    
    # Document configuration - Hardcoded for car manuals
    DOCUMENT_TYPES: List[str] = ["manual", "maintenance", "troubleshooting", "specifications"]
    DEFAULT_DOCUMENT_TYPE: str = "manual"
    
    # AWS Bedrock configuration
    AWS_REGION: str = Field("us-east-1", env="AWS_REGION")
    AWS_ACCESS_KEY_ID: Optional[str] = Field(None, env="AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: Optional[str] = Field(None, env="AWS_SECRET_ACCESS_KEY")
    
    # Application settings
    DEBUG: bool = Field(False, env="DEBUG")
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "ignore"
    }

def get_settings() -> Settings:
    """Return the settings object"""
    settings = Settings()
    # Make sure MONGODB_DB is set from DATABASE_NAME if it's None
    if settings.MONGODB_DB is None and hasattr(settings, 'DATABASE_NAME'):
        settings.MONGODB_DB = settings.DATABASE_NAME
    return settings
