export const hybridSearchInfo = {
  sections: [
    {
      heading: "Behind the Scenes",
      content: [
        {
          heading: "How Hybrid Search Works",
          body: "Hybrid search combines text search and vector search, then merges results using Reciprocal Rank Fusion (RRF). MongoDB 8.0+ introduced native $rankFusion that handles this entire process in a single aggregation stage, eliminating the need for application-level merging code.",
        },
        {
          heading: "Key Capabilities",
          body: [
            "Combines $vectorSearch, $search, $geoNear, $sort, and $match in one stage",
            "Flexible pipeline weighting (adjust importance of each search method)",
            "Automatic deduplication of results appearing in multiple pipelines",
            "Native RRF implementation optimized by MongoDB query engine",
            "Works only with single collection (no database scope operations)"
          ],
        },
        {
          heading: "RRF Algorithm Explained",
          body: `Reciprocal Rank Fusion merges rankings using this formula:

score(doc) = Σ 1/(k + rank_i)

Where:
• k = 60 (constant for score normalization)
• rank_i = document position in each result set (1-indexed)
• Σ = sum across all search pipelines

Example: Document appears in both vector (rank 3) and text (rank 7):
RRF score = 1/(60+3) + 1/(60+7) = 0.0159 + 0.0149 = 0.0308

Documents appearing in multiple result sets score higher, indicating relevance across different search methods.`
        },
        {
          heading: "Requirements",
          body: [
            "MongoDB 8.0 or later required",
            "Support case needed for 8.0.X versions (fully GA in 8.1+)",
            "Single collection only (no cross-collection operations)",
            "Valid search indexes required for each pipeline type"
          ]
        },
      ],
    },
    {
      heading: "Why MongoDB",
      content: [
        {
          heading: "Native Database Feature",
          body: "MongoDB handles hybrid search entirely within the database. Text search, vector search, and RRF merging all happen server-side with no application-level coordination needed. This eliminates network overhead and reduces code complexity.",
        },
        {
          heading: "Alternative: Multi-System Approach",
          body: `Without native RRF, typical architecture requires:

1. Query Elasticsearch for text matches
2. Query Pinecone for vector similarity
3. Normalize scores (different score ranges across systems)
4. Implement RRF algorithm in application code (~150 lines)
5. Query PostgreSQL to hydrate full documents
6. Handle edge cases (duplicates, timeouts, partial failures)

Result: 3 separate systems, 3+ network calls, complex orchestration logic

MongoDB: Single database, single aggregation pipeline, automatic score normalization`
        },
        {
          heading: "Developer Benefits",
          body: [
            "Single query language for all search types (no context switching)",
            "One API call replaces coordination across multiple services",
            "Built-in error handling and retry logic",
            "Database manages RRF updates as algorithm evolves",
            "Pipeline debugging with explain() shows complete execution path"
          ],
        },
        {
          heading: "Operational Simplicity",
          body: "One connection string, one credential set, one monitoring dashboard. Hybrid search becomes a database feature rather than a distributed systems problem. No need to manage data consistency between separate text and vector stores.",
        },
        {
          heading: "Flexible Weighting",
          body: "Adjust relative importance of search methods dynamically. For example, weight vector search at 0.7 and text at 0.3 for semantic-heavy queries, or reverse for keyword-focused searches. Changes require no infrastructure modifications.",
        },
        {
          heading: "When Specialized Tools Excel",
          body: "Elasticsearch offers richer text analysis (phonetic matching, complex analyzers, language detection). Pinecone provides specialized vector operations at billions-of-vectors scale. If you need only text OR only vectors, specialized tools may be optimal. Hybrid search is where MongoDB's unified platform provides the greatest value by eliminating integration overhead.",
        },
      ],
    },
  ],
};
