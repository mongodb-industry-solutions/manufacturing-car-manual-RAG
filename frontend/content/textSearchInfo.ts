export const textSearchInfo = {
  sections: [
    {
      heading: "Behind the Scenes",
      content: [
        {
          heading: "How Text Search Works",
          body: "Atlas Search provides full-text search capabilities built on Apache Lucene. It tokenizes text, applies language-specific analysis (stemming, stop words), and creates inverted indexes for fast keyword matching with relevance scoring. Supports fuzzy matching for typo tolerance.",
        },
        {
          heading: "BM25 Scoring Algorithm",
          body: `Atlas Search uses BM25 (Best Match 25) for relevance ranking:

Key factors:
• IDF (Inverse Document Frequency): Rare terms score higher
• Term frequency: Multiple occurrences boost score
• Document length normalization: Prevents long documents from dominating

BM25 balances term frequency against document length, providing more nuanced relevance than simple term counting. Tunable parameters allow customization for different content types.`
        },
        {
          heading: "Text Analysis Pipeline",
          body: [
            "Tokenization: Split text into searchable terms",
            "Lowercasing: Normalize case (\"Engine\" = \"engine\")",
            "Stop words: Remove common words (\"the\", \"and\", \"is\")",
            "Stemming: Reduce to root form (\"running\" → \"run\", \"overheating\" → \"overheat\")",
            "Result: Optimized index for semantic keyword matching"
          ]
        },
        {
          heading: "Fuzzy Matching",
          body: "Handles typos and misspellings with edit distance (Levenshtein distance). Configurable maxEdits parameter (1-2 character differences). Example: \"engien\" matches \"engine\" with 1-character edit distance. Balances recall (finding matches) with precision (avoiding false matches).",
        },
      ],
    },
    {
      heading: "Why MongoDB",
      content: [
        {
          heading: "Integrated Search Engine",
          body: "Atlas Search is built into MongoDB Atlas—no separate search infrastructure. Create indexes through Atlas UI, query using aggregation pipelines. Same security model, same backups, same monitoring. Search is a database feature, not a separate service.",
        },
        {
          heading: "Unified Query API",
          body: "Combine text search with filters, projections, lookups, and aggregations in a single pipeline. For example: full-text search AND filter by date range AND group by category—all in one query with efficient index usage.",
        },
        {
          heading: "Alternative: Elasticsearch + PostgreSQL",
          body: `Traditional text search stack:

1. Store documents in PostgreSQL
2. Sync data to Elasticsearch (change data capture)
3. Query Elasticsearch for text matches
4. Extract document IDs from results
5. Query PostgreSQL for full documents
6. Manage data consistency between systems

Result: 2 databases, sync overhead, eventual consistency, dual infrastructure

MongoDB: Text search is a database feature. Same data, same queries, immediate consistency.`
        },
        {
          heading: "Alternative: PostgreSQL Full-Text Search",
          body: `PostgreSQL native full-text search (tsvector/tsquery):

Limitations compared to Atlas Search:
• Simpler tf-idf variant (less sophisticated than BM25)
• Limited fuzzy matching capabilities
• No faceting or aggregation features
• Slower GIN index updates
• Basic language support compared to Lucene's analyzers

Atlas Search: Advanced scoring, rich query operators, fuzzy/phonetic matching, facets, highlights, autocomplete.`
        },
        {
          heading: "Developer Experience",
          body: [
            "$search works in pipelines alongside $match, $group, $lookup, $vectorSearch",
            "Visual index builder in Atlas UI with instant preview",
            "MongoDB-native syntax—no need to learn Elasticsearch Query DSL",
            "Same drivers, monitoring, and connection pooling as regular queries",
            "Combine text search with vector search via $rankFusion in same pipeline"
          ],
        },
        {
          heading: "Index Management",
          body: "Text search indexes are managed like vector indexes—through Atlas UI or API. Auto-sync with data changes. No manual reindexing required. Configure analyzers, language support, and field weights through JSON-based index definitions.",
        },
        {
          heading: "When Elasticsearch Excels",
          body: `Elasticsearch is purpose-built for search and excels at:

• Complex text analysis (custom analyzers, phonetic matching, language detection)
• Advanced aggregations and faceting at massive scale
• Real-time analytics dashboards (ELK stack)
• Log analysis and time-series data
• Self-managed deployments with specific tuning requirements

For application search where documents already live in MongoDB, Atlas Search eliminates infrastructure complexity while providing excellent search quality for typical use cases.`
        },
      ],
    },
  ],
};
