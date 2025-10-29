/**
 * Search input component
 */
import React, { useState, useEffect } from 'react';
import Button from '@leafygreen-ui/button';
import Icon from '@leafygreen-ui/icon';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import { Spinner } from '@leafygreen-ui/loading-indicator';

interface SearchInputProps {
  onSearch: (query: string) => void;
  initialValue?: string;
  loading?: boolean;
  placeholder?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({ 
  onSearch, 
  initialValue = '', 
  loading = false,
  placeholder = 'How do I change a flat tire?'
}) => {
  const [query, setQuery] = useState(initialValue);
  
  // Update internal state when initialValue prop changes
  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (query.trim()) {
        onSearch(query);
      }
    }
  };
  
  return (
    <form 
      onSubmit={handleSubmit}
      style={{ 
        display: 'flex', 
        gap: spacing[2],
        marginBottom: spacing[3],
        alignItems: 'flex-end'
      }}
    >
      <div style={{ flex: 1 }}>
        <label style={{ display: 'block' }}>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: 600, 
            color: palette.gray.dark3,
            marginBottom: spacing[1]
          }}>
            Search the car manual
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: palette.gray.dark1,
            marginBottom: spacing[2]
          }}>
            Enter keywords or ask a question
          </div>
          <input
            type="text"
            placeholder={placeholder}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            value={query}
            disabled={loading}
            aria-label="Search query"
            style={{
              width: '100%',
              padding: `${spacing[2]}px ${spacing[3]}px`,
              fontSize: '16px',
              border: `1px solid ${palette.gray.light1}`,
              borderRadius: '6px',
              outline: 'none',
              transition: 'border-color 0.2s ease',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = palette.green.base}
            onBlur={(e) => e.target.style.borderColor = palette.gray.light1}
          />
        </label>
      </div>
      
      <Button 
        variant="primary"
        type="submit"
        disabled={loading || !query.trim()}
        leftGlyph={loading ? <Spinner /> : <Icon glyph="MagnifyingGlass" />}
        style={{ width: '120px', flexShrink: 0 }}
      >
        {loading ? 'Searching...' : 'Search'}
      </Button>
    </form>
  );
};

export default SearchInput;