export const platformOverviewInfo = {
  sections: [
    {
      heading: "Behind the Scenes",
      content: [
        {
          heading: "What This Demo Includes",
          body: `This Car Manual Explorer demonstrates 5 search capabilities, all running on MongoDB Atlas:

1. Text Search (Atlas Search with BM25 scoring)
2. Vector Search (Atlas Vector Search, 768d embeddings)
3. Hybrid Search (native $rankFusion combining text + vector)
4. Graph Search ($graphLookup for relationship traversal)
5. Multimodal Search (dual vector indexes)

Plus: Voyage AI reranking, interactive knowledge graph visualization (Cytoscape.js), and rich document browsing.`
        },
        {
          heading: "Architecture Components",
          body: [
            "Frontend: Next.js + LeafyGreen UI",
            "Backend: FastAPI (Python)",
            "Database: MongoDB Atlas",
            "Embeddings: Google Vertex AI text-embedding-005 (768d), Voyage AI multimodal-3 (1024d)",
            "Reranking: Voyage AI rerank-2.5",
            "Graph Visualization: Cytoscape.js"
          ]
        },
        {
          heading: "Data Model",
          body: `Collections:

1. manual_chunks (~500 documents)
   • Text content + 768d vectors
   • Relationships array for graph traversal
   • Metadata, breadcrumbs, page numbers

2. manual_images (~16 documents)
   • Binary file storage
   • 1024d multimodal embeddings
   • Associated chunk IDs
   • Metadata and keywords

Indexes:
• Atlas Search index on text
• Vector index on text_embedding (768d)
• Vector index on multimodal_embedding (1024d)
• Compound index on relationships.target_id
• Standard indexes on id, page_numbers, content_type`
        },
        {
          heading: "Single Database Architecture",
          body: "Everything queries a single MongoDB Atlas cluster. No separate vector database, no separate graph database, no S3 for images. Text, vectors, graphs, and binaries all stored and queried through MongoDB.",
        },
      ],
    },
    {
      heading: "Why MongoDB",
      content: [
        {
          heading: "Unified Platform",
          body: `Every capability in this demo is native to MongoDB:

✓ Document storage
✓ Full-text search (Atlas Search)
✓ Vector search with dual indexes (Atlas Vector Search)
✓ Hybrid ranking ($rankFusion)
✓ Graph traversal ($graphLookup)
✓ Binary storage

One database. One API. One aggregation framework. No data synchronization between systems.`
        },
        {
          heading: "Traditional Approach Would Require",
          body: `To build this without MongoDB's unified platform:

1. PostgreSQL — Store documents
2. Elasticsearch — Text search
3. Pinecone #1 — Text vectors (768d)
4. Pinecone #2 — Multimodal vectors (1024d)
5. Neo4j — Graph relationships
6. AWS S3 — Image storage
7. Custom middleware — Coordinate everything

That's 6 databases + custom orchestration code.

MongoDB: 1 database.`
        },
        {
          heading: "Developer Productivity",
          body: [
            "One query language (MongoDB aggregation) vs SQL + Cypher + Pinecone API + S3 API",
            "Single client (PyMongo) vs 4+ different client libraries",
            "Unified debugging (one execution plan) vs distributed tracing",
            "Code simplicity: Hybrid search = 1 aggregation stage vs 150+ lines of custom RRF",
            "Schema freedom: Add fields → write them vs plan migrations across 6 systems"
          ],
        },
        {
          heading: "Operational Benefits",
          body: [
            "One connection string vs 6 separate connection configs",
            "One backup strategy vs coordinating 6 backup schedules",
            "One monitoring dashboard vs 6 separate monitoring systems",
            "One security model vs 6 separate auth/access control configs",
            "Data consistency: ACID transactions vs eventual consistency across services"
          ],
        },
        {
          heading: "Single Aggregation Framework",
          body: "All queries—text search, vector search, hybrid search, graph traversal—use the same MongoDB aggregation pipeline syntax. Combine multiple search methods in a single query. Filter, project, group, and sort across all data types with consistent API.",
        },
        {
          heading: "Honest Trade-offs",
          body: `MongoDB is optimized for unified developer experience. Some trade-offs:

• Deep graph traversal (10+ hops): Neo4j faster with index-free adjacency
• Billions of vectors with specialized filtering: Pinecone more optimized
• Complex text analysis (phonetic matching, custom analyzers): Elasticsearch richer
• Multi-region data residency for blobs: S3 more flexible

For RAG applications needing text + vectors + graphs + binaries together (the typical case), MongoDB's unified platform eliminates 80% of integration complexity.

Choose based on your actual requirements, not maximum theoretical capabilities.`
        },
        {
          heading: "Learn More",
          body: "Click the Wizard icons (🧙) next to search methods, the Knowledge Graph badge, and other features throughout this demo to learn technical details about each capability.",
        },
      ],
    },
  ],
};
