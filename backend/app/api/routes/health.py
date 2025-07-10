from fastapi import APIRouter, Depends
import logging

from app.core.config import get_settings
from app.db.mongodb import get_mongodb

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/")
async def health_check():
    """Check if the API is running"""
    return {"status": "healthy", "message": "API is running"}

@router.get("/db")
async def db_health_check():
    """Check if the database connection is working"""
    try:
        settings = get_settings()
        mongodb = get_mongodb()
        # Try to get server info to verify connection
        info = mongodb._client.server_info()
        
        return {
            "status": "healthy", 
            "message": "Database connection is working",
            "database": settings.DATABASE_NAME,
            "mongodb_version": info.get("version", "unknown")
        }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {"status": "unhealthy", "message": f"Database connection error: {str(e)}"}

@router.get("/config")
async def config_info():
    """Get non-sensitive configuration information"""
    settings = get_settings()
    
    # Only return non-sensitive config info
    return {
        "api_version": settings.API_V1_STR,
        "project_name": settings.PROJECT_NAME,
        "debug_mode": settings.DEBUG,
        "database_name": settings.DATABASE_NAME,
        "collection_name": settings.CHUNKS_COLLECTION,
        "embeddings_model": settings.EMBEDDINGS_MODEL_ID,
        "completion_model": settings.CHATCOMPLETIONS_MODEL_ID,
        "vector_dimensions": settings.VECTOR_DIMENSIONS
    }
