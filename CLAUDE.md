# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Backend Development
```bash
# Setup (first time)
cd backend
poetry install

# Run backend server
poetry run python main.py  # Runs on http://localhost:8000

# Or use Poetry shell
poetry shell
python main.py

# Run with specific environment
poetry run python main.py --env development
```

### Frontend Development
```bash
# Setup and run
cd frontend
npm install
npm run dev      # Development server on http://localhost:3000
npm run build    # Production build
npm run lint     # Run linting
```

### Docker Development
```bash
# Build and run with Docker Compose
docker-compose up --build    # Build and start all services
docker-compose up           # Start existing containers
docker-compose down         # Stop and remove containers
docker-compose logs -f      # View logs

# Individual services
docker-compose up backend   # Run only backend
docker-compose up frontend  # Run only frontend
```

### Makefile Commands
```bash
make build              # Docker compose build and start
make poetry_install     # Install backend dependencies
make push              # Build and push images to GCR
make deploy-back       # Deploy backend to Cloud Run
make deploy-front      # Deploy frontend to Cloud Run
```

## High-Level Architecture

This is a **Manufacturing Car Manual RAG (Retrieval-Augmented Generation) application** built as a reusable framework for technical documentation search across industries.

### Core Architecture Components

1. **Frontend (Next.js 15 + TypeScript)**
   - Server-side rendered React application
   - MongoDB Leafygreen UI design system
   - Three main sections: Search, Browse, Admin
   - Custom hooks for data fetching and state management
   - PDF viewer integration for source documents
   - Global search cache to prevent redundant API calls

2. **Backend (FastAPI + Python)**
   - RESTful API with async operations
   - Repository pattern for data access
   - Service layer for embeddings and RAG
   - Supports both AWS Bedrock and Google Vertex AI
   - API versioning with `/api/v1` prefix
   - Auto-generated docs at `/docs` endpoint

3. **Database (MongoDB Atlas)**
   - Document store with rich metadata
   - Vector search index for semantic search
   - Text search index for keyword search
   - Chunked document storage with hierarchical navigation

### Search Architecture

The application implements three search methods:

1. **Vector Search**: Semantic similarity using embeddings (768-dim vectors)
2. **Text Search**: Keyword-based using MongoDB Atlas Search
3. **Hybrid Search**: Combines both using MongoDB's native $rankFusion

Key implementation details:
- Embeddings generated via text-embedding-005 model
- Vector index uses cosine similarity
- Text index uses English analyzer with stemming
- Scores are normalized for consistent display
- $rankFusion with configurable weights for vector/text components

### Data Model

- **Chunk-based storage**: Documents split into ~1000 char semantic chunks
- **Rich metadata**: 
  - Breadcrumb trails for navigation
  - Page numbers and positions
  - Content types and vehicle systems
  - Source file references
- **Hierarchical structure**: Preserves original document organization

### Data Flow

1. **Document Ingestion**: PDFs → Chunks with metadata → MongoDB
2. **Search Flow**: User query → Embedding generation → Search execution → Score normalization → Results
3. **RAG Flow**: Query + Context chunks → LLM → Contextual answer

### Key Configuration Points

- **Backend**: Environment variables for MongoDB, AI services (AWS/GCP)
- **Frontend**: `NEXT_PUBLIC_API_BASE_URL` for API connection
- **Industry Config**: `config/app.config.json` for branding and terminology
- **Search Config**: Index names and search parameters in backend config
- **CORS**: Configured to allow all origins by default

### Important Patterns

1. **Repository Pattern**: All database operations go through repository classes
2. **Service Layer**: Business logic separated from API routes
3. **Error Handling**: Consistent error responses with proper status codes
4. **Async Operations**: All I/O operations are async for performance
5. **Type Safety**: TypeScript on frontend, Pydantic models on backend
6. **URL Handling**: Backend uses `redirect_slashes=False`

### Development Notes

- Python version must be 3.10.x (not 3.11+) - specified in pyproject.toml
- MongoDB Atlas must be 6.0+ to support $rankFusion for hybrid search
- MongoDB indexes: Text index auto-creates, vector index needs manual setup
- Frontend caches search results globally to prevent redundant API calls
- Docker Compose used for local development with hot reloading
- Environment variables needed:
  - Backend: `MONGODB_URI`, `MONGODB_DATABASE_NAME`, AI service credentials
  - Frontend: `NEXT_PUBLIC_API_BASE_URL` (defaults to http://localhost:8000)

### Testing and Quality

```bash
# Backend testing
cd backend
poetry run pytest                    # Run all tests
poetry run pytest -v                 # Verbose output
poetry run pytest tests/test_api.py  # Run specific test file

# Frontend testing
cd frontend
npm test                            # Run tests
npm run test:watch                  # Watch mode
npm run test:coverage               # Coverage report
```

### Additional Resources

- Detailed setup guides in `how to/` directory
- DEMO_INSTRUCTION_GUIDE.md for deployment instructions
- Backend API documentation available at http://localhost:8000/docs when running