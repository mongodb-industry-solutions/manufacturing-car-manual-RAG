export const documentModelInfo = {
  sections: [
    {
      heading: "Behind the Scenes",
      content: [
        {
          heading: "Document Structure",
          body: `Each MongoDB document represents a single chunk from the car manual:

• id: Unique chunk identifier
• text: Full text content
• text_embedding: 768-dimensional vector for semantic search
• relationships: Array of connections to other chunks
• breadcrumb_trail: Navigation hierarchy
• page_numbers: Source page references
• content_type: Classification (procedure, diagnostic, safety)
• vehicle_systems: Relevant systems (cooling, engine, brakes)
• metadata: Flexible fields for additional properties

Everything needed for search, display, and graph traversal in one document.`
        },
        {
          heading: "Why Embed Relationships?",
          body: [
            "Single document fetch gets chunk + relationships (no JOIN)",
            "$graphLookup indexes on relationships.target_id for fast traversal",
            "Add relationship types without schema changes—just write them",
            "Relationships array acts as adjacency list for graph operations",
            "No separate edges collection to manage"
          ]
        },
        {
          heading: "Vector Search Indexing",
          body: `The text_embedding field is indexed with Atlas Vector Search:

Index definition:
• Type: vector
• Path: text_embedding
• Dimensions: 768
• Similarity: cosine

$vectorSearch queries use HNSW algorithm for approximate nearest neighbor search. Query time ~5-10ms for top-10 results from 10k chunks. The vector is just another document field—no separate vector database needed.`
        },
        {
          heading: "Schema Flexibility",
          body: `Different content types have different fields—all in same collection:

Procedure chunks:
• procedural_steps array
• estimated_time_minutes

Safety chunks:
• safety_level (warning, caution, danger)
• consequences text

Diagnostic chunks:
• diagnostic_codes array
• symptoms array

No schema migrations when adding new chunk types. Just start writing documents with new fields. MongoDB's flexible schema adapts automatically.`
        },
      ],
    },
    {
      heading: "Why MongoDB",
      content: [
        {
          heading: "Flexible Document Model",
          body: "MongoDB stores rich, hierarchical data naturally. Text, vectors, relationships, arrays, nested objects—all in one document. Query any field, index any field, update any field without ALTER TABLE migrations. Schema evolves with your application.",
        },
        {
          heading: "Alternative: PostgreSQL with JSONB",
          body: `Relational approach with flexible JSON:

Tables:
• chunks (id, text, embedding VECTOR(768), metadata JSONB)
• relationships (source_id, target_id, type, description)

To get chunk with relationships:
SELECT c.*, json_agg(r) as relationships
FROM chunks c
LEFT JOIN relationships r ON c.id = r.source_id
WHERE c.id = 'chunk_0042'
GROUP BY c.id;

MongoDB: db.chunks.findOne({ id: "chunk_0042" })

Difference: MongoDB embeds relationships (no JOIN). PostgreSQL normalizes (JOIN overhead, separate tables).`
        },
        {
          heading: "Alternative: Pinecone + PostgreSQL",
          body: `Vector database approach:

1. Store vectors in Pinecone (limited metadata)
2. Store full documents in PostgreSQL
3. To search:
   - Query Pinecone for similar vectors
   - Extract IDs from results
   - Query PostgreSQL for full documents
4. Data sync required between systems
5. Consistency challenges

MongoDB: One query returns vectors + full documents + relationships. No synchronization, no consistency gaps.`
        },
        {
          heading: "Embedded vs Normalized",
          body: [
            "Embedded relationships: Single read gets everything (MongoDB)",
            "Normalized relationships: Requires JOINs (PostgreSQL)",
            "MongoDB optimizes for read performance with denormalization",
            "Updates are atomic within single document",
            "Trade-off: Some data duplication for faster reads"
          ]
        },
        {
          heading: "Developer Experience",
          body: [
            "MongoDB aggregation vs SQL + Pinecone API + JOIN logic",
            "Add fields freely vs plan migrations carefully",
            "Single database with ACID vs synchronization across systems",
            "Query one database vs debug multi-database consistency",
            "Rich data types: arrays, nested objects, vectors all native"
          ],
        },
        {
          heading: "Index Strategy",
          body: "MongoDB supports multiple index types on same collection: vector index on embeddings, text index on content, compound index on relationships.target_id, standard indexes on id and page_numbers. All coexist efficiently. Query optimizer chooses appropriate indexes automatically.",
        },
      ],
    },
  ],
};
