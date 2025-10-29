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
import Tooltip from '@leafygreen-ui/tooltip';
import Banner from '@leafygreen-ui/banner';
import { CARD_STYLES } from '@/lib/styleConstants';

interface SearchMethodSelectorProps {
  selectedMethod: SearchMethod;
  onChange: (method: SearchMethod) => void;
}

// $rankFusion explanation tooltip content
const RANKFUSION_EXPLANATION = `
MongoDB's $rankFusion stage performs Reciprocal Rank Fusion (RRF) automatically.
It intelligently combines rankings from multiple search methods (vector and text) 
using optimized algorithms built into the database engine.
This provides better performance and consistency than manual RRF implementations.
`;

// Hybrid Graph explanation tooltip content
const HYBRID_GRAPH_EXPLANATION = `
Hybrid Graph Search combines semantic vector search with relationship traversal.
It starts with $vectorSearch to find semantically similar documents, then uses
MongoDB's $graphLookup to expand through document relationships. This provides
both semantic relevance and contextual connectivity. Graph traversal is fixed
at depth 2 for optimal performance.
`;

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
          <Radio value="text" id="text-search">
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
              <Icon 
                glyph="MagnifyingGlass" 
                size="small" 
                fill={palette.blue.base} 
              />
              <div>
                <Body>Full-text Search</Body>
                <Body size="small" style={{ fontWeight: 'normal', color: palette.gray.dark1 }}>
                  Lexical search with fuzzy matching, stemming, and typo tolerance
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
                <Body>Hybrid Search ($rankFusion)</Body>
                <Body size="small" style={{ fontWeight: 'normal', color: palette.gray.dark1 }}>
                  Combine vector and full-text search using MongoDB's native $rankFusion
                </Body>
              </div>
            </div>
          </Radio>
          
          <Radio value="graph" id="graph-search">
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
              <Icon 
                glyph="Relationship" 
                size="small" 
                fill={palette.red.base} 
              />
              <div>
                <Body>Hybrid Graph Search ($vectorSearch + $graphLookup)</Body>
                <Body size="small" style={{ fontWeight: 'normal', color: palette.gray.dark1 }}>
                  Semantic vector search expanded via document relationships using MongoDB&apos;s $graphLookup
                </Body>
              </div>
            </div>
          </Radio>
          
          <Radio value="multimodal" id="multimodal-search">
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
              <Icon 
                glyph="Camera" 
                size="small" 
                fill={palette.yellow.dark2} 
              />
              <div>
                <Body>Multimodal Search</Body>
                <Body size="small" style={{ fontWeight: 'normal', color: palette.gray.dark1 }}>
                  Find images using text or image queries with Voyage AI multimodal embeddings
                </Body>
              </div>
            </div>
          </Radio>
        </RadioGroup>
        
        {/* $rankFusion information banner - only show when hybrid is selected */}
        {selectedMethod === 'hybrid' && (
          <div style={{ marginTop: spacing[3] }}>
            <Banner variant="info">
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                <div className="flex items-center gap-1">
                  <span>Using MongoDB's native $rankFusion for optimal hybrid search performance.&nbsp;</span>
                  <Tooltip
                    trigger={<span style={{ textDecoration: 'underline', cursor: 'help' }}>Learn more</span>}
                    triggerEvent="hover"
                  >
                    {RANKFUSION_EXPLANATION}
                  </Tooltip>
                </div>
              </div>
            </Banner>
          </div>
        )}

        {/* Hybrid Graph configuration banner - only show when graph is selected */}
        {selectedMethod === 'graph' && (
          <div style={{ marginTop: spacing[3] }}>
            <Banner variant="info">
              <div className="flex items-center gap-1">
                <span>Using MongoDB&apos;s $vectorSearch + $graphLookup for hybrid graph search.&nbsp;</span>
                <Tooltip
                  trigger={<span style={{ textDecoration: 'underline', cursor: 'help' }}>Learn more</span>}
                  triggerEvent="hover"
                >
                  {HYBRID_GRAPH_EXPLANATION}
                </Tooltip>
              </div>
            </Banner>
          </div>
        )}

        {/* Multimodal Search information banner - only show when multimodal is selected */}
        {selectedMethod === 'multimodal' && (
          <div style={{ marginTop: spacing[3] }}>
            <Banner variant="info">
              <div className="flex items-center gap-1">
                <span>Using Voyage AI multimodal embeddings to search images by text or image similarity.&nbsp;</span>
              </div>
            </Banner>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SearchMethodSelector;