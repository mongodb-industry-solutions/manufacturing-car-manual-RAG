/**
 * Search method selector component
 */
import React from 'react';
import { RadioGroup, Radio } from '@leafygreen-ui/radio-group';
import { MyBody as Body } from '@/components/ui/TypographyWrapper';
import { spacing } from '@leafygreen-ui/tokens';
import { SearchMethod } from '../../types/Search';
import Icon from '@leafygreen-ui/icon';
import { palette } from '@leafygreen-ui/palette';
import { MyCard as Card } from '@/components/ui/TypographyWrapper';
// For simplicity, using a custom slider instead of radix (which isn't installed)
// This avoids needing to install new dependencies
import Tooltip from '@leafygreen-ui/tooltip';
import Banner from '@leafygreen-ui/banner';

interface SearchMethodSelectorProps {
  selectedMethod: SearchMethod;
  onChange: (method: SearchMethod) => void;
  rrf_k?: number;
  onRrfKChange?: (value: number) => void;
}

// A simple custom slider based on HTML input range
const CustomSlider = ({ 
  min, 
  max, 
  step, 
  value, 
  onChange
}: { 
  min: number; 
  max: number; 
  step: number; 
  value: number; 
  onChange: (value: number) => void 
}) => {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        width: '100%',
        height: '8px',
        borderRadius: '4px',
        appearance: 'none',
        backgroundColor: '#eee',
        outline: 'none',
        // Custom styling for webkit browsers
        WebkitAppearance: 'none'
      }}
    />
  );
}

// RRF explanation tooltip content
const RRF_EXPLANATION = `
RRF (Reciprocal Rank Fusion) is designed to combine multiple search methods.
Scores are calculated as 1/(k + rank), which results in naturally low values.
For example, with k=60, the top result has a maximum score of 1/60 (1.67%).
These low percentages are mathematically expected and not an issue.
`;

// Advanced RRF explanation
const RRF_ADVANCED_EXPLANATION = `
Lower k-values emphasize top-ranked results and produce higher scores.
Higher k-values provide more weight to lower-ranked items and produce lower scores.
Industry standard values range from 10-60.
`;

const SearchMethodSelector: React.FC<SearchMethodSelectorProps> = ({
  selectedMethod,
  onChange,
  rrf_k = 60,
  onRrfKChange
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
        
        {/* RRF information banner - only show when hybrid is selected */}
        {selectedMethod === 'hybrid' && (
          <div style={{ marginTop: spacing[3] }}>
            <Banner variant="info">
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                <div className="flex items-center gap-1">
                  <span>RRF scores are naturally low due to the algorithm&apos;s mathematical formula:&nbsp;</span>
                  <Tooltip
                    trigger={<span style={{ textDecoration: 'underline', cursor: 'help' }}>Learn more</span>}
                    triggerEvent="hover"
                  >
                    {RRF_EXPLANATION}
                  </Tooltip>
                </div>
                
                {/* K-value slider */}
                {onRrfKChange && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 'bold' }}>RRF k-value: {rrf_k}</div>
                      <Tooltip
                        trigger={<Icon glyph="InfoWithCircle" />}
                        triggerEvent="hover"
                      >
                        {RRF_ADVANCED_EXPLANATION}
                      </Tooltip>
                    </div>
                    <div style={{ marginTop: spacing[2], marginBottom: spacing[2] }}>
                      <CustomSlider
                        value={rrf_k}
                        max={100}
                        min={5}
                        step={5}
                        onChange={(value) => onRrfKChange && onRrfKChange(value)}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '12px', color: palette.gray.dark1 }}>Higher scores</div>
                      <div style={{ fontSize: '12px', color: palette.gray.dark1 }}>Lower scores</div>
                    </div>
                  </div>
                )}
              </div>
            </Banner>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SearchMethodSelector;