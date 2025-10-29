/**
 * Search result list component
 */
import React, { useState } from 'react';
import { SearchResult } from '../../types/Search';
import SearchResultCard from './SearchResultCard';
import { H2, Body } from '@leafygreen-ui/typography';
import Button from '@leafygreen-ui/button';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import Card from '@leafygreen-ui/card';
import Icon from '@leafygreen-ui/icon';
import ExpandableCard from '@leafygreen-ui/expandable-card';
import KnowledgeGraphVisualization from '../graph/KnowledgeGraphVisualization';
import Banner from '@leafygreen-ui/banner';
import { CARD_STYLES } from '@/lib/styleConstants';

interface SearchResultListProps {
  results: SearchResult[];
  highlight?: string;
  showCount?: boolean;
  query?: string;
  searchMethod?: string;
}

const SearchResultList: React.FC<SearchResultListProps> = ({ 
  results,
  highlight,
  showCount = true,
  query,
  searchMethod
}) => {
  const [showKnowledgeGraph, setShowKnowledgeGraph] = useState(false);
  
  // Extract chunk IDs from results for knowledge graph
  const chunkIds = results.map(result => 
    result.chunk_id || (result.chunk && result.chunk.id)
  ).filter(Boolean) as string[];
  
  // Check if this is a GraphRAG search based on the search method used
  // This is more reliable than checking result fields which could be stale from cache
  const isGraphRAG = searchMethod?.includes('graph') || searchMethod?.startsWith('graph_');
  
  // Group results by source for Hybrid Graph searches
  // Seeds: MUST have source='vector_seed' AND depth=0
  const seedResults = isGraphRAG 
    ? results.filter(r => r.source === 'vector_seed' && r.depth === 0)
    : [];
  // Expanded: MUST have source indicating expansion AND depth > 0
  const expandedResults = isGraphRAG
    ? results.filter(r => (r.source === 'graph_expansion' || r.source?.includes('expansion')) && (r.depth || 0) > 0)
    : [];
  
  // Validation: Check for data integrity issues in Hybrid Graph searches
  const seedCount = seedResults.length;
  const expandedCount = expandedResults.length;
  const hasIntegrityIssue = isGraphRAG && (seedCount !== 5 || seedCount + expandedCount !== results.length);
  
  // Check for overlapping IDs (seeds appearing in expanded results)
  const seedIds = new Set(seedResults.map(r => r.chunk_id || r.chunk?.id));
  const expandedIds = new Set(expandedResults.map(r => r.chunk_id || r.chunk?.id));
  const overlap = [...seedIds].filter(id => expandedIds.has(id));
  const hasOverlap = overlap.length > 0;
  
  // Final top results
  // For Hybrid Graph Search: show ALL results (seeds + expanded) - no limit
  // For other methods: limit to 10 (though not used since they render results directly)
  const finalResults = isGraphRAG ? results : results.slice(0, 10);
  if (results.length === 0) {
    return (
      <Card style={{ textAlign: 'center', padding: spacing[4] }}>
        <Icon 
          glyph="Warning" 
          size="large" 
          fill={palette.yellow.base} 
          style={{ marginBottom: spacing[2] }}
        />
        <H2>No Results Found</H2>
        <Body>
          Try a different search term or adjust your search method.
        </Body>
      </Card>
    );
  }

  return (
    <div>
      {/* Results header with knowledge graph button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: spacing[3] 
      }}>
        {showCount && (
          <Body>
            Showing {results.length} result{results.length !== 1 ? 's' : ''}
          </Body>
        )}
        
        {/* Knowledge Graph button - only show for GraphRAG searches */}
        {results.length > 0 && searchMethod?.includes('graph') && (
          <Button 
            size="large"
            variant="primary"
            onClick={() => setShowKnowledgeGraph(true)}
            leftGlyph={<Icon glyph="Relationship" />}
            style={{ 
              fontWeight: 600,
              boxShadow: '0 4px 8px rgba(0, 237, 100, 0.3)'
            }}
          >
            Visualize Knowledge Graph
          </Button>
        )}
      </div>
      
      {/* Validation Warning - Hybrid Graph Search Data Integrity */}
      {isGraphRAG && (hasIntegrityIssue || hasOverlap) && (
        <Banner 
          variant="warning" 
          style={{ marginBottom: spacing[3] }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1] }}>
            <Body weight="medium">⚠️ Data Integrity Issue Detected</Body>
            {seedCount !== 5 && (
              <Body size="small">
                Expected 5 seed results but found {seedCount}. This may indicate an issue with the vector search or pipeline.
              </Body>
            )}
            {seedCount + expandedCount !== results.length && (
              <Body size="small">
                Results classification mismatch: {seedCount} seeds + {expandedCount} expanded ≠ {results.length} total. 
                Some results may be missing source/depth metadata.
              </Body>
            )}
            {hasOverlap && (
              <Body size="small">
                Found {overlap.length} duplicate ID(s) between seeds and expanded results. 
                IDs: {overlap.slice(0, 3).join(', ')}{overlap.length > 3 ? '...' : ''}
              </Body>
            )}
          </div>
        </Banner>
      )}
      
      {/* Results list */}
      {isGraphRAG ? (
        // GraphRAG: Show three sections - Seeds (expandable), Expansions (expandable), and Top Results (always visible)
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
          {/* Seed Results - Expandable Card */}
          {seedResults.length > 0 && (
            <ExpandableCard
              title={
                <span style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                  <Icon glyph="Diagram" fill={palette.blue.dark2} />
                  Seed Results ({seedResults.length})
                </span>
              }
              defaultOpen={false}
              style={{
                backgroundColor: palette.blue.light3,
                border: `1px solid ${palette.blue.light2}`,
              }}
            >
              <div style={{ padding: spacing[2] }}>
                <Body size="small" style={{ color: palette.blue.dark2, marginBottom: spacing[2] }}>
                  Initial {searchMethod?.includes('vector_to_graph') ? 'vector similarity' : 'graph-based'} search results
                </Body>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                  {seedResults.map((result) => (
                    <SearchResultCard 
                      key={result.chunk_id || (result.chunk && result.chunk.id) || `result-${Math.random()}`}
                      result={result} 
                      highlight={highlight} 
                    />
                  ))}
                </div>
              </div>
            </ExpandableCard>
          )}
          
          {/* Graph-Expanded Results - Expandable Card */}
          {expandedResults.length > 0 && (
            <ExpandableCard
              title={
                <span style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                  <Icon glyph="Relationship" fill={palette.green.dark2} />
                  Graph-Expanded Results ({expandedResults.length})
                </span>
              }
              defaultOpen={false}
              style={{
                backgroundColor: palette.green.light3,
                border: `1px solid ${palette.green.light2}`,
              }}
            >
              <div style={{ padding: spacing[2] }}>
                <Body size="small" style={{ color: palette.green.dark2, marginBottom: spacing[2] }}>
                  Found by traversing relationships from seed results
                </Body>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                  {expandedResults.map((result) => (
                    <SearchResultCard 
                      key={result.chunk_id || (result.chunk && result.chunk.id) || `result-${Math.random()}`}
                      result={result} 
                      highlight={highlight} 
                    />
                  ))}
                </div>
              </div>
            </ExpandableCard>
          )}
          
          {/* All Results - Always Visible (Not Expandable) */}
          <div style={{ marginTop: spacing[3] }}>
            <H2 style={{ marginBottom: spacing[3] }}>
              All Results 
            </H2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
              {finalResults.map((result) => (
                <SearchResultCard 
                  key={result.chunk_id || (result.chunk && result.chunk.id) || `result-${Math.random()}`}
                  result={result} 
                  highlight={highlight} 
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Non-GraphRAG: Show all results together
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
          {results.map((result) => (
            <SearchResultCard 
              key={result.chunk_id || (result.chunk && result.chunk.id) || `result-${Math.random()}`}
              result={result} 
              highlight={highlight} 
            />
          ))}
        </div>
      )}
      
      {/* Knowledge Graph Modal */}
      <KnowledgeGraphVisualization
        isOpen={showKnowledgeGraph}
        onClose={() => setShowKnowledgeGraph(false)}
        query={query}
        chunkIds={chunkIds}
        maxNodes={50}
      />
    </div>
  );
};

export default SearchResultList;