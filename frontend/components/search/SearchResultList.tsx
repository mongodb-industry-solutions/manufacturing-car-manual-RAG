/**
 * Search result list component
 */
import React from 'react';
import { SearchResult } from '../../types/Search';
import SearchResultCard from './SearchResultCard';
import { MyH2 as H2, MyBody as Body } from '@/components/ui/TypographyWrapper';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import { MyCard as Card } from '@/components/ui/TypographyWrapper';
import Icon from '@leafygreen-ui/icon';

interface SearchResultListProps {
  results: SearchResult[];
  highlight?: string;
  showCount?: boolean;
}

const SearchResultList: React.FC<SearchResultListProps> = ({ 
  results,
  highlight,
  showCount = true
}) => {
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
      {showCount && (
        <Body style={{ marginBottom: spacing[3] }}>
          Showing {results.length} result{results.length !== 1 ? 's' : ''}
        </Body>
      )}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
        {results.map((result) => (
          <SearchResultCard 
            key={result.chunk.id} 
            result={result} 
            highlight={highlight} 
          />
        ))}
      </div>
    </div>
  );
};

export default SearchResultList;