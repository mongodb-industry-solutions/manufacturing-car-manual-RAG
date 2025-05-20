# Technical Manual Explorer Framework

This project has been restructured to function as a reusable framework for exploring technical manuals across various industries. The application uses MongoDB's document model, vector search, and RAG capabilities to provide powerful search and browsing features for technical documentation.

## Framework Architecture

The application is designed to be easily configurable for different industries and document types:

1. **Central Configuration**: A configuration system that allows customization of industry-specific terms, branding, and features.
2. **Industry-Agnostic Data Models**: The underlying data models support various document structures.
3. **Themeable UI**: Components adapt to industry-specific terminology and branding.
4. **Document Type Support**: The system supports different document types beyond PDFs.
5. **API Flexibility**: Backend APIs designed to work with different collection names and index structures.

## How to Configure for a New Industry

### 1. Create a Configuration File

Create a configuration file for your industry based on the examples provided:

- `config/app.config.json` - Main configuration
- `examples/aviation-config.json` - Aviation industry example
- `examples/manufacturing-config.json` - Manufacturing industry example

The configuration structure includes:

```json
{
  "application": {
    "name": "Your Industry Manual Explorer",
    "industry": "your_industry",
    "description": "Descriptive text"
  },
  "branding": {
    "title": "Your Title",
    "subtitle": "Your Subtitle",
    "primaryColor": "#HexColor",
    "secondaryColor": "#HexColor",
    "accentColor": "#HexColor",
    "logoPath": "/path/to/logo.png"
  },
  "document": {
    "types": ["type1", "type2"],
    "defaultType": "type1",
    "path": "/public/documents",
    "defaultDocument": "your-manual.pdf"
  },
  "industry": {
    "name": "Your Industry",
    "icon": "IconName",
    "terminology": {
      "manual": "Industry Term for Manual",
      "chunk": "Industry Term for Chunk",
      "document": "Term for Document",
      "search": "Term for Search",
      "browse": "Term for Browse"
    },
    "metadata": {
      "contentTypes": ["type1", "type2"],
      "systems": ["system1", "system2"]
    }
  },
  "features": {
    "search": {
      "methods": ["vector", "text", "hybrid"],
      "defaultMethod": "hybrid"
    },
    "chunks": {
      "displayLimit": 20,
      "infiniteScroll": true
    },
    "pdfViewer": {
      "enabled": true,
      "defaultScale": 1.2
    }
  },
  "database": {
    "collections": {
      "chunks": "your_industry_collection"
    },
    "indices": {
      "vector": "your_vector_index",
      "text": "your_text_index"
    }
  }
}
```

### 2. Configure the Backend

1. Set up environment variables:

```bash
# .env file
INDUSTRY=your_industry
APP_NAME="Your Industry Manual Explorer"
APP_DESCRIPTION="Your description"
CHUNKS_COLLECTION=your_industry_collection
VECTOR_INDEX_NAME=your_vector_index
TEXT_INDEX_NAME=your_text_index
```

2. Create a MongoDB Atlas database with the appropriate collection name.

3. Set up vector and text search indices in MongoDB Atlas.

### 3. Process Your Documents

1. Process your industry's documents using the chunking tools.
2. Upload the chunked documents to your MongoDB collection.
3. Place the original documents in the appropriate public folder for PDF viewing.

### 4. Run the Application

1. Start the backend:

```bash
cd backend
poetry install
poetry run python main.py
```

2. Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

## Data Model Customization

The framework uses a flexible data model that can accommodate different industries:

```python
class Chunk(BaseModel):
    id: Optional[str]
    text: str
    context: Optional[str]
    breadcrumb_trail: Optional[str]
    page_numbers: List[int]
    content_type: Optional[List[str]]
    # ... other fields
```

You can customize the content_type and other fields to match your industry's needs.

## Adding New Document Types

To add support for new document types beyond PDFs:

1. Extend the document processing pipeline for your format.
2. Update the viewer components in the frontend.
3. Configure the document types in your configuration file.

## Customizing the UI

The UI components are designed to adapt to your configuration automatically. Key places that use your configuration:

- Header and navigation
- Search results
- Document viewers
- Home page content

## Examples

The `examples` directory contains sample configurations for different industries:

- `aviation-config.json` - For aircraft maintenance manuals
- `manufacturing-config.json` - For equipment maintenance manuals

Copy and modify these examples for your specific industry needs.

## Advanced Customization

For more advanced customization:

1. Modify the data models in `backend/app/models/`.
2. Customize the search implementations in `backend/app/db/repositories/`.
3. Create industry-specific components in the frontend if needed.

## Technical Documentation

For more detailed technical information, refer to:

- `README-BACKEND.md` - Backend architecture and API
- `README.md` - General application information
- `SEARCH_ARCHITECTURE.md` - Search implementation details

## Maintenance

When updating the framework:

1. Keep the configuration system backward compatible.
2. Test with multiple industry configurations.
3. Document any breaking changes.