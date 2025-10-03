/**
 * Search method selector component
 */
import React from 'react';
import { RadioGroup, Radio } from '@leafygreen-ui/radio-group';
import { MyBody as Body } from '@/components/ui/TypographyWrapper';
import { spacing } from '@leafygreen-ui/tokens';
import { SearchMethod, GraphExpansionMethod } from '../../types/Search';
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
  // GraphRAG-specific props
  selectedExpansionMethod?: GraphExpansionMethod;
  onExpansionMethodChange?: (method: GraphExpansionMethod) => void;
  maxDepth?: number;
  onMaxDepthChange?: (depth: number) => void;
}

// $rankFusion explanation tooltip content
const RANKFUSION_EXPLANATION = `
MongoDB's $rankFusion stage performs Reciprocal Rank Fusion (RRF) automatically.
It intelligently combines rankings from multiple search methods (vector and text) 
using optimized algorithms built into the database engine.
This provides better performance and consistency than manual RRF implementations.
`;

// GraphRAG explanation tooltip content
const GRAPHRAG_EXPLANATION = `
GraphRAG uses relationship data between document chunks to expand search results.
Vector→Graph: Start with vector search, then expand via relationships.
Graph→Vector: Start with text matching, expand via graph, then vector search.
MongoDB's $graphLookup traverses relationships up to 4 levels deep.
`;

const SearchMethodSelector: React.FC<SearchMethodSelectorProps> = ({
  selectedMethod,
  onChange,
  selectedExpansionMethod = 'vector_to_graph',
  onExpansionMethodChange,
  maxDepth = 2,
  onMaxDepthChange
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
                <Body>GraphRAG Search ($graphLookup)</Body>
                <Body size="small" style={{ fontWeight: 'normal', color: palette.gray.dark1 }}>
                  Relationship-aware search using document connections and knowledge graphs
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

        {/* GraphRAG configuration banner - only show when graph is selected */}
        {selectedMethod === 'graph' && (
          <div style={{ marginTop: spacing[3] }}>
            <Banner variant="info">
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
                <div className="flex items-center gap-1">
                  <span>Using MongoDB's $graphLookup for relationship-aware search.&nbsp;</span>
                  <Tooltip
                    trigger={<span style={{ textDecoration: 'underline', cursor: 'help' }}>Learn more</span>}
                    triggerEvent="hover"
                  >
                    {GRAPHRAG_EXPLANATION}
                  </Tooltip>
                </div>
                
                {/* Expansion Method Selection */}
                <div>
                  <Body size="small" weight="medium" style={{ marginBottom: spacing[1] }}>
                    Expansion Method
                  </Body>
                  <RadioGroup
                    name="expansion-method"
                    onChange={(e) => onExpansionMethodChange?.(e.target.value as GraphExpansionMethod)}
                    value={selectedExpansionMethod}
                    size="small"
                  >
                    <Radio value="vector_to_graph" id="vector-to-graph">
                      <Body size="small">Vector → Graph</Body>
                      <Body size="xsmall" style={{ color: palette.gray.dark1, marginTop: spacing[1] }}>
                        Start with semantic search, then expand via relationships
                      </Body>
                    </Radio>
                    <Radio value="graph_to_vector" id="graph-to-vector">
                      <Body size="small">Graph → Vector</Body>
                      <Body size="xsmall" style={{ color: palette.gray.dark1, marginTop: spacing[1] }}>
                        Start with text matching, expand via graph, then semantic search
                      </Body>
                    </Radio>
                  </RadioGroup>
                </div>

                {/* Max Depth Selection */}
                <div>
                  <Body size="small" weight="medium" style={{ marginBottom: spacing[1] }}>
                    Traversal Depth: {maxDepth}
                  </Body>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    value={maxDepth}
                    onChange={(e) => onMaxDepthChange?.(parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: spacing[1] }}>
                    <Body size="xsmall" style={{ color: palette.gray.dark1 }}>1 (Direct)</Body>
                    <Body size="xsmall" style={{ color: palette.gray.dark1 }}>2 (Default)</Body>
                    <Body size="xsmall" style={{ color: palette.gray.dark1 }}>3 (Extended)</Body>
                    <Body size="xsmall" style={{ color: palette.gray.dark1 }}>4 (Deep)</Body>
                  </div>
                </div>
              </div>
            </Banner>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SearchMethodSelector;