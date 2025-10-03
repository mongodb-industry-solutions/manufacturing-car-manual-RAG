/**
 * Search result list component
 */
import React, { useState } from 'react';
import { SearchResult } from '../../types/Search';
import SearchResultCard from './SearchResultCard';
import { MyH2 as H2, MyBody as Body, MyButton as Button } from '@/components/ui/TypographyWrapper';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import { MyCard as Card } from '@/components/ui/TypographyWrapper';
import Icon from '@leafygreen-ui/icon';
import KnowledgeGraphVisualization from '../graph/KnowledgeGraphVisualization';

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
        
        {/* Knowledge Graph button - show for any search with results */}
        {results.length > 0 && (
          <Button 
            size="small"
            variant="primaryOutline"
            onClick={() => setShowKnowledgeGraph(true)}
            leftGlyph={<Icon glyph="Relationship" size="small" />}
          >
            View Knowledge Graph
          </Button>
        )}
      </div>
      
      {/* Results list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
        {results.map((result) => (
          <SearchResultCard 
            key={result.chunk_id || (result.chunk && result.chunk.id) || `result-${Math.random()}`}
            result={result} 
            highlight={highlight} 
          />
        ))}
      </div>
      
      {/* Knowledge Graph Modal */}
      <KnowledgeGraphVisualization
        isOpen={showKnowledgeGraph}
        onClose={() => setShowKnowledgeGraph(false)}
        query={query}
        chunkIds={chunkIds}
        maxNodes={50}
        maxDepth={2}
      />
    </div>
  );
};

export default SearchResultList;