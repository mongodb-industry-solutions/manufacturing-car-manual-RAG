export const graphSearchInfo = {
  sections: [
    {
      heading: "Behind the Scenes",
      content: [
        {
          heading: "How GraphRAG Works",
          body: "GraphRAG combines vector search (find relevant starting points) with graph traversal (explore relationships). MongoDB's $graphLookup operator performs recursive relationship following directly in the aggregation pipeline. Find semantically relevant seeds, then expand through documented relationships.",
        },
        {
          heading: "Relationship Types in This Demo",
          body: [
            "SEQUENTIAL_TO: Next steps in procedures (Step 1 → Step 2)",
            "RELATED_TO: Cross-references between topics (cooling system ↔ thermostat)",
            "MENTIONS_SYSTEM: System grouping (all 'brakes' chunks)",
            "IS_OF_TYPE: Content classification (all 'safety' warnings)"
          ],
        },
        {
          heading: "How $graphLookup Works",
          body: `Traversal mechanics:

Starting from seed "chunk_0042" (cooling system):
• Depth 0: chunk_0042 (seed from vector search)
• Depth 1: chunk_0043 (SEQUENTIAL_TO), chunk_0089 (RELATED_TO)
• Depth 2: chunk_0044 (via 0043), chunk_0150 (via 0089)

$graphLookup visits each relationship edge once, using indexed lookups on relationships.target_id for O(log n) performance per hop.`
        },
        {
          heading: "Performance & Limitations",
          body: [
            "Depth 0-1: ~3-5ms (simple indexed lookups)",
            "Depth 2: ~8-15ms (typical for documentation)",
            "Depth 3: ~20-30ms (overhead starts showing)",
            "Depth 5+: Performance degrades (not optimized for deep traversal)",
            "100MB memory limit per operation (spills to disk if exceeded)",
            "Requires index on connectToField for efficiency"
          ]
        },
        {
          heading: "Memory Management",
          body: "If $graphLookup consumes more than 100MB memory, it automatically writes temporary files to disk. You can monitor disk usage through serverStatus and explain() commands. For production, ensure adequate disk space and monitor memory usage patterns.",
        },
      ],
    },
    {
      heading: "Why MongoDB",
      content: [
        {
          heading: "Native Graph Traversal",
          body: "MongoDB's $graphLookup is a native aggregation operator. Relationships are standard document fields—no separate graph database needed. Vector search and graph expansion happen in the same pipeline, same database, with full ACID guarantees.",
        },
        {
          heading: "Data Model Simplicity",
          body: "Relationships stored as array fields within documents. No separate edges collection. No schema migrations to add relationship types—just write them. Adjacency list pattern enables efficient graph operations without specialized graph storage.",
        },
        {
          heading: "Alternative: Neo4j + Pinecone + PostgreSQL",
          body: `Traditional GraphRAG stack:

1. Query Pinecone for vector similarity (get 5 seeds)
2. Query PostgreSQL for full seed documents
3. Query Neo4j for graph traversal with Cypher
4. Query PostgreSQL again for related documents
5. Merge and deduplicate in application code
6. Manage consistency across three databases

Result: 3 databases, 4 queries, manual coordination, eventual consistency

MongoDB: 1 database, 1 aggregation pipeline, automatic deduplication, ACID transactions`
        },
        {
          heading: "Developer Experience",
          body: [
            "Single query language (MongoDB aggregation) vs Cypher + SQL + Pinecone API",
            "Relationships as document fields vs separate graph schema",
            "Single pipeline debug trace vs distributed tracing across systems",
            "Add relationship types without schema migrations",
            "Combine graph traversal with filters, sorting, projections in one query"
          ],
        },
        {
          heading: "Common Use Cases",
          body: [
            "Organizational charts (manager-employee hierarchies)",
            "Catalog navigation (nested categories and subcategories)",
            "Dependency chains (component relationships)",
            "Documentation cross-references (related topics)",
            "Bill of materials (part hierarchies)",
            "Social connections (friend-of-friend relationships)"
          ]
        },
      ],
    },
  ],
};
