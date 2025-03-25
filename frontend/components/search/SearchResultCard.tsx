/**
 * Search result card component
 */
import React from 'react';
import Card from '@leafygreen-ui/card';
import Button from '@leafygreen-ui/button';
import { H3, Body, Subtitle } from '@leafygreen-ui/typography';
import Icon from '@leafygreen-ui/icon';
import Callout from '@leafygreen-ui/callout';
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
  const { chunk, score, vector_score, text_score } = result;
  
  // Format score as percentage
  const scorePercent = Math.round(score * 100);
  
  // Get heading hierarchy for result
  const title = chunk.heading_level_1 || chunk.breadcrumb_trail?.split(' > ')[0] || 'Document Section';
  const subtitle = chunk.heading_level_2 || chunk.heading_level_3 || '';
  
  // Show safety notices if any
  const hasSafetyNotices = chunk.safety_notices && chunk.safety_notices.length > 0;
  
  // Check if there are procedural steps
  const hasProcedures = chunk.procedural_steps && chunk.procedural_steps.length > 0;
  
  // Create page info text
  const pageInfo = chunk.page_numbers.length > 1 
    ? `Pages ${chunk.page_numbers.join(', ')}` 
    : `Page ${chunk.page_numbers[0]}`;
  
  return (
    <Card 
      style={{ 
        marginBottom: spacing[3],
        padding: spacing[3],
        border: `1px solid ${palette.gray.light2}`,
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
      hoverable
    >
      {/* Score indicator */}
      <div style={{ 
        position: 'absolute', 
        top: spacing[2], 
        right: spacing[2],
        display: 'flex',
        gap: spacing[1],
        alignItems: 'center',
      }}>
        <Badge variant="green">
          {scorePercent}% match
        </Badge>
        
        {vector_score && (
          <Badge variant="lightgray">
            <span style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
              <Icon glyph="Diagram" size="small" /> {Math.round(vector_score * 100)}%
            </span>
          </Badge>
        )}
        
        {text_score && (
          <Badge variant="lightgray">
            <span style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
              <Icon glyph="Type" size="small" /> {Math.round(text_score * 100)}%
            </span>
          </Badge>
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
      {chunk.breadcrumb_trail && (
        <Body size="small" style={{ 
          marginBottom: spacing[2], 
          color: palette.gray.dark1,
          display: 'flex',
          alignItems: 'center',
          gap: spacing[1]
        }}>
          <Icon glyph="Folder" size="small" /> {chunk.breadcrumb_trail}
        </Body>
      )}
      
      {/* Content type badges */}
      {chunk.content_type && chunk.content_type.length > 0 && (
        <div style={{ display: 'flex', gap: spacing[1], marginBottom: spacing[2], flexWrap: 'wrap' }}>
          {chunk.content_type.map((type) => (
            <Badge key={type} variant="darkgray">
              {type}
            </Badge>
          ))}
        </div>
      )}
      
      {/* Text content preview - truncated */}
      <Body style={{ 
        marginBottom: spacing[2],
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {chunk.text}
      </Body>
      
      {/* Special content indicators */}
      <div style={{ display: 'flex', gap: spacing[2], marginBottom: spacing[2], flexDirection: 'column' }}>
        {/* Safety Notices Indicator */}
        {hasSafetyNotices && (
          <Callout 
            variant="warning"
            title="Safety Information" 
          >
            <Body>This section contains important safety warnings</Body>
          </Callout>
        )}
        
        {/* Procedures Indicator */}
        {hasProcedures && (
          <Callout 
            variant="info"
            title="Step-by-step Procedure" 
          >
            <Body>Contains {chunk.procedural_steps?.length} procedural steps</Body>
          </Callout>
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
          <Body size="small" style={{ 
            color: palette.gray.dark1,
            display: 'flex',
            alignItems: 'center',
            gap: spacing[1]
          }}>
            <Icon glyph="Page" size="small" /> {pageInfo}
          </Body>
          
          {chunk.metadata?.page_count > 1 && (
            <Body size="small" style={{ 
              color: palette.gray.dark1,
              display: 'flex',
              alignItems: 'center',
              gap: spacing[1]
            }}>
              <Icon glyph="Copy" size="small" /> {chunk.metadata.page_count} pages
            </Body>
          )}
        </div>
        
        <Link href={`/chunk/${chunk.id}`} passHref>
          <Button 
            as="a"
            variant="primary"
            size="small"
            rightGlyph={<Icon glyph="ChevronRight" />}
          >
            View Details
          </Button>
        </Link>
      </div>
    </Card>
  );
};

export default SearchResultCard;