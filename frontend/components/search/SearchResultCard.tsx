/**
 * Search result card component
 */
import React from 'react';
import Card from '@leafygreen-ui/card';
import Button from '@leafygreen-ui/button';
import { H3, Body, Subtitle } from '@leafygreen-ui/typography';
import Icon from '@leafygreen-ui/icon';
import Callout from '@leafygreen-ui/callout';
import Tooltip from '@leafygreen-ui/tooltip';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import { SearchResult } from '../../types/Search';
import { Chunk } from '../../types/Chunk';
import Link from 'next/link';
import Badge from '@leafygreen-ui/badge';
import { BRANDING, TERMINOLOGY, DOCUMENT_CONFIG, FEATURES } from '@/constants/appConstants';
import { PositionIndicator } from './PositionIndicator';
import { CARD_STYLES, BADGE_STYLES } from '@/lib/styleConstants';

interface SearchResultCardProps {
  result: SearchResult;
  highlight?: string;
}

const SearchResultCard: React.FC<SearchResultCardProps> = ({ result, highlight }) => {
  // Use primary color from constants
  const primaryColor = BRANDING.primaryColor;
  
  // Use new flattened result format if available, fall back to legacy chunk format
  const { score, vector_score, text_score } = result;
  
  // Calculate combined score and percentages for hybrid search
  const combinedScore = (vector_score || 0) + (text_score || 0);
  const vectorPercentage = combinedScore > 0 ? ((vector_score || 0) / combinedScore) * 100 : 0;
  const textPercentage = combinedScore > 0 ? ((text_score || 0) / combinedScore) * 100 : 0;
  
  // Get either direct fields from result or from chunk object
  const chunk = result.chunk || {} as Partial<Chunk>; // Fallback for backward compatibility
  
  // Get the text content and other fields either directly from result or from chunk
  const text = result.text || chunk.text || '';
  const context = result.context || chunk.context;
  const breadcrumb_trail = result.breadcrumb_trail || chunk.breadcrumb_trail;
  const page_numbers = result.page_numbers || chunk.page_numbers || [];
  const content_type = result.content_type || chunk.content_type || [];
  const metadata = result.metadata || chunk.metadata || {};
  const vehicle_systems = result.vehicle_systems || chunk.vehicle_systems || [];
  const safety_notices = chunk.safety_notices || [];
  const procedural_steps = chunk.procedural_steps || [];
  const heading_level_1 = result.heading_level_1 || chunk.heading_level_1;
  const heading_level_2 = result.heading_level_2 || chunk.heading_level_2;
  const heading_level_3 = result.heading_level_3 || chunk.heading_level_3;
  const chunk_id = result.chunk_id || chunk.id;
  
  // Hybrid Graph source and depth info
  const source = result.source;
  const depth = result.depth;
  const isGraphRAG = source !== undefined && source !== null;
  // CRITICAL: Only mark as seed if BOTH source is 'vector_seed' AND depth is 0
  // This prevents graph-expanded results with depth=0 from incorrectly showing as seeds
  const isSeed = source === 'vector_seed' && depth === 0;
  
  // Determine if this is hybrid search (has both vector and text scores but no source field)
  const isHybridSearch = (vector_score !== undefined && text_score !== undefined) && !isGraphRAG;
  
  // Raw score from $rankFusion (typically 0-1 range)
  const displayScore = score;
  
  // Get heading hierarchy for result
  const title = heading_level_1 || breadcrumb_trail?.split(' > ')[0] || 'Document Section';
  const subtitle = heading_level_2 || heading_level_3 || '';
  
  // Show safety notices if any
  const hasSafetyNotices = 
    (safety_notices && safety_notices.length > 0) || 
    (metadata && metadata.has_safety === true);
  
  // Check if there are procedural steps
  const hasProcedures = procedural_steps && procedural_steps.length > 0;
  
  // Create page info text
  const pageInfo = page_numbers.length > 1 
    ? `Pages ${page_numbers.join(', ')}` 
    : `Page ${page_numbers[0]}`;
  
  return (
    <Card 
      style={{ 
        marginBottom: spacing[3],
        padding: 0,
        borderRadius: '8px',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${palette.gray.light1}`,
      }}
      hoverable={true}
    >
      {/* Header section with color bar based on score */}
      <div style={{ 
        borderTop: `4px solid ${
          displayScore >= 0.05 ? palette.green.base : 
          displayScore >= 0.03 ? palette.green.light1 : 
          displayScore >= 0.02 ? palette.yellow.base : 
          palette.red.base
        }`,
        padding: `${spacing[3]}px ${spacing[3]}px ${spacing[2]}px`
      }}>
        {/* Score indicators and position indicator */}
        <div style={{ 
          float: 'right',
          display: 'flex',
          gap: spacing[2],
          alignItems: 'flex-start',
          marginLeft: spacing[2],
          marginBottom: spacing[2],
        }}>
          {/* Position Indicator - only show if reranker was actually applied */}
          {result.reranker_score !== undefined && result.reranker_score !== null && result.position_change !== undefined && result.position_change !== null && (
            <div style={{ paddingTop: '2px' }}>
              <PositionIndicator
                originalPosition={result.original_position}
                newPosition={result.new_position}
                positionChange={result.position_change}
                rerankerScore={result.reranker_score}
                showTooltip={true}
              />
            </div>
          )}
          
          {/* Scores column */}
          <div style={{ 
            display: 'flex',
            gap: spacing[2],
            alignItems: 'center',
            flexDirection: 'column'
          }}>
            {/* For hybrid search only: show combined score and percentage breakdown */}
            {isHybridSearch && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1], alignItems: 'flex-end' }}>
              {/* Combined Score */}
              <Tooltip
                trigger={
                  <Badge variant="lightgray">
                    <span style={{ fontWeight: 'bold' }}>
                      {combinedScore.toFixed(4)}
                    </span>
                  </Badge>
                }
                triggerEvent="hover"
              >
                Combined RRF score (vector + text contributions)
              </Tooltip>
              
              {/* Percentage Slider */}
              {combinedScore > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1], alignItems: 'flex-end' }}>
                  <div style={{
                    width: '120px',
                    height: '20px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: `1px solid ${palette.gray.light1}`,
                    display: 'flex'
                  }}>
                    {/* Text portion (green) - left side */}
                    <div style={{
                      width: `${textPercentage}%`,
                      height: '100%',
                      backgroundColor: palette.green.dark2,
                      transition: 'width 0.3s ease'
                    }} />
                    {/* Vector portion (blue) - right side */}
                    <div style={{
                      width: `${vectorPercentage}%`,
                      height: '100%',
                      backgroundColor: palette.blue.dark2,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  
                  {/* Percentage labels */}
                  <div style={{ 
                    display: 'flex', 
                    gap: spacing[2], 
                    fontSize: '12px',
                    color: palette.gray.dark1
                  }}>
                    <Tooltip
                      trigger={
                        <span style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: spacing[1],
                          color: palette.green.dark2
                        }}>
                          <Icon glyph="String" size="small" />
                          {textPercentage.toFixed(1)}%
                        </span>
                      }
                      triggerEvent="hover"
                    >
                      Text search contribution: {text_score?.toFixed(4)}
                    </Tooltip>
                    
                    <Tooltip
                      trigger={
                        <span style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: spacing[1],
                          color: palette.blue.dark2
                        }}>
                          <Icon glyph="Diagram" size="small" />
                          {vectorPercentage.toFixed(1)}%
                        </span>
                      }
                      triggerEvent="hover"
                    >
                      Vector search contribution: {vector_score?.toFixed(4)}
                    </Tooltip>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Show vector score only for pure vector search */}
          {vector_score !== undefined && vector_score > 0 && text_score === undefined && (
            <Tooltip
              trigger={
                <Badge variant="lightgray">
                  <span style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                    <Icon glyph="Diagram" size="small" /> 
                    {vector_score.toFixed(4)}
                  </span>
                </Badge>
              }
              triggerEvent="hover"
            >
              Vector search score
            </Tooltip>
          )}
          
          {/* Show text score only for pure text search */}
          {text_score !== undefined && text_score > 0 && vector_score === undefined && (
            <Tooltip
              trigger={
                <Badge variant="lightgray">
                  <span style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                    <Icon glyph="String" size="small" /> 
                    {text_score.toFixed(4)}
                  </span>
                </Badge>
              }
              triggerEvent="hover"
            >
              Full-text search score
            </Tooltip>
          )}
          
          {/* Reranker Score Badge */}
          {result.reranker_score !== undefined && result.reranker_score !== null && (
            <Tooltip
              trigger={
                <Badge variant="yellow">
                  <span style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                    <Icon glyph="Sparkle" size="small" />
                    R: {result.reranker_score.toFixed(4)}
                  </span>
                </Badge>
              }
              triggerEvent="hover"
            >
              Voyage AI Reranker score
            </Tooltip>
          )}
          </div>
        </div>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
          <H3 style={{ margin: 0 }}>{title}</H3>
          
          {/* GraphRAG Source Badge */}
          {isGraphRAG && (
            <Tooltip
              trigger={
                <Badge variant={isSeed ? 'blue' : 'green'}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                    {isSeed ? 'Seed' : 'Expanded'}
                    {depth !== undefined && depth !== null && ` (D${depth})`}
                  </span>
                </Badge>
              }
              triggerEvent="hover"
            >
              {isSeed 
                ? `Initial search result (depth ${depth || 0})` 
                : `Found via graph traversal at depth ${depth}`
              }
            </Tooltip>
          )}
        </div>
        
        {/* Breadcrumb - only show if different from title and has hierarchy */}
        {breadcrumb_trail && breadcrumb_trail !== title && breadcrumb_trail.includes(' > ') && (
          <Body size="small" style={{ 
            marginBottom: spacing[2], 
            color: palette.gray.dark1,
            display: 'flex',
            alignItems: 'center',
            gap: spacing[1]
          }}>
            {breadcrumb_trail}
          </Body>
        )}
      </div>
      
      {/* Content section */}
      <div style={{ padding: `0 ${spacing[3]}px ${spacing[3]}px` }}>
        {/* Content type badges */}
        {content_type && content_type.length > 0 && (
          <div style={{ display: 'flex', gap: spacing[1], marginBottom: spacing[3], flexWrap: 'wrap' }}>
            {content_type.map((type) => (
              <Badge key={type} variant="darkgray">
                {type}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Text content preview - truncated */}
        <Card style={{ 
          padding: spacing[2], 
          marginTop: spacing[3],
          marginBottom: spacing[2],
          backgroundColor: palette.gray.light3,
          border: 'none'
        }}>
          <Body style={{ 
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {text}
          </Body>
        </Card>
        
        {/* Special content indicators */}
        <div style={{ display: 'flex', gap: spacing[2], marginBottom: spacing[2], flexDirection: 'column' }}>
          {/* Safety Notices Indicator */}
          {hasSafetyNotices && (
            <div style={{ marginBottom: spacing[2] }}>
              <Callout 
                variant="warning"
                title="Safety Information" 
              >
                {safety_notices && safety_notices.length > 0 ? (
                  <Body>Contains {safety_notices.length} important safety {safety_notices.length === 1 ? 'warning' : 'warnings'}</Body>
                ) : (
                  <Body>Contains important safety information</Body>
                )}
              </Callout>
            </div>
          )}
          
          {/* Procedures Indicator */}
          {hasProcedures && (
            <div style={{ marginBottom: spacing[2] }}>
              <Callout 
                variant="note"
                title="Step-by-step Procedure" 
              >
                <Body>Contains {procedural_steps.length} procedural {procedural_steps.length === 1 ? 'step' : 'steps'}</Body>
              </Callout>
            </div>
          )}
        </div>
        
        {/* Footer info */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: spacing[2],
          borderTop: `1px solid ${palette.gray.light2}`,
          paddingTop: spacing[2],
        }}>
          <div style={{ display: 'flex', gap: spacing[2] }}>
            <Tooltip
              trigger={
                <Body size="small" style={{ 
                  color: palette.gray.dark1
                }}>
                  {pageInfo}
                </Body>
              }
              triggerEvent="hover"
            >
              Manual page reference
            </Tooltip>
            
            {metadata && metadata.page_count > 1 && (
              <Tooltip
                trigger={
                  <Body size="small" style={{ 
                    color: palette.gray.dark1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[1]
                  }}>
                    <Icon glyph="Copy" size="small" /> {metadata.page_count} pages
                  </Body>
                }
                triggerEvent="hover"
              >
                Number of pages this content spans
              </Tooltip>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: spacing[2] }}>
            <Link href={`/chunk/${chunk_id}?source=search`}>
              <div style={{ display: 'inline-block' }}>
                <Button 
                  variant="primary"
                  size="small"
                  rightGlyph={<Icon glyph="ChevronRight" />}
                  onClick={() => {
                    // Save current search URL with parameters to sessionStorage before navigation
                    if (typeof window !== 'undefined') {
                      sessionStorage.setItem('car_manual_previous_search_url', window.location.href);
                      sessionStorage.setItem('car_manual_referrer_type', 'search');
                    }
                  }}
                >
                  View Details
                </Button>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SearchResultCard;