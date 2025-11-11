export const vectorSearchInfo = {
  sections: [
    {
      heading: "Behind the Scenes",
      content: [
        {
          heading: "How Vector Search Works",
          body: "Vector search finds documents by semantic similarity rather than exact keyword matching. Text is converted to numerical vectors (embeddings) that capture meaning. Similar concepts cluster together in high-dimensional space, enabling searches by intent and context.",
        },
        {
          heading: "HNSW Algorithm",
          body: `Atlas Vector Search uses Hierarchical Navigable Small World (HNSW) graphs:

• Multi-layer graph structure built during indexing
• Each node connects to nearby neighbors in vector space
• Search starts at top layer (sparse, long-range connections)
• Progressively descends to denser layers for precision
• Greedy search finds approximate nearest neighbors

Trade-off: 99%+ recall accuracy with 100x faster queries than exact search. Optimized for production workloads where speed and scale matter more than perfect precision.`
        },
        {
          heading: "Embedding Models",
          body: `This demo uses Google's text-embedding-005 (768 dimensions).

Key requirement: Same embedding model MUST be used for both indexing and querying. Different models produce incompatible vector spaces—you cannot mix them.

Vectors are normalized to unit length. Similarity measured by cosine similarity (equivalent to dot product for normalized vectors).`
        },
        {
          heading: "Index Characteristics",
          body: [
            "~30MB index size for 10,000 768-dimensional vectors",
            "O(log N) approximate query time",
            "99%+ recall accuracy (finds 99+ of top 100 results)",
            "Query latency: ~5-10ms for typical workloads",
            "Automatic index optimization by MongoDB"
          ]
        },
      ],
    },
    {
      heading: "Why MongoDB",
      content: [
        {
          heading: "Native Vector Indexing",
          body: "Atlas Vector Search is built directly into MongoDB. Vectors are standard document fields—no separate vector database needed. Create indexes through Atlas UI or API, query using standard aggregation pipelines. Vectors, metadata, and full documents stored together.",
        },
        {
          heading: "Unified Data Model",
          body: "Store operational data, metadata, and vector embeddings in the same database. No data synchronization between systems. No consistency lag. Single source of truth for your application state.",
        },
        {
          heading: "Alternative: Pinecone + PostgreSQL",
          body: `Dedicated vector database approach:

1. Store vectors in Pinecone with limited metadata
2. Store full documents in PostgreSQL
3. To search:
   - Query Pinecone for similar vectors (returns IDs)
   - Query PostgreSQL with those IDs for full documents
   - Merge results in application code
4. Data sync required between systems
5. Consistency challenges during updates

MongoDB: Single query returns vectors + full documents + metadata. No synchronization, no consistency gaps, no merge logic.`
        },
        {
          heading: "Alternative: PostgreSQL pgvector",
          body: `PostgreSQL with pgvector extension:

Limitations compared to MongoDB:
• IVFFlat index: 80-90% recall (vs 99%+ for HNSW)
• Slower query performance at scale
• Index build time grows significantly with dataset size
• VACUUM overhead increases with large vector data
• Not optimized for vector workloads

MongoDB uses HNSW algorithm purpose-built for approximate nearest neighbor search, providing better recall and performance for vector-heavy applications.`
        },
        {
          heading: "Developer Experience",
          body: [
            "Same aggregation framework for vector, text, and graph queries",
            "Vector indexes managed like any other MongoDB index",
            "Combine vector search with filters, projections, $lookup in one pipeline",
            "MongoDB Compass and Atlas UI support vector index creation and monitoring",
            "No separate client library—use standard MongoDB drivers"
          ],
        },
        {
          heading: "Query Flexibility",
          body: "Combine vector search with filters on metadata fields. For example: find semantically similar documents AND created in the last 30 days AND tagged 'engineering'. All in a single query with efficient index usage.",
        },
        {
          heading: "When Pinecone Excels",
          body: `Pinecone is purpose-built for vectors and excels at:

• Billions of vectors with complex metadata filtering
• Real-time updates at massive scale (millions of updates/sec)
• Namespaces for multi-tenancy isolation
• Specialized vector operations (sparse-dense hybrid)
• Dedicated infrastructure for vector-only workloads

For RAG applications needing text, metadata, and vectors together (the typical case), MongoDB's unified platform eliminates the complexity of managing and synchronizing multiple systems.`
        },
      ],
    },
  ],
};
