/**
 * Search method selector component
 */
import React from 'react';
import { RadioGroup, Radio } from '@leafygreen-ui/radio-group';
import { Body, Subtitle } from '@leafygreen-ui/typography';
import { spacing } from '@leafygreen-ui/tokens';
import { SearchMethod } from '../../types/Search';
import Icon from '@leafygreen-ui/icon';
import { palette } from '@leafygreen-ui/palette';
import Card from '@leafygreen-ui/card';
import Tooltip from '@leafygreen-ui/tooltip';

interface SearchMethodSelectorProps {
  selectedMethod: SearchMethod;
  onChange: (method: SearchMethod) => void;
  hybridMethod?: string;
  onHybridMethodChange?: (method: string) => void;
}

const HybridMethodExplanation = {
  'weighted': 'Assigns different weights to vector and text scores for a balanced approach',
  'rrf': 'Reciprocal Rank Fusion - Combines rankings from both search types giving priority to highest ranked results',
  'union': 'Returns results that appear in either search method, maximizing recall',
  'intersection': 'Returns only results that appear in both search methods, maximizing precision'
};

const SearchMethodSelector: React.FC<SearchMethodSelectorProps> = ({
  selectedMethod,
  onChange,
  hybridMethod = 'weighted',
  onHybridMethodChange
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
                <Body>Hybrid Search</Body>
                <Body size="small" style={{ fontWeight: 'normal', color: palette.gray.dark1 }}>
                  Combine vector and keyword search with various methods
                </Body>
              </div>
            </div>
          </Radio>
        </RadioGroup>
      </Card>

      {/* Hybrid Method Selector */}
      {selectedMethod === 'hybrid' && onHybridMethodChange && (
        <Card style={{ padding: spacing[3], marginBottom: spacing[3], border: `1px solid ${palette.purple.light2}` }}>
          <Subtitle style={{ marginBottom: spacing[2], color: palette.purple.dark2 }}>Hybrid Combination Method</Subtitle>
          <Body size="small" style={{ marginBottom: spacing[3], color: palette.gray.dark1 }}>
            Choose how to combine vector and lexical search results
          </Body>

          <RadioGroup
            name="hybrid-method"
            onChange={(e) => onHybridMethodChange(e.target.value)}
            value={hybridMethod}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[2] }}>
              <Radio value="weighted" id="weighted-method">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Body>Weighted</Body>
                  <Tooltip
                    align="top"
                    justify="middle"
                    trigger={<Icon glyph="InfoWithCircle" />}
                    triggerEvent="hover"
                  >
                    {HybridMethodExplanation.weighted}
                  </Tooltip>
                </div>
              </Radio>
              
              <Radio value="rrf" id="rrf-method">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Body>RRF</Body>
                  <Tooltip
                    align="top"
                    justify="middle"
                    trigger={<Icon glyph="InfoWithCircle" />}
                    triggerEvent="hover"
                  >
                    {HybridMethodExplanation.rrf}
                  </Tooltip>
                </div>
              </Radio>
              
              <Radio value="union" id="union-method">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Body>Union</Body>
                  <Tooltip
                    align="top"
                    justify="middle"
                    trigger={<Icon glyph="InfoWithCircle" />}
                    triggerEvent="hover"
                  >
                    {HybridMethodExplanation.union}
                  </Tooltip>
                </div>
              </Radio>
              
              <Radio value="intersection" id="intersection-method">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Body>Intersection</Body>
                  <Tooltip
                    align="top"
                    justify="middle"
                    trigger={<Icon glyph="InfoWithCircle" />}
                    triggerEvent="hover"
                  >
                    {HybridMethodExplanation.intersection}
                  </Tooltip>
                </div>
              </Radio>
            </div>
          </RadioGroup>
        </Card>
      )}
    </div>
  );
};

export default SearchMethodSelector;