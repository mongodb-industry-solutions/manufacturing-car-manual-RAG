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
    const step2 = steps.step2_graph_expansion || {};
    const step3 = steps.step3_combine_dedupe_facet || {};
    
    return `📊 Hybrid Graph Pipeline Flow Analysis

Vector → Graph Expansion Method:

Step 1: Vector Search
├── Query: "${query}"
├── Expected: ${step1.expected_results || 5} seed documents
├── numCandidates: ${step1.numCandidates || 50}
└── Result: ${step1.expected_results || 5} highest similarity matches

Step 2: Graph Expansion  
├── $graphLookup from ${step1.expected_results || 5} seeds
├── maxDepth: 2 (fixed for optimal performance)
├── Traverses: ${step2.relationship_types?.join(', ') || 'SEQUENTIAL_TO, RELATED_TO, MENTIONS_SYSTEM, IS_OF_TYPE'}
└── Expands relationship network

Step 3: Combine & Score
├── Score decay: ${step3.score_decay || '0.5 - (0.1 × depth)'}
├── Seeds: Original vector scores
├── Neighbors: Decreasing scores by depth
├── Deduplicate: Keep highest score per document
└── Final limit: ${step3.actual_results?.total || step3.final_limit || 'N/A'} results (configurable)

🔍 Selection Process Details

How Many Results Flow Between Steps:
- Vector→Graph: ${step1.expected_results || 5} seeds → Graph expansion → ${step3.actual_results?.total || 'Final limit'}

Selection Criteria:
- Best vector similarity + relationship proximity
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
        return `// Hybrid Graph Search: Vector → Graph Expansion
// Step 1: Vector search for semantic seeds, Step 2: $graphLookup expansion
db.chunks.aggregate([
  // Step 1: Vector search for 5 seed documents
  {
    $vectorSearch: {
      index: "manual_vector_search_index",
      path: "embedding",
      queryVector: [0.123, 0.456, 0.789, ...], // Embedding for "${searchQuery}"
      numCandidates: 50,
      limit: 5
    }
  },
  // Step 2: $graphLookup expansion from vector seeds
  {
    $graphLookup: {
      from: "chunks",
      startWith: "$relationships.target_id",
      connectFromField: "relationships.target_id",
      connectToField: "id",
      as: "graph_neighbors",
      maxDepth: ${maxDepth || 2},
      restrictSearchWithMatch: {}, // Optional relationship type filtering
      depthField: "traversal_depth"
    }
  },
  // Step 3: Combine seeds + neighbors with score decay
  {
    $addFields: {
      all_docs: {
        $concatArrays: [
          [{ doc: "$$ROOT", source: "vector_seed", score: { $meta: "vectorSearchScore" }, depth: 0 }],
          {
            $map: {
              input: "$graph_neighbors",
              as: "neighbor",
              in: {
                doc: "$$neighbor",
                source: "graph_expansion", 
                score: { $subtract: [0.5, { $multiply: [0.1, { $ifNull: ["$$neighbor.traversal_depth", 1] }] }] },
                depth: { $ifNull: ["$$neighbor.traversal_depth", 1] }
              }
            }
          }
        ]
      }
    }
  },
  { $unwind: "$all_docs" },
  { $replaceRoot: { newRoot: "$all_docs" } },
  { $group: { _id: "$doc.id", doc: { $first: "$doc" }, max_score: { $max: "$score" } } },
  { $sort: { max_score: -1 } },
  { $limit: 10 },
  { $replaceRoot: { newRoot: "$doc" } }
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