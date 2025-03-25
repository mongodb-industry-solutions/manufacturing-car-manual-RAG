/**
 * Search input component
 */
import React, { useState } from 'react';
import TextInput from '@leafygreen-ui/text-input';
import Button from '@leafygreen-ui/button';
import Icon from '@leafygreen-ui/icon';
import { spacing } from '@leafygreen-ui/tokens';
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
        marginBottom: spacing[3]
      }}
    >
      <div style={{ flexGrow: 1 }}>
        <TextInput
          label="Search the car manual"
          description="Enter keywords or ask a question"
          placeholder={placeholder}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          value={query}
          disabled={loading}
          aria-label="Search query"
        />
      </div>
      
      <Button 
        variant="primary"
        type="submit"
        disabled={loading || !query.trim()}
        leftGlyph={loading ? <Spinner /> : <Icon glyph="MagnifyingGlass" />}
        style={{ alignSelf: 'flex-end', width: '120px' }}
      >
        {loading ? 'Searching...' : 'Search'}
      </Button>
    </form>
  );
};

export default SearchInput;