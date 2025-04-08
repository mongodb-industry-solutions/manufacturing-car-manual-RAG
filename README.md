# Car Manual RAG Demo

A comprehensive web application for exploring automotive technical manuals using advanced search capabilities powered by MongoDB Atlas and AI technologies.

## Solutions Overview

This application demonstrates an end-to-end solution for intelligent document exploration focusing on automotive technical manuals:

- **Document Processing**: Car manuals are parsed using document AI, maintaining hierarchical structure and semantic relationships
- **Intelligent Chunking**: Content is divided into meaningful chunks that preserve context, safety notices, procedural steps, and related information
- **Vector Embeddings**: Chunk text is converted to embeddings using Vertex AI or AWS Bedrock
- **Unified Storage**: MongoDB Atlas stores document chunks along with metadata and embeddings
- **Multiple Search Methods**: The application provides three powerful search approaches:
  - **Vector Search**: Semantic similarity matching using embeddings
  - **Text Search**: Keyword-based search using MongoDB Atlas full-text indexing
  - **Hybrid Search**: Combines both approaches using Reciprocal Rank Fusion (RRF)
- **RAG Implementation**: Ask questions about manual content with AI-generated answers based on relevant chunks

## Architecture

### Frontend
- **Framework**: Next.js Progressive Web Application (PWA)
- **Components**: React with MongoDB Leafygreen UI design system
- **Type Safety**: TypeScript implementation with strong typing
- **State Management**: React hooks for search, RAG, and chunk management
- **API Integration**: Service layer for communication with backend
- **Responsive Design**: Mobile and desktop support

### Backend
- **API Framework**: Python FastAPI with automatic documentation
- **Dependency Management**: Poetry for Python package management
- **Database Access**: MongoDB integration using PyMongo
- **Search Repository**: Dedicated repositories for vector, text, and hybrid search
- **Embedding Service**: Integration with AI providers for generating and utilizing embeddings
- **Configuration**: External configuration through environment variables and config files

### Database
- **Platform**: MongoDB Atlas for document storage and search
- **Vector Search**: MongoDB Atlas Vector Search with cosine similarity
- **Text Search**: MongoDB text indexing with boosting and scoring
- **Data Model**: Rich document structure with metadata, hierarchical context, and embeddings
- **Indexing**: Optimized indexes for both vector and text search operations

### AI Integration
- **Embedding Models**: Support for Vertex AI or AWS Bedrock Cohere embeddings
- **RAG Pipeline**: Retrieval-Augmented Generation for answering user questions
- **LLM Integration**: API wrappers for AI model interaction

## Prerequisites

- **MongoDB Atlas Account**: With vector search capability enabled
- **Database Access**: MongoDB connection string with appropriate permissions
- **Python Environment**: Python 3.10 for backend
- **Node.js**: Latest LTS version for frontend development
- **AI Service Access**:
  - Google Cloud project with Vertex AI API enabled, OR
  - AWS account with Bedrock access for Cohere embeddings and Claude models
- **Docker** (optional): For containerized deployment

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Poetry if not already installed:
```bash
pip install poetry
```

3. Set up Python environment and install dependencies:
```bash
poetry install
```

4. Create an environment file:
```bash
cp .env.example .env
```

5. Configure the `.env` file with your credentials:
```
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=genai_car_assistantv2
COLLECTION_NAME=manual_chunks
CORS_ORIGINS=["http://localhost:3000"]

# For AWS Bedrock:
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region

# For Google Vertex AI:
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your-service-account-key.json
```

6. Start the backend server:
```bash
poetry run python main.py
```

The API will be available at http://localhost:8000 with documentation at http://localhost:8000/docs.

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
cp env.local.example .env.local
```

4. Configure the `.env.local` file:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

5. Start the development server:
```bash
npm run dev
```

The frontend will be available at http://localhost:3000.

### Docker Deployment

For containerized deployment:

1. Build and start the containers:
```bash
docker-compose up -d
```

2. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Data Structure

The application uses a rich document model for car manual chunks:

```json
{
  "id": "chunk_0042",
  "text": "To change a flat tire, first ensure the vehicle is safely parked...",
  "breadcrumb_trail": "Roadside Emergencies > Changing a Tire",
  "page_numbers": [145, 146],
  "content_type": ["procedure", "safety"],
  "heading_level_1": "Roadside Emergencies",
  "heading_level_2": "Changing a Tire",
  "safety_notices": [
    {"type": "WARNING", "content": "Never get under a vehicle supported only by a jack."}
  ],
  "procedural_steps": [
    {"marker": "1", "instruction": "Park on a level surface, set parking brake..."},
    {"marker": "2", "instruction": "Place wheel chocks in front and behind..."}
  ],
  "vehicle_systems": ["suspension", "brakes"],
  "metadata": {"page_count": 2, "chunk_length": 523},
  "next_chunk_id": "chunk_0043",
  "prev_chunk_id": "chunk_0041"
}
```

## Search Implementation

The application implements three search methods:

1. **Vector Search**: Uses MongoDB's `$vectorSearch` aggregation with cosine similarity
2. **Text Search**: Leverages MongoDB text indexing with the `$text` operator
3. **Hybrid Search**: Combines results using Reciprocal Rank Fusion algorithm

## Demo and Exploration

A comprehensive demo script is available in `frontend/DEMO_SCRIPT.md` that provides a walkthrough of the application's capabilities and features.

Example search queries:
- Vector: "How do I fix a flat tire?"
- Text: "battery replacement procedure"
- Hybrid: "dashboard warning lights"

## License

This project is provided as a demonstration and learning resource.

## Acknowledgments

- MongoDB Atlas for database services
- AWS Bedrock/Google Vertex AI for AI services
- Technical documentation for providing the content sample