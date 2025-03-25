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
  onChange,
}) => {
  return (
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
              <Body>Semantic Search</Body>
              <Body size="small" style={{ fontWeight: 'normal', color: palette.gray.dark1 }}>
                Find results based on meaning, not just keywords
              </Body>
            </div>
          </div>
        </Radio>
        
        <Radio value="text" id="text-search">
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
            <Icon 
              glyph="Type" 
              size="small" 
              fill={palette.blue.base} 
            />
            <div>
              <Body>Keyword Search</Body>
              <Body size="small" style={{ fontWeight: 'normal', color: palette.gray.dark1 }}>
                Traditional search by exact words and phrases
              </Body>
            </div>
          </div>
        </Radio>
        
        <Radio value="hybrid" id="hybrid-search">
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
            <Icon 
              glyph="Merge" 
              size="small" 
              fill={palette.purple.base} 
            />
            <div>
              <Body>Hybrid Search</Body>
              <Body size="small" style={{ fontWeight: 'normal', color: palette.gray.dark1 }}>
                Combine semantic and keyword search for better results
              </Body>
            </div>
          </div>
        </Radio>
      </RadioGroup>
    </Card>
  );
};

export default SearchMethodSelector;