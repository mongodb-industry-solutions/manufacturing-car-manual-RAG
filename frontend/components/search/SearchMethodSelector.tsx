/**
 * Search method selector component
 */
import React from 'react';
import { RadioGroup, Radio } from '@leafygreen-ui/radio-group';
import { Body } from '@leafygreen-ui/typography';
import { spacing } from '@leafygreen-ui/tokens';
import { SearchMethod } from '../../types/Search';
import Icon from '@leafygreen-ui/icon';
import { palette } from '@leafygreen-ui/palette';
import Card from '@leafygreen-ui/card';

interface SearchMethodSelectorProps {
  selectedMethod: SearchMethod;
  onChange: (method: SearchMethod) => void;
}

const SearchMethodSelector: React.FC<SearchMethodSelectorProps> = ({
  selectedMethod,
  onChange
}) => {
  return (
    <div>
      <Card style={{ padding: spacing[3], marginBottom: spacing[3] }}>
        <Body weight="medium" style={{ marginBottom: spacing[2] }}>Search Method</Body>
        
        <RadioGroup
          name="search-method"
          onChange={(e) => onChange(e.target.value as SearchMethod)}
          value={selectedMethod}
        >
          <Radio value="vector" id="vector-search">
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
              <Icon 
                glyph="Diagram" 
                size="small" 
                fill={palette.green.base} 
              />
              <div>
                <Body>Vector Search</Body>
                <Body size="small" style={{ fontWeight: 'normal', color: palette.gray.dark1 }}>
                  Find results based on context using vector embeddings
                </Body>
              </div>
            </div>
          </Radio>
          
          <Radio value="text" id="text-search">
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
              <Icon 
                glyph="MagnifyingGlass" 
                size="small" 
                fill={palette.blue.base} 
              />
              <div>
                <Body>Keyword Search</Body>
                <Body size="small" style={{ fontWeight: 'normal', color: palette.gray.dark1 }}>
                  Traditional lexical search by exact words and phrases
                </Body>
              </div>
            </div>
          </Radio>
          
          <Radio value="hybrid" id="hybrid-search">
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
              <Icon 
                glyph="Diagram" 
                size="small" 
                fill={palette.purple.base} 
              />
              <div>
                <Body>Hybrid Search (RRF)</Body>
                <Body size="small" style={{ fontWeight: 'normal', color: palette.gray.dark1 }}>
                  Combine vector and keyword search using Reciprocal Rank Fusion
                </Body>
              </div>
            </div>
          </Radio>
        </RadioGroup>
      </Card>

    </div>
  );
};

export default SearchMethodSelector;