"""
API routes for configuration endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse

from app.core.config import get_settings, Settings
from app.core.config import load_config_from_json

router = APIRouter()

@router.get("/")
async def get_configuration(settings: Settings = Depends(get_settings)):
    """
    Return application configuration for the frontend
    """
    try:
        # Get the core settings
        config_data = {
            "application": {
                "name": settings.APP_NAME,
                "industry": settings.INDUSTRY,
                "description": settings.APP_DESCRIPTION
            },
            "database": {
                "collections": {
                    "chunks": settings.CHUNKS_COLLECTION
                },
                "indices": {
                    "vector": settings.VECTOR_INDEX_NAME,
                    "text": settings.TEXT_INDEX_NAME
                }
            },
            "document": {
                "types": settings.DOCUMENT_TYPES,
                "defaultType": settings.DEFAULT_DOCUMENT_TYPE
            }
        }
        
        # Load extended configuration from JSON
        extended_config = load_config_from_json()
        if extended_config:
            # Merge branding configuration if available
            if "branding" in extended_config:
                config_data["branding"] = extended_config["branding"]
            
            # Merge industry-specific configuration if available
            if "industry" in extended_config:
                config_data["industry"] = extended_config["industry"]
            
            # Merge features configuration if available
            if "features" in extended_config:
                config_data["features"] = extended_config["features"]
        
        return JSONResponse(content=config_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving configuration: {str(e)}")

@router.get("/industry")
async def get_industry_configuration(settings: Settings = Depends(get_settings)):
    """
    Return industry-specific configuration
    """
    try:
        # Load extended configuration from JSON
        extended_config = load_config_from_json()
        
        # Get industry configuration
        industry_config = {
            "name": settings.INDUSTRY.capitalize(),
            "terminology": {}  # Default empty terminology
        }
        
        # Merge with extended configuration if available
        if extended_config and "industry" in extended_config:
            for key, value in extended_config["industry"].items():
                industry_config[key] = value
        
        return JSONResponse(content=industry_config)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving industry configuration: {str(e)}")