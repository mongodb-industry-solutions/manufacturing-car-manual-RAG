/**
 * Query Visualization Panel component
 * Displays MongoDB queries used for different search methods
 */
import React from 'react';
import ExpandableCard from '@leafygreen-ui/expandable-card';
import { MyBody as Body } from '@/components/ui/TypographyWrapper';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import Code from '@leafygreen-ui/code';
import Icon from '@leafygreen-ui/icon';
import Badge from '@leafygreen-ui/badge';
import Tooltip from '@leafygreen-ui/tooltip';
interface QueryVisualizationPanelProps {
  searchMethod: string;
  query: string;
}

const QueryVisualizationPanel: React.FC<QueryVisualizationPanelProps> = ({ 
  searchMethod, 
  query 
}) => {
  // Generate query example based on search method
  const getQueryExample = (method: string, searchQuery: string): string => {
    // Normalize the method name - API might return "hybrid_rrf" but we want to match it to "hybrid"
    const normalizedMethod = method.includes('hybrid') ? 'hybrid' : method;
    
    console.log("Rendering query example for method:", method, "normalized to:", normalizedMethod);
    
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
      default:
        return 'No query example available for this search method.';
    }
  };

  const getMethodIcon = (method: string) => {
    // Normalize the method name
    const normalizedMethod = method.includes('hybrid') ? 'hybrid' : method;
    
    switch (normalizedMethod) {
      case 'vector':
        return <Icon glyph="Diagram" size="small" fill={palette.green.base} />;
      case 'text':
        return <Icon glyph="String" size="small" fill={palette.blue.base} />;
      case 'hybrid':
        return <Icon glyph="Settings" size="small" fill={palette.purple.base} />;
      default:
        return <Icon glyph="MagnifyingGlass" size="small" />;
    }
  };

  const getMethodColor = (method: string) => {
    // Normalize the method name
    const normalizedMethod = method.includes('hybrid') ? 'hybrid' : method;
    
    switch (normalizedMethod) {
      case 'vector':
        return palette.green.base;
      case 'text':
        return palette.blue.base;
      case 'hybrid':
        return palette.purple.base;
      default:
        return palette.gray.base;
    }
  };

  const getMethodName = (method: string) => {
    // Normalize the method name
    const normalizedMethod = method.includes('hybrid') ? 'hybrid' : method;
    
    switch (normalizedMethod) {
      case 'vector':
        return 'Vector Search';
      case 'text':
        return 'Text Search';
      case 'hybrid':
        return 'Hybrid Search';
      default:
        return 'Search';
    }
  };

  const getMethodDescription = (method: string) => {
    // Normalize the method name
    const normalizedMethod = method.includes('hybrid') ? 'hybrid' : method;
    
    switch (normalizedMethod) {
      case 'vector':
        return 'Uses MongoDB Atlas Vector Search to find semantically similar content using vector embeddings';
      case 'text':
        return 'Enhanced MongoDB Atlas Search with compound operators, prioritizing breadcrumb trail navigation context';
      case 'hybrid':
        return 'Combines Vector and Text search using MongoDB\'s native $rankFusion aggregation stage';
      default:
        return '';
    }
  };

  // MongoDB feature badges
  const getMethodBadges = (method: string) => {
    const badges = [];
    
    // Normalize the method name
    const normalizedMethod = method.includes('hybrid') ? 'hybrid' : method;
    
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
    
    return badges;
  };

  return (
    <div style={{ marginBottom: spacing[3] }}>
      <ExpandableCard
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
            {getMethodIcon(searchMethod)}
            <span>MongoDB {getMethodName(searchMethod)} Query</span>
          </div>
        }
        description={getMethodDescription(searchMethod)}
        defaultOpen={false}
        style={{ 
          border: `1px solid ${getMethodColor(searchMethod)}`,
          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)'
        }}
      >
        <div style={{ marginBottom: spacing[3] }}>
          <div style={{ display: 'flex', gap: spacing[2], marginBottom: spacing[3], flexWrap: 'wrap' }}>
            {getMethodBadges(searchMethod)}
          </div>
          
          <div style={{ backgroundColor: palette.gray.light3, padding: spacing[2], borderRadius: '4px' }}>
            <Code language="javascript">
              {getQueryExample(searchMethod, query)}
            </Code>
          </div>
          
          <div style={{ 
            marginTop: spacing[3],
            padding: spacing[2],
            backgroundColor: 'white',
            borderLeft: `4px solid ${getMethodColor(searchMethod)}`,
            borderRadius: '4px'
          }}>
            <Body size="small">
              <strong>How it works:</strong> {
                searchMethod === 'vector' 
                  ? 'Vector search embeds your query text into a high-dimensional vector and finds documents with similar vectors, capturing semantic meaning beyond keywords.'
                  : searchMethod === 'text'
                    ? 'Enhanced text search uses compound operators with boost values: phrase operators (highest priority) find exact phrases, text operators find individual words, and fuzzy matching catches typos. Breadcrumb trail matches are prioritized over main text content to emphasize navigation context.'
                    : 'Hybrid search combines both approaches using MongoDB\'s native $rankFusion stage, which automatically performs Reciprocal Rank Fusion (RRF) to merge and rank results from both search methods.'
              }
            </Body>
          </div>
        </div>
      </ExpandableCard>
    </div>
  );
};

export default QueryVisualizationPanel;