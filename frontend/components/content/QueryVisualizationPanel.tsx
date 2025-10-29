/**
 * Query Visualization Panel component
 * Displays MongoDB queries used for different search methods
 */
import React, { useMemo } from 'react';
import ExpandableCard from '@leafygreen-ui/expandable-card';
import { Body } from '@leafygreen-ui/typography';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import Code from '@leafygreen-ui/code';
import Icon from '@leafygreen-ui/icon';
import Badge from '@leafygreen-ui/badge';
import Tooltip from '@leafygreen-ui/tooltip';
interface QueryVisualizationPanelProps {
  searchMethod: string;
  query: string;
  debugInfo?: any; // Debug information from search response
}

const QueryVisualizationPanel: React.FC<QueryVisualizationPanelProps> = ({ 
  searchMethod, 
  query,
  debugInfo
}) => {
  // Hybrid Graph uses a fixed depth of 2 for optimal performance
  const maxDepth = 2;
  // Generate Hybrid Graph pipeline flow analysis
  const getHybridGraphFlowAnalysis = (debugInfo: any): string => {
    const steps = debugInfo?.pipeline_steps || {};
    const step1 = steps.step1_vector_search || {};
    const step2 = steps.step2_facet_split || {};
    const step3 = steps.step3_combine_dedupe_facet || {};
    
    return `📊 Hybrid Graph Pipeline Flow Analysis

Vector → Graph Expansion Method ($facet-based):

Step 1: Vector Search
├── Query: "${query}"
├── Expected: ${step1.expected_results || 5} seed documents
├── numCandidates: ${step1.numCandidates || 50}
└── Result: ${step1.expected_results || 5} highest similarity matches

Step 2: $facet - Parallel Processing Paths
├── Path A (seeds): ${step2.path_a || 'Preserve original 5 seeds with source=\'vector_seed\', depth=0'}
├── Path B (expansion): ${step2.path_b || '$graphLookup expansion (maxDepth=2) from seeds, then filter out seed IDs'}
├── maxDepth: 2 (fixed for optimal performance)
├── Relationship Types: ${step2.relationship_types?.join(', ') || 'all'}
└── Guarantees: 5 seeds preserved + expanded neighbors without duplicates

Step 3: Combine & Deduplicate
├── Score decay: ${step3.score_decay || '0.5 - (0.1 × depth)'}
├── Seeds: Original vector scores (depth=0)
├── Neighbors: Decreasing scores by depth (depth>0)
├── Deduplication: ${step3.deduplication || 'Expanded results exclude any seed IDs to prevent duplicates'}
├── Guaranteed seeds: ${step3.guaranteed_seeds || 5}
└── Final limit: ${step3.actual_results?.total || step3.final_limit || 'N/A'} results (${step3.guaranteed_seeds || 5} seeds + up to ${(step3.final_limit || 30) - (step3.guaranteed_seeds || 5)} expanded)

🔍 Selection Process Details

How Many Results Flow Between Steps:
- Vector→$facet: ${step1.expected_results || 5} seeds → Split into 2 parallel paths
- Path A preserves ${step3.guaranteed_seeds || 5} seeds exactly
- Path B expands + filters → up to ${(step3.final_limit || 30) - (step3.guaranteed_seeds || 5)} neighbors
- Combined result: ${step3.actual_results?.total || 'Final limit'} total documents

Selection Criteria:
- Best vector similarity + relationship proximity
- No duplicate IDs between seeds and expanded neighbors
`;
  };

  // Generate query example based on search method
  const getQueryExample = (method: string, searchQuery: string): string => {
    // Normalize the method name - API might return "hybrid_rrf" but we want to match it to "hybrid"
    const normalizedMethod = method.includes('graph') ? 'graph' : method.includes('hybrid') ? 'hybrid' : method;
    
    switch (normalizedMethod) {
      case 'vector':
        return `db.chunks.aggregate([
  {
    $vectorSearch: {
      index: "manual_vector_index",
      path: "embedding",
      queryVector: [0.123, 0.456, 0.789, ...], // Embedding for "${searchQuery}"
      numCandidates: 100,
      limit: 10
    }
  },
  {
    $project: {
      _id: 0,
      score: { $meta: "vectorSearchScore" },
      chunk_id: "$id",
      text: 1,
      context: 1,
      breadcrumb_trail: 1,
      page_numbers: 1,
      content_type: 1,
      metadata: 1
    }
  }
])`;
      case 'text':
        return `// Enhanced text search with compound operators and boost values
db.chunks.aggregate([
  {
    $search: {
      index: "manual_text_search_index",
      compound: {
        should: [
          // Part 1: Exact phrase matching (highest priority)
          // Finds documents containing the exact phrase - most relevant results
          { phrase: { query: "${searchQuery}", path: "breadcrumb_trail", score: { boost: { value: 10 } } } },
          { phrase: { query: "${searchQuery}", path: "text", score: { boost: { value: 8 } } } },
          
          // Part 2: Individual word matching (medium priority)
          // Finds documents containing all words individually - good relevance
          { text: { query: "${searchQuery}", path: "breadcrumb_trail", score: { boost: { value: 5 } } } },
          { text: { query: "${searchQuery}", path: "text", score: { boost: { value: 4 } } } },
          
          // Part 3: Fuzzy matching (lowest priority)
          // Catches typos and similar words - ensures recall
          { text: { query: "${searchQuery}", path: "breadcrumb_trail", fuzzy: { maxEdits: 1, prefixLength: 3 }, score: { boost: { value: 2 } } } },
          { text: { query: "${searchQuery}", path: "text", fuzzy: { maxEdits: 1, prefixLength: 3 }, score: { boost: { value: 1.5 } } } }
        ]
      }
    }
  },
  { $limit: 10 },
  {
    $project: {
      _id: 0,
      score: { $meta: "searchScore" },
      chunk_id: "$id",
      text: 1,
      breadcrumb_trail: 1,
      page_numbers: 1,
      content_type: 1,
      metadata: 1
    }
  }
])`;
      case 'hybrid':
        return `// Hybrid search using MongoDB's native $rankFusion
// Combines vector search with enhanced compound text search
db.chunks.aggregate([
  {
    $rankFusion: {
      input: {
        pipelines: {
          // Vector search pipeline
          vector: [
            {
              $vectorSearch: {
                index: "manual_vector_index",
                path: "embedding",
                queryVector: [0.123, 0.456, 0.789, ...], // Embedding for "${searchQuery}"
                numCandidates: 150,
              }
            }
          ],
          // Text search pipeline with enhanced compound query
          text: [
            {
              $search: {
                index: "manual_text_search_index",
                compound: {
                  should: [
                    // Exact phrase matching (highest priority)
                    { phrase: { query: "${searchQuery}", path: "breadcrumb_trail", score: { boost: { value: 10 } } } },
                    { phrase: { query: "${searchQuery}", path: "text", score: { boost: { value: 8 } } } },
                    
                    // Individual word matching (medium priority)
                    { text: { query: "${searchQuery}", path: "breadcrumb_trail", score: { boost: { value: 5 } } } },
                    { text: { query: "${searchQuery}", path: "text", score: { boost: { value: 4 } } } },
                    
                    // Fuzzy matching (lowest priority)
                    { text: { query: "${searchQuery}", path: "breadcrumb_trail", fuzzy: { maxEdits: 1, prefixLength: 3 }, score: { boost: { value: 2 } } } },
                    { text: { query: "${searchQuery}", path: "text", fuzzy: { maxEdits: 1, prefixLength: 3 }, score: { boost: { value: 1.5 } } } }
                  ]
                }
              }
            },
          ]
        }
      },
      combination: {
        weights: {
          vector: 0.5, // Vector search weight
          text: 0.5    // Text search weight
        }
      },
      scoreDetails: true // Enable detailed scoring for individual pipeline scores
    }
  },
  { $limit: 10 },
  // Extract raw scores from metadata
  {
    $addFields: {
      score: { $meta: "score" },           // Raw RRF score
      score_details: { $meta: "scoreDetails" } // Individual pipeline details
    }
  },
  // Project final fields
  {
    $project: {
      _id: 0,
      score: 1,
      score_details: 1,
      chunk_id: "$id",
      text: 1,
      context: 1,
      breadcrumb_trail: 1,
      page_numbers: 1,
      content_type: 1,
      metadata: 1,
      vehicle_systems: 1
    }
  }
])`;
      case 'graph':
        return `// Hybrid Graph Search: Vector → Graph Expansion using $facet
// Guarantees exactly 5 seeds + expanded neighbors without duplicates
db.chunks.aggregate([
  // Step 1: Vector search for exactly 5 seed documents
  {
    $vectorSearch: {
      index: "manual_vector_search_index",
      path: "embedding",
      queryVector: [0.123, 0.456, 0.789, ...], // Embedding for "${searchQuery}"
      numCandidates: 50,
      limit: 5  // Get exactly 5 seed documents
    }
  },
  // Step 2: $facet splits into two parallel processing paths
  {
    $facet: {
      // Path A: Preserve original 5 seeds exactly as-is
      seeds: [
        {
          $addFields: {
            source: "vector_seed",
            depth: 0,
            score: { $meta: "vectorSearchScore" },
            seed_id: "$id"  // Track seed IDs for exclusion
          }
        },
        {
          $project: {
            _id: 0,
            score: 1,
            chunk_id: "$id",
            text: 1,
            context: 1,
            breadcrumb_trail: 1,
            page_numbers: 1,
            content_type: 1,
            metadata: 1,
            vehicle_systems: 1,
            source: 1,
            depth: 1,
            seed_id: 1
          }
        }
      ],
      // Path B: Graph expansion from seeds
      expansion: [
        // Store seed IDs for later exclusion
        { $group: { _id: null, seed_ids: { $push: "$id" }, seed_docs: { $push: "$$ROOT" } } },
        { $unwind: "$seed_docs" },
        { $replaceRoot: { newRoot: "$seed_docs" } },
        // Perform $graphLookup from each seed
        {
          $graphLookup: {
            from: "chunks",
            startWith: "$relationships.target_id",
            connectFromField: "relationships.target_id",
            connectToField: "id",
            as: "graph_neighbors",
            maxDepth: ${maxDepth || 2},
            restrictSearchWithMatch: {},  // Optional relationship filtering
            depthField: "traversal_depth"
          }
        },
        // Extract and process neighbors
        { $project: { neighbors: "$graph_neighbors" } },
        { $unwind: "$neighbors" },
        { $replaceRoot: { newRoot: "$neighbors" } },
        {
          $addFields: {
            source: "graph_expansion",
            depth: { $add: [{ $ifNull: ["$traversal_depth", 0] }, 1] },
            score: { $subtract: [0.5, { $multiply: [0.1, { $add: [{ $ifNull: ["$traversal_depth", 0] }, 1] }] }] }
          }
        },
        // Deduplicate expanded results
        { $group: { _id: "$id", doc: { $first: "$$ROOT" }, max_score: { $max: "$score" }, min_depth: { $min: "$depth" } } },
        {
          $project: {
            _id: 0,
            score: "$max_score",
            chunk_id: "$_id",
            text: "$doc.text",
            context: "$doc.context",
            breadcrumb_trail: "$doc.breadcrumb_trail",
            page_numbers: "$doc.page_numbers",
            content_type: "$doc.content_type",
            metadata: "$doc.metadata",
            vehicle_systems: "$doc.vehicle_systems",
            source: "$doc.source",
            depth: "$min_depth"
          }
        },
        { $sort: { score: -1, depth: 1 } },
        { $limit: 60 }  // Get more candidates than needed
      ]
    }
  },
  // Step 3: Process facet results
  {
    $project: {
      seeds: 1,
      expansion: 1,
      seed_ids: { $map: { input: "$seeds", as: "seed", in: "$$seed.chunk_id" } }
    }
  },
  // Step 4: Filter expansion to exclude seed IDs (prevent duplicates)
  {
    $project: {
      seeds: 1,
      filtered_expansion: {
        $filter: {
          input: "$expansion",
          as: "exp",
          cond: { $not: { $in: ["$$exp.chunk_id", "$seed_ids"] } }
        }
      }
    }
  },
  // Step 5: Limit expanded results
  {
    $project: {
      seeds: 1,
      filtered_expansion: { $slice: ["$filtered_expansion", 25] }  // Up to 25 expanded (5 seeds + 25 = 30 total)
    }
  },
  // Step 6: Combine seeds (always 5) + filtered expansion
  {
    $project: {
      combined: { $concatArrays: ["$seeds", "$filtered_expansion"] }
    }
  },
  { $unwind: "$combined" },
  { $replaceRoot: { newRoot: "$combined" } },
  // Remove seed_id field from final output
  { $project: { seed_id: 0 } }
])`;
      default:
        return 'No query example available for this search method.';
    }
  };

  const getMethodIcon = (method: string) => {
    // Normalize the method name
    const normalizedMethod = method.includes('graph') ? 'graph' : method.includes('hybrid') ? 'hybrid' : method;
    
    switch (normalizedMethod) {
      case 'vector':
        return <Icon glyph="Diagram" size="small" fill={palette.blue.base} />;
      case 'text':
        return <Icon glyph="String" size="small" fill={palette.green.base} />;
      case 'hybrid':
        return <Icon glyph="Settings" size="small" fill={palette.purple.base} />;
      case 'graph':
        return <Icon glyph="Relationship" size="small" fill={palette.red.base} />;
      default:
        return <Icon glyph="MagnifyingGlass" size="small" />;
    }
  };

  const getMethodColor = (method: string) => {
    // Normalize the method name
    const normalizedMethod = method.includes('graph') ? 'graph' : method.includes('hybrid') ? 'hybrid' : method;
    
    switch (normalizedMethod) {
      case 'vector':
        return palette.blue.base;
      case 'text':
        return palette.green.base;
      case 'hybrid':
        return palette.purple.base;
      case 'graph':
        return palette.red.base;
      default:
        return palette.gray.base;
    }
  };

  const getMethodName = (method: string) => {
    // Normalize the method name
    const normalizedMethod = method.includes('graph') ? 'graph' : method.includes('hybrid') ? 'hybrid' : method;
    
    switch (normalizedMethod) {
      case 'vector':
        return 'Vector Search';
      case 'text':
        return 'Text Search';
      case 'hybrid':
        return 'Hybrid Search';
      case 'graph':
        return 'Hybrid Graph Search';
      default:
        return 'Search';
    }
  };

  const getMethodDescription = (method: string) => {
    // Normalize the method name
    const normalizedMethod = method.includes('graph') ? 'graph' : method.includes('hybrid') ? 'hybrid' : method;
    
    switch (normalizedMethod) {
      case 'vector':
        return 'Uses MongoDB Atlas Vector Search to find semantically similar content using vector embeddings';
      case 'text':
        return 'Enhanced MongoDB Atlas Search with compound operators, prioritizing breadcrumb trail navigation context';
      case 'hybrid':
        return 'Combines Vector and Text search using MongoDB\'s native $rankFusion aggregation stage';
      case 'graph':
        return 'Semantic vector search expanded via MongoDB\'s $graphLookup for relationship traversal';
      default:
        return '';
    }
  };

  // MongoDB feature badges
  const getMethodBadges = (method: string) => {
    const badges = [];
    
    // Normalize the method name
    const normalizedMethod = method.includes('graph') ? 'graph' : method.includes('hybrid') ? 'hybrid' : method;
    
    if (normalizedMethod === 'vector' || normalizedMethod === 'hybrid') {
      badges.push(
        <Tooltip
          key="vector-badge"
          trigger={
            <Badge variant="green">Atlas Vector Search</Badge>
          }
          triggerEvent="hover"
        >
          MongoDB Atlas Vector Search provides semantic search using vector embeddings
        </Tooltip>
      );
    }
    
    if (normalizedMethod === 'text' || normalizedMethod === 'hybrid') {
      badges.push(
        <Tooltip
          key="text-badge"
          trigger={
            <Badge variant="blue">Atlas Search</Badge>
          }
          triggerEvent="hover"
        >
          Enhanced MongoDB Atlas Search with compound operators, prioritizing breadcrumb trail navigation context
        </Tooltip>
      );
    }
    
    if (normalizedMethod === 'hybrid') {
      badges.push(
        <Tooltip
          key="rankfusion-badge"
          trigger={
            <Badge variant="lightgray">$rankFusion</Badge>
          }
          triggerEvent="hover"
        >
          MongoDB's native $rankFusion stage performs Reciprocal Rank Fusion automatically
        </Tooltip>
      );
    }
    
    if (normalizedMethod === 'graph') {
      badges.push(
        <Tooltip
          key="vector-badge"
          trigger={
            <Badge variant="green">Atlas Vector Search</Badge>
          }
          triggerEvent="hover"
        >
          MongoDB Atlas Vector Search for semantic seed discovery
        </Tooltip>
      );
      
      badges.push(
        <Tooltip
          key="graphlookup-badge"
          trigger={
            <Badge variant="red">$graphLookup</Badge>
          }
          triggerEvent="hover"
        >
          MongoDB&apos;s native $graphLookup aggregation stage for relationship traversal
        </Tooltip>
      );
    }
    
    return badges;
  };

  // Memoize expensive computations to prevent infinite re-renders
  const methodIcon = useMemo(() => getMethodIcon(searchMethod), [searchMethod]);
  const methodName = useMemo(() => getMethodName(searchMethod), [searchMethod]);
  const methodDescription = useMemo(() => getMethodDescription(searchMethod), [searchMethod]);
  const methodColor = useMemo(() => getMethodColor(searchMethod), [searchMethod]);
  const methodBadges = useMemo(() => getMethodBadges(searchMethod), [searchMethod]);
  const queryExample = useMemo(() => getQueryExample(searchMethod, query), [searchMethod, query]);
  const cardStyle = useMemo(() => ({ 
    border: `1px solid ${methodColor}`,
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)'
  }), [methodColor]);
  const titleElement = useMemo(() => (
    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
      {methodIcon}
      <span>MongoDB {methodName} Query</span>
    </div>
  ), [methodIcon, methodName]);

  return (
    <div style={{ marginBottom: spacing[3] }}>
      <ExpandableCard
        title={titleElement}
        description={methodDescription}
        defaultOpen={false}
        style={cardStyle}
      >
        <div style={{ marginBottom: spacing[3] }}>
          <div style={{ display: 'flex', gap: spacing[2], marginBottom: spacing[3], flexWrap: 'wrap' }}>
            {methodBadges}
          </div>
          
          <div style={{ backgroundColor: palette.gray.light3, padding: spacing[2], borderRadius: '4px' }}>
            <Code language="javascript">
              {queryExample}
            </Code>
          </div>
          
          {/* Hybrid Graph Flow Analysis */}
          {searchMethod.includes('graph') && debugInfo && (
            <div style={{ 
              marginTop: spacing[3],
              padding: spacing[3],
              backgroundColor: palette.green.light3,
              borderLeft: `4px solid ${palette.red.base}`,
              borderRadius: '4px'
            }}>
              <div style={{ marginBottom: spacing[2] }}>
                <strong style={{ 
                  color: palette.red.dark2,
                  fontSize: '16px'
                }}>
                  🔍 Real-time Hybrid Graph Pipeline Analysis
                </strong>
              </div>
              <Code language="none" style={{ fontSize: '12px' }}>
                {getHybridGraphFlowAnalysis(debugInfo)}
              </Code>
            </div>
          )}
          
          <div style={{ 
            marginTop: spacing[3],
            padding: spacing[2],
            backgroundColor: 'white',
            borderLeft: `4px solid ${methodColor}`,
            borderRadius: '4px'
          }}>
            <Body size="small">
              <strong>How it works:</strong> {
                searchMethod === 'vector' 
                  ? 'Vector search embeds your query text into a high-dimensional vector and finds documents with similar vectors, capturing semantic meaning beyond keywords.'
                  : searchMethod === 'text'
                    ? 'Enhanced text search uses compound operators with boost values: phrase operators (highest priority) find exact phrases, text operators find individual words, and fuzzy matching catches typos. Breadcrumb trail matches are prioritized over main text content to emphasize navigation context.'
                    : searchMethod.includes('hybrid')
                      ? 'Hybrid search combines both approaches using MongoDB\'s native $rankFusion stage, which automatically performs Reciprocal Rank Fusion (RRF) to merge and rank results from both search methods.'
                      : searchMethod.includes('graph')
                        ? 'Hybrid Graph Search combines semantic vector search with relationship traversal. It starts with $vectorSearch to find the most semantically similar documents as seeds, then uses MongoDB\'s $graphLookup to expand through document relationships, providing both semantic relevance and contextual connectivity.'
                        : 'MongoDB Atlas Search for finding relevant documents.'
              }
            </Body>
          </div>
        </div>
      </ExpandableCard>
    </div>
  );
};

export default QueryVisualizationPanel;