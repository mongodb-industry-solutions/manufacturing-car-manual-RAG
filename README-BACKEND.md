# Car Manual RAG Backend

This is the backend for the Car Manual RAG application, which provides a RESTful API for searching and retrieving information from car manuals using MongoDB and Google Vertex AI.

## Features

- FastAPI-based REST API with automatic documentation
- MongoDB integration with vector search capabilities
- Google Vertex AI integration for AI-powered search and retrieval
- Retrieval Augmented Generation (RAG) for answering user questions

## Getting Started

### Prerequisites

- Python 3.10
- Poetry for dependency management
- MongoDB Atlas account with vector search capability
- Google Cloud project with Vertex AI API enabled
- Google Cloud service account with Vertex AI access

### Installation

1. Set up environment variables by copying the example:

```bash
cp .env.example .env
```

2. Edit the `.env` file with your MongoDB and Google Cloud credentials. Make sure to set:
   - `MONGODB_URI` - Your MongoDB connection string
   - `DATABASE_NAME` - Your database name
   - `CHUNKS_COLLECTION` - Your chunks collection name (default: "manual")
   - `GCP_PROJECT_ID` - Your Google Cloud project ID
   - `GCP_LOCATION` - Google Cloud region (default: "us-central1")

3. Set up Google Cloud authentication:
   - Download your service account key JSON file
   - Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the path of your service account key:
     ```bash
     export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your-service-account-key.json"
     ```

4. Install dependencies using Poetry:

```bash
poetry install
```

### Running the Application

Start the development server:

```bash
poetry run python main.py
```

Or use Uvicorn directly:

```bash
poetry run uvicorn main:app --reload
```

The API will be available at http://localhost:8000.

## API Documentation

Once the server is running, you can access the API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Key Endpoints

### Health Checks

- `GET /api/v1/health` - Basic health check
- `GET /api/v1/health/db` - Database connection health check
- `GET /api/v1/health/config` - View current configuration

### Chunks Management

- `POST /api/v1/chunks` - Create a new chunk
- `GET /api/v1/chunks` - List all chunks
- `GET /api/v1/chunks/{chunk_id}` - Get a specific chunk
- `PUT /api/v1/chunks/{chunk_id}` - Update a chunk
- `DELETE /api/v1/chunks/{chunk_id}` - Delete a chunk

### Search

- `POST /api/v1/search/vector` - Vector search
- `POST /api/v1/search/text` - Text search
- `POST /api/v1/search/hybrid` - Hybrid search (combining vector and text)
- `POST /api/v1/search/ask` - Ask a question using RAG

## Note on Google Cloud Authentication

For development, you can authenticate to Google Cloud using:

1. Service account key:
   ```
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your-service-account-key.json"
   ```

2. Or run `gcloud auth application-default login` which sets up credentials for Google Cloud SDKs