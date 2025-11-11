export const multimodalSearchInfo = {
  sections: [
    {
      heading: "Behind the Scenes",
      content: [
        {
          heading: "How Multimodal Search Works",
          body: "Multimodal search uses vision-language models to create embeddings that understand both text and images in a shared vector space. You can search for images using text descriptions (\"dashboard warning symbols\") or upload reference images to find visually similar ones.",
        },
        {
          heading: "Voyage AI Multimodal Model",
          body: [
            "Model: voyage-multimodal-3 (1024 dimensions)",
            "Understands visual concepts: shapes, colors, layouts, objects, text in images",
            "Shared embedding space: text and images mapped to same vector space",
            "Enables cross-modal search: text query finds relevant images",
            "Image-to-image search: find visually similar images"
          ]
        },
        {
          heading: "Search Capabilities",
          body: [
            "Text-to-image: Describe what you're looking for in natural language",
            "Image-to-image: Upload reference image to find similar ones",
            "Associated text chunks: Retrieve related text documentation with images",
            "Same query API: Vector search on multimodal embeddings uses $vectorSearch"
          ]
        },
        {
          heading: "Dual Vector Indexes",
          body: `This demo has TWO vector indexes in the same database:

1. Text vectors (768d): Google text-embedding-005
   • For semantic text search

2. Multimodal vectors (1024d): Voyage AI multimodal-3
   • For image search (text-to-image, image-to-image)

Both indexes live in MongoDB Atlas. No separate vector database. Query both using the same aggregation framework.`
        },
      ],
    },
    {
      heading: "Why MongoDB",
      content: [
        {
          heading: "Unified Vector Storage",
          body: "MongoDB supports multiple vector indexes with different dimensions in the same database. Text vectors (768d) and multimodal vectors (1024d) coexist naturally. No need for separate databases for different embedding types.",
        },
        {
          heading: "Images + Vectors + Metadata Together",
          body: "MongoDB stores image binaries, metadata, and multimodal embeddings together. Text chunks reference images through IDs. All in one database with ACID transactions. No synchronization between blob storage and vector database.",
        },
        {
          heading: "Alternative: Weaviate + S3",
          body: `Specialized multimodal vector database:

1. Store images in S3
2. Store vectors + S3 URLs in Weaviate
3. To search:
   - Query Weaviate for similar vectors
   - Get S3 URLs from results
   - Generate pre-signed URLs
   - Fetch images from S3
4. To get associated text:
   - Query PostgreSQL with chunk IDs
   - Merge results in application

Result: 3 services, multiple queries, complex coordination

MongoDB: 1 database, vectors + images + text together, single query returns everything.`
        },
        {
          heading: "Image Storage",
          body: [
            "Images stored with metadata in MongoDB",
            "Multimodal embeddings stored in image metadata",
            "Vector search returns image documents with embeddings",
            "Stream binary data on-demand",
            "Associated text chunks linked through IDs in same database"
          ]
        },
        {
          heading: "Developer Experience",
          body: [
            "Single MongoDB driver handles vectors, images, and text",
            "No pre-signed URLs—images stream directly from MongoDB",
            "Standard $vectorSearch for both text and image embeddings",
            "Consistent data model: images link to chunks through IDs",
            "One connection, one API, one query language"
          ],
        },
        {
          heading: "Query Simplicity",
          body: "Search for images, get results with metadata, stream binary data—all using MongoDB API. No orchestration between S3, vector database, and document store. Single pipeline can filter by metadata, search by vector similarity, and return full results.",
        },
        {
          heading: "When Weaviate Excels",
          body: `Weaviate is purpose-built for multimodal AI and excels at:

• Built-in vectorization modules (automatic embedding generation)
• Native multi-tenancy with complex isolation requirements
• Hybrid cloud deployments with specific vector scaling needs
• Advanced vector operations (multi-target vectors, custom distance metrics)
• Specialized multimodal scenarios beyond standard search

For RAG applications needing text, images, and vectors together with unified queries, MongoDB's platform approach eliminates integration complexity while providing excellent multimodal capabilities.`
        },
      ],
    },
  ],
};
