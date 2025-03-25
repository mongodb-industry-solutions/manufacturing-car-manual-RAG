/**
 * Chunk viewer component for displaying detailed chunk content
 */
import React from 'react';
import { Chunk } from '../../types/Chunk';
import { H1, H2, H3, Body, Subtitle } from '@leafygreen-ui/typography';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import Card from '@leafygreen-ui/card';
import Icon from '@leafygreen-ui/icon';
import Badge from '@leafygreen-ui/badge';
import ExpandableCard from '@leafygreen-ui/expandable-card';
import Button from '@leafygreen-ui/button';
import Link from 'next/link';

// Custom components
import SafetyNotice from './SafetyNotice';
import ProceduralSteps from './ProceduralSteps';

interface ChunkViewerProps {
  chunk: Chunk;
  showNavigation?: boolean;
}

const ChunkViewer: React.FC<ChunkViewerProps> = ({ chunk, showNavigation = true }) => {
  // Create page info text
  const pageInfo = chunk.page_numbers.length > 1 
    ? `Pages ${chunk.page_numbers.join(', ')}` 
    : `Page ${chunk.page_numbers[0]}`;
  
  // Check if there are safety notices
  const hasSafetyNotices = chunk.safety_notices && chunk.safety_notices.length > 0;
  
  // Check if there are procedural steps
  const hasProcedures = chunk.procedural_steps && chunk.procedural_steps.length > 0;
  
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: spacing[3] }}>
        {/* Breadcrumb trail */}
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
        
        {/* Heading levels */}
        {chunk.heading_level_1 && (
          <H1 style={{ marginBottom: spacing[1] }}>{chunk.heading_level_1}</H1>
        )}
        
        {chunk.heading_level_2 && (
          <H2 style={{ marginBottom: spacing[1] }}>{chunk.heading_level_2}</H2>
        )}
        
        {chunk.heading_level_3 && (
          <H3 style={{ marginBottom: spacing[1] }}>{chunk.heading_level_3}</H3>
        )}
      </div>
      
      {/* Metadata and badges */}
      <Card style={{ marginBottom: spacing[3], padding: spacing[3] }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[3] }}>
          {/* Page info */}
          <Badge>
            <span style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
              <Icon glyph="Page" size="small" /> {pageInfo}
            </span>
          </Badge>
          
          {/* Content types */}
          {chunk.content_type && chunk.content_type.map(type => (
            <Badge key={type} variant="darkgray">{type}</Badge>
          ))}
          
          {/* Vehicle systems */}
          {chunk.vehicle_systems && chunk.vehicle_systems.map(system => (
            <Badge key={system} variant="blue">{system}</Badge>
          ))}
          
          {/* Part numbers */}
          {chunk.part_numbers && chunk.part_numbers.map(part => (
            <Badge key={part} variant="green">Part: {part}</Badge>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: spacing[3], flexWrap: 'wrap' }}>
          {/* Metadata columns */}
          <div style={{ flex: '1 1 200px' }}>
            <Subtitle>Document Information</Subtitle>
            <div style={{ marginTop: spacing[2] }}>
              <Body size="small">
                <strong>Page Count:</strong> {chunk.metadata.page_count}
              </Body>
              <Body size="small">
                <strong>Content Length:</strong> {chunk.metadata.chunk_length} characters
              </Body>
              <Body size="small">
                <strong>ID:</strong> {chunk.id}
              </Body>
            </div>
          </div>
          
          {/* Systems and parts */}
          {(chunk.metadata.systems?.length || chunk.metadata.parts?.length) && (
            <div style={{ flex: '1 1 200px' }}>
              <Subtitle>Referenced Items</Subtitle>
              <div style={{ marginTop: spacing[2] }}>
                {chunk.metadata.systems?.length > 0 && (
                  <Body size="small">
                    <strong>Systems:</strong> {chunk.metadata.systems.join(', ')}
                  </Body>
                )}
                {chunk.metadata.parts?.length > 0 && (
                  <Body size="small">
                    <strong>Parts:</strong> {chunk.metadata.parts.join(', ')}
                  </Body>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
      
      {/* Safety notices section */}
      {hasSafetyNotices && (
        <div style={{ marginBottom: spacing[3] }}>
          <H3 style={{ marginBottom: spacing[2], color: palette.red.base }}>Safety Notices</H3>
          {chunk.safety_notices?.map((notice, index) => (
            <SafetyNotice key={index} notice={notice} />
          ))}
        </div>
      )}
      
      {/* Procedural steps section */}
      {hasProcedures && (
        <ProceduralSteps 
          steps={chunk.procedural_steps || []} 
          title={`${chunk.procedural_steps?.length} Step Procedure`}
        />
      )}
      
      {/* Main content text */}
      <Card style={{ marginBottom: spacing[3], padding: spacing[3] }}>
        <H3 style={{ marginBottom: spacing[2] }}>Content</H3>
        <Body>{chunk.text}</Body>
      </Card>
      
      {/* Additional context if available */}
      {chunk.context && (
        <ExpandableCard title="Additional Context" defaultOpen={false}>
          <Body>{chunk.context}</Body>
        </ExpandableCard>
      )}
      
      {/* Navigation links to prev/next chunks */}
      {showNavigation && (chunk.prev_chunk_id || chunk.next_chunk_id) && (
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: spacing[3],
          borderTop: `1px solid ${palette.gray.light2}`,
          paddingTop: spacing[3]
        }}>
          {chunk.prev_chunk_id ? (
            <Link href={`/chunk/${chunk.prev_chunk_id}`} passHref>
              <Button
                as="a"
                variant="default"
                leftGlyph={<Icon glyph="ChevronLeft" />}
              >
                Previous Section
              </Button>
            </Link>
          ) : (
            <div></div>
          )}
          
          {chunk.next_chunk_id && (
            <Link href={`/chunk/${chunk.next_chunk_id}`} passHref>
              <Button
                as="a"
                variant="default"
                rightGlyph={<Icon glyph="ChevronRight" />}
              >
                Next Section
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default ChunkViewer;