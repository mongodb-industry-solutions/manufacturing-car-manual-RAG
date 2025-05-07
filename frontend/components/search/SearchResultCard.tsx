/**
 * Search result card component
 */
import React from 'react';
import { MyCard as Card } from '@/components/ui/TypographyWrapper';
import { MyButton as Button } from '@/components/ui/TypographyWrapper';
import { MyH3 as H3, MyBody as Body, MySubtitle as Subtitle } from '@/components/ui/TypographyWrapper';
import Icon from '@leafygreen-ui/icon';
import Callout from '@leafygreen-ui/callout';
import Tooltip from '@leafygreen-ui/tooltip';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import { SearchResult } from '../../types/Search';
import Link from 'next/link';
import Badge from '@leafygreen-ui/badge';

interface SearchResultCardProps {
  result: SearchResult;
  highlight?: string;
}

const SearchResultCard: React.FC<SearchResultCardProps> = ({ result, highlight }) => {
  // Use new flattened result format if available, fall back to legacy chunk format
  const { score, vector_score, text_score } = result;
  
  // Get either direct fields from result or from chunk object
  const chunk = result.chunk || {}; // Fallback for backward compatibility
  
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
  
  // Format score as percentage, ensure score is between 0-1
  const normalizedScore = Math.max(0, Math.min(1, score));
  const scorePercent = Math.round(normalizedScore * 100);
  
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
      hoverable="true"
    >
      {/* Header section with color bar based on score */}
      <div style={{ 
        borderTop: `4px solid ${
          scorePercent >= 90 ? palette.green.base : 
          scorePercent >= 70 ? palette.green.light1 : 
          scorePercent >= 50 ? palette.yellow.base : 
          palette.red.base
        }`,
        padding: `${spacing[3]}px ${spacing[3]}px ${spacing[2]}px`
      }}>
        {/* Score indicators */}
        <div style={{ 
          float: 'right',
          display: 'flex',
          gap: spacing[1],
          alignItems: 'center',
          marginLeft: spacing[2],
          marginBottom: spacing[2]
        }}>
          {/* For hybrid search: always show overall score with proper formatting */}
          {(vector_score !== undefined && text_score !== undefined) && (
            <Tooltip
              trigger={
                <Badge variant={
                  scorePercent >= 90 ? "green" :
                  scorePercent >= 70 ? "lightgray" :
                  scorePercent >= 50 ? "yellow" :
                  scorePercent > 0 ? "red" : "darkgray"
                }>
                  <span style={{ fontWeight: 'bold' }}>
                    {score > 0 ? `${scorePercent}%` : "0%"}
                  </span>
                </Badge>
              }
              triggerEvent="hover"
            >
              {vector_score !== undefined && text_score !== undefined 
                ? `RRF score (expected to be low, typically under 5%). These low scores are mathematically correct due to the RRF formula: 1/(k+rank).` 
                : `Overall match score`}
            </Tooltip>
          )}
          
          {/* Only show vector score with proper formatting */}
          {vector_score !== undefined && (
            <Tooltip
              trigger={
                <Badge variant="lightgray">
                  <span style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                    <Icon glyph="Diagram" size="small" /> 
                    {vector_score > 0 
                      ? `${Math.round(Math.min(1, Math.max(0, vector_score)) * 100)}%` 
                      : "0%"}
                  </span>
                </Badge>
              }
              triggerEvent="hover"
            >
              {text_score !== undefined 
                ? `Vector component of RRF score (naturally low due to the 1/(k+rank) formula)`
                : `Semantic vector search score`}
            </Tooltip>
          )}
          
          {/* Only show text score with proper formatting */}
          {text_score !== undefined && (
            <Tooltip
              trigger={
                <Badge variant="lightgray">
                  <span style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                    <Icon glyph="String" size="small" /> 
                    {text_score > 0 
                      ? `${Math.round(Math.min(1, Math.max(0, text_score)) * 100)}%` 
                      : "0%"}
                  </span>
                </Badge>
              }
              triggerEvent="hover"
            >
              {vector_score !== undefined 
                ? `Text component of RRF score (naturally low due to the 1/(k+rank) formula)`
                : `Keyword text search score`}
            </Tooltip>
          )}
        </div>
        
        {/* Header */}
        <H3 style={{ marginBottom: spacing[1] }}>{title}</H3>
        {subtitle && (
          <Subtitle style={{ marginBottom: spacing[2], color: palette.gray.dark1 }}>
            {subtitle}
          </Subtitle>
        )}
        
        {/* Breadcrumb */}
        {breadcrumb_trail && (
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
          <div style={{ display: 'flex', gap: spacing[1], marginBottom: spacing[2], flexWrap: 'wrap' }}>
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
          
          <Link href={`/chunk/${chunk_id}`}>
            <div style={{ display: 'inline-block' }}>
              <Button 
                variant="primary"
                size="small"
                rightGlyph={<Icon glyph="ChevronRight" />}
              >
                View Details
              </Button>
            </div>
          </Link>
        </div>
      </div>
    </Card>
  );
};

export default SearchResultCard;