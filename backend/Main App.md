# app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .api import chunks, search
from .database import close_db_connection
import uvicorn

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API for Car Manual RAG Demo showcasing technical manual chunking and MongoDB $rankFusion hybrid search"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(chunks.router)
app.include_router(search.router)

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Application startup: connect to database, initialize services"""
    pass

@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown: close connections"""
    close_db_connection()

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint returns basic API information"""
    return {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": "API for exploring car manual chunking and search techniques"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Simple DB check could go here
        return {"status": "healthy"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)


# .env
# Sample .env file (create this with actual values)
MONGODB_URI=mongodb+srv://myAtlasDBUser:password@myatlasclusteredu.dysibxv.mongodb.net/?retryWrites=true&w=majority
DB_NAME=genai_car_assistantv2
COLLECTION_NAME=manual_chunks
CORS_ORIGINS=["http://localhost:3000", "https://car-manual-rag-demo.vercel.app"]
OPENAI_API_KEY=your_openai_api_key


# requirements.txt
fastapi==0.104.1
uvicorn==0.24.0
pymongo==4.6.0
python-dotenv==1.0.0
pydantic==2.5.0
httpx==0.25.1
python-multipart==0.0.6