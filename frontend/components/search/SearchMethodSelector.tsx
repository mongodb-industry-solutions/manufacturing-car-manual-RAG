/**
 * Search method selector component
 */
import React, { useState } from 'react';
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
import InfoWizard from '@/components/common/InfoWizard';
import { textSearchInfo } from '@/content/textSearchInfo';
import { vectorSearchInfo } from '@/content/vectorSearchInfo';
import { hybridSearchInfo } from '@/content/hybridSearchInfo';
import { graphSearchInfo } from '@/content/graphSearchInfo';
import { multimodalSearchInfo } from '@/content/multimodalSearchInfo';

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
  const [textInfoOpen, setTextInfoOpen] = useState(false);
  const [vectorInfoOpen, setVectorInfoOpen] = useState(false);
  const [hybridInfoOpen, setHybridInfoOpen] = useState(false);
  const [graphInfoOpen, setGraphInfoOpen] = useState(false);
  const [multimodalInfoOpen, setMultimodalInfoOpen] = useState(false);

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
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing[2] }}>
              <div style={{ paddingTop: '2px' }}>
                <Icon
                  glyph="MagnifyingGlass"
                  fill={palette.green.dark2}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                  <Body>Full-text Search</Body>
                  <Icon
                    glyph="Wizard"
                    size={14}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTextInfoOpen(true);
                    }}
                    style={{
                      cursor: 'pointer',
                      opacity: 0.4,
                      color: palette.gray.dark1,
                      transition: 'opacity 0.2s',
                      flexShrink: 0,
                      minWidth: '14px'
                    }}
                    onMouseEnter={(e: any) => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={(e: any) => e.currentTarget.style.opacity = '0.4'}
                  />
                </div>
                <Body size="small" style={{ fontWeight: 'normal', color: palette.gray.dark1 }}>
                  Lexical search with fuzzy matching, stemming, and typo tolerance
                </Body>
              </div>
            </div>
          </Radio>
          
          <Radio value="vector" id="vector-search">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing[2] }}>
              <div style={{ paddingTop: '2px' }}>
                <Icon
                  glyph="Diagram"
                  fill={palette.blue.dark2}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                  <Body>Vector Search</Body>
                  <Icon
                    glyph="Wizard"
                    size={14}
                    onClick={(e) => {
                      e.stopPropagation();
                      setVectorInfoOpen(true);
                    }}
                    style={{
                      cursor: 'pointer',
                      opacity: 0.4,
                      color: palette.gray.dark1,
                      transition: 'opacity 0.2s',
                      flexShrink: 0,
                      minWidth: '14px'
                    }}
                    onMouseEnter={(e: any) => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={(e: any) => e.currentTarget.style.opacity = '0.4'}
                  />
                </div>
                <Body size="small" style={{ fontWeight: 'normal', color: palette.gray.dark1 }}>
                  Find results based on context using vector embeddings
                </Body>
              </div>
            </div>
          </Radio>
          
          <Radio value="hybrid" id="hybrid-search">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing[2] }}>
              <div style={{ paddingTop: '2px' }}>
                <Icon
                  glyph="Diagram"
                  fill={palette.purple.base}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                  <Body>Hybrid Search ($rankFusion)</Body>
                  <Icon
                    glyph="Wizard"
                    size={14}
                    onClick={(e) => {
                      e.stopPropagation();
                      setHybridInfoOpen(true);
                    }}
                    style={{
                      cursor: 'pointer',
                      opacity: 0.4,
                      color: palette.gray.dark1,
                      transition: 'opacity 0.2s',
                      flexShrink: 0,
                      minWidth: '14px'
                    }}
                    onMouseEnter={(e: any) => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={(e: any) => e.currentTarget.style.opacity = '0.4'}
                  />
                </div>
                <Body size="small" style={{ fontWeight: 'normal', color: palette.gray.dark1 }}>
                  Combine vector and full-text search using MongoDB's native $rankFusion
                </Body>
              </div>
            </div>
          </Radio>
          
          <Radio value="graph" id="graph-search">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing[2] }}>
              <div style={{ paddingTop: '2px' }}>
                <Icon
                  glyph="Relationship"
                  fill={palette.red.base}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                  <Body>Hybrid Graph Search ($vectorSearch + $graphLookup)</Body>
                  <Icon
                    glyph="Wizard"
                    size={14}
                    onClick={(e) => {
                      e.stopPropagation();
                      setGraphInfoOpen(true);
                    }}
                    style={{
                      cursor: 'pointer',
                      opacity: 0.4,
                      color: palette.gray.dark1,
                      transition: 'opacity 0.2s',
                      flexShrink: 0,
                      minWidth: '14px'
                    }}
                    onMouseEnter={(e: any) => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={(e: any) => e.currentTarget.style.opacity = '0.4'}
                  />
                </div>
                <Body size="small" style={{ fontWeight: 'normal', color: palette.gray.dark1 }}>
                  Semantic vector search expanded via document relationships using MongoDB&apos;s $graphLookup
                </Body>
              </div>
            </div>
          </Radio>
          
          <Radio value="multimodal" id="multimodal-search">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing[2] }}>
              <div style={{ paddingTop: '2px' }}>
                <Icon
                  glyph="Camera"
                  fill={palette.yellow.dark2}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                  <Body>Multimodal Search</Body>
                  <Icon
                    glyph="Wizard"
                    size={14}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMultimodalInfoOpen(true);
                    }}
                    style={{
                      cursor: 'pointer',
                      opacity: 0.4,
                      color: palette.gray.dark1,
                      transition: 'opacity 0.2s',
                      flexShrink: 0,
                      minWidth: '14px'
                    }}
                    onMouseEnter={(e: any) => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={(e: any) => e.currentTarget.style.opacity = '0.4'}
                  />
                </div>
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

      {/* InfoWizard Modals */}
      <InfoWizard
        open={textInfoOpen}
        setOpen={setTextInfoOpen}
        iconGlyph="MagnifyingGlass"
        sections={textSearchInfo.sections}
        showButton={false}
      />

      <InfoWizard
        open={vectorInfoOpen}
        setOpen={setVectorInfoOpen}
        iconGlyph="Diagram"
        sections={vectorSearchInfo.sections}
        showButton={false}
      />

      <InfoWizard
        open={hybridInfoOpen}
        setOpen={setHybridInfoOpen}
        iconGlyph="Diagram"
        sections={hybridSearchInfo.sections}
        showButton={false}
      />

      <InfoWizard
        open={graphInfoOpen}
        setOpen={setGraphInfoOpen}
        iconGlyph="Relationship"
        sections={graphSearchInfo.sections}
        showButton={false}
      />

      <InfoWizard
        open={multimodalInfoOpen}
        setOpen={setMultimodalInfoOpen}
        iconGlyph="Camera"
        sections={multimodalSearchInfo.sections}
        showButton={false}
      />
    </div>
  );
};

export default SearchMethodSelector;