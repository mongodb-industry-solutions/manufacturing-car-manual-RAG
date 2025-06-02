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
        return `db.chunks.aggregate([
  {
    $search: {
      index: "manual_text_search_index",
      text: {
        query: "${searchQuery}",
        path: ["text", "context", "breadcrumb_trail"],
        fuzzy: { maxEdits: 1, prefixLength: 3 }
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
      context: 1,
      breadcrumb_trail: 1,
      page_numbers: 1,
      content_type: 1,
      metadata: 1
    }
  }
])`;
      case 'hybrid':
        return `// Hybrid search with RRF (Reciprocal Rank Fusion)
db.chunks.aggregate([
  // STEP 1: VECTOR SEARCH BRANCH
  {
    $vectorSearch: {
      index: "manual_vector_index",
      path: "embedding",
      queryVector: [0.123, 0.456, 0.789, ...], // Embedding for "${searchQuery}"
      numCandidates: 150,
      limit: 20
    }
  },
  // Group results to calculate rank within this branch
  { $group: { _id: null, docs: { $push: "$$ROOT" } } },
  // Unwind to add rank
  { $unwind: { path: "$docs", includeArrayIndex: "rank" } },
  // Calculate RRF score component for vector search
  {
    $addFields: {
      vs_score: {
        $multiply: [
          0.5, // Vector weight
          { $divide: [1.0, { $add: ["$rank", 60] } ] } // RRF formula: 1/(k + rank)
        ]
      }
    }
  },
  // Project only necessary fields from this branch
  {
    $project: {
      _id: "$docs._id",
      vs_score: 1,
      chunk_id: "$docs.id",
      text: "$docs.text",
      context: "$docs.context",
      breadcrumb_trail: "$docs.breadcrumb_trail",
      page_numbers: "$docs.page_numbers",
      content_type: "$docs.content_type",
      metadata: "$docs.metadata",
      vehicle_systems: "$docs.vehicle_systems"
    }
  },
  
  // STEP 2: TEXT SEARCH BRANCH
  {
    $unionWith: {
      coll: "chunks",
      pipeline: [
        {
          $search: {
            index: "manual_text_search_index",
            text: {
              query: "${searchQuery}",
              path: ["text", "context", "breadcrumb_trail"],
              fuzzy: { maxEdits: 1, prefixLength: 3 }
            }
          }
        },
        { $limit: 20 },
        // Group results to calculate rank within this branch
        { $group: { _id: null, docs: { $push: "$$ROOT" } } },
        // Unwind to add rank
        { $unwind: { path: "$docs", includeArrayIndex: "rank" } },
        // Calculate RRF score component for text search
        {
          $addFields: {
            fts_score: {
              $multiply: [
                0.5, // Text weight
                { $divide: [1.0, { $add: ["$rank", 60] } ] } // RRF formula
              ]
            }
          }
        },
        // Project only necessary fields from this branch
        {
          $project: {
            _id: "$docs._id",
            fts_score: 1,
            chunk_id: "$docs.id",
            text: "$docs.text",
            context: "$docs.context",
            breadcrumb_trail: "$docs.breadcrumb_trail",
            page_numbers: "$docs.page_numbers",
            content_type: "$docs.content_type",
            metadata: "$docs.metadata",
            vehicle_systems: "$docs.vehicle_systems"
          }
        }
      ]
    }
  },
  
  // STEP 3: COMBINE RESULTS
  // Group by original document ID to combine scores
  {
    $group: {
      _id: "$_id",
      chunk_id: { $first: "$chunk_id" },
      text: { $first: "$text" },
      context: { $first: "$context" },
      breadcrumb_trail: { $first: "$breadcrumb_trail" },
      page_numbers: { $first: "$page_numbers" },
      content_type: { $first: "$content_type" },
      metadata: { $first: "$metadata" },
      vehicle_systems: { $first: "$vehicle_systems" },
      vs_score: { $max: "$vs_score" },
      fts_score: { $max: "$fts_score" }
    }
  },
  
  // STEP 4: HANDLE MISSING SCORES (docs only in one result set)
  {
    $project: {
      chunk_id: 1,
      text: 1,
      context: 1,
      breadcrumb_trail: 1,
      page_numbers: 1,
      content_type: 1,
      metadata: 1,
      vehicle_systems: 1,
      vs_score: { $ifNull: ["$vs_score", 0.0] },
      fts_score: { $ifNull: ["$fts_score", 0.0] }
    }
  },
  
  // STEP 5: CALCULATE FINAL SCORE
  {
    $addFields: {
      raw_score: { $add: ["$fts_score", "$vs_score"] },
      // Scale to 0-100 range (typical RRF scores are very small)
      score: { $multiply: [{ $add: ["$fts_score", "$vs_score"] }, 3000] }
    }
  },
  
  // STEP 6: SORT AND LIMIT RESULTS
  { $sort: { score: -1 } },
  { $limit: 10 },
  
  // STEP 7: CAP MAX SCORE AT 100
  {
    $addFields: {
      score: { $min: [100, "$score"] }
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
        return 'Uses MongoDB Atlas Search for keyword-based search with fuzzy matching';
      case 'hybrid':
        return 'Combines Vector and Text search using RRF in MongoDB\'s aggregation pipeline';
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
          MongoDB Atlas Search provides full-text search with fuzzy matching
        </Tooltip>
      );
    }
    
    if (normalizedMethod === 'hybrid') {
      badges.push(
        <Tooltip
          key="agg-badge"
          trigger={
            <Badge variant="blue">Aggregation Pipeline</Badge>
          }
          triggerEvent="hover"
        >
          MongoDB's aggregation pipeline powers the hybrid search implementation
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
                    ? 'Text search looks for keywords and phrases in the document, with fuzzy matching to handle typos and variations.'
                    : 'Hybrid search combines both approaches using Reciprocal Rank Fusion (RRF), which merges result rankings from both methods.'
              }
            </Body>
          </div>
        </div>
      </ExpandableCard>
    </div>
  );
};

export default QueryVisualizationPanel;