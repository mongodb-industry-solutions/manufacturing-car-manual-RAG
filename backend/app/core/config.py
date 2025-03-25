import os
import json
from typing import Dict, Any, Optional
from pydantic import BaseSettings, Field

class Settings(BaseSettings):
    # API configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Car Manual RAG API"
    
    # MongoDB configuration
    MONGODB_URI: str = Field(..., env="MONGODB_URI")
    DATABASE_NAME: str = Field(..., env="DATABASE_NAME")
    CHUNKS_COLLECTION: str = Field("manual", env="CHUNKS_COLLECTION")
    
    # GCP Vertex AI configuration
    GCP_PROJECT_ID: str = Field(..., env="GCP_PROJECT_ID")
    GCP_LOCATION: str = Field("us-central1", env="GCP_LOCATION")
    
    # Model configuration
    EMBEDDINGS_MODEL_ID: str = Field("textembedding-gecko@001", env="EMBEDDINGS_MODEL_ID")
    CHATCOMPLETIONS_MODEL_ID: str = Field("gemini-1.0-pro", env="CHATCOMPLETIONS_MODEL_ID")
    
    # Vector search configuration
    VECTOR_DIMENSIONS: int = 768  # Default for text-embedding-gecko
    VECTOR_INDEX_NAME: str = Field("manual_vector_index", env="VECTOR_INDEX_NAME")
    VECTOR_FIELD_NAME: str = Field("embedding", env="VECTOR_FIELD_NAME")
    
    # Application settings
    DEBUG: bool = Field(False, env="DEBUG")
    
    class Config:
        env_file = ".env"
        case_sensitive = True

def get_settings() -> Settings:
    """Return the settings object"""
    return Settings()

# Read configuration from JSON file
def load_config_from_json(config_file_path: str = "config/config.json") -> Dict[str, Any]:
    """Load configuration from a JSON file"""
    try:
        # Get the directory of the current script
        script_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Navigate up to the backend directory
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(script_dir)))
        
        # Construct the absolute path to the config.json file
        config_file = os.path.join(backend_dir, config_file_path)
        
        # Check if the config file exists at the resolved path
        if not os.path.exists(config_file):
            raise FileNotFoundError(f"Config file not found: {config_file}")
        
        # Load the configuration data
        with open(config_file, "r") as file:
            config_data = json.load(file)
            return config_data
    except Exception as e:
        print(f"Error loading config file: {e}")
        return {}

# Load config values
config_values = load_config_from_json()

# Override settings with values from config.json
if config_values:
    settings = get_settings()
    
    # Override model IDs if provided in config
    if "EMBEDDINGS_MODEL_ID" in config_values:
        settings.EMBEDDINGS_MODEL_ID = config_values["EMBEDDINGS_MODEL_ID"]
    
    if "CHATCOMPLETIONS_MODEL_ID" in config_values:
        settings.CHATCOMPLETIONS_MODEL_ID = config_values["CHATCOMPLETIONS_MODEL_ID"]
