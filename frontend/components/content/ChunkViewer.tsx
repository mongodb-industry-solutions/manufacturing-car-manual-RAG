/**
 * Chunk viewer component for displaying detailed chunk content
 */
import React from 'react';
import { Chunk } from '../../types/Chunk';
import { MyH1 as H1, MyH2 as H2, MyH3 as H3, MyBody as Body, MySubtitle as Subtitle } from '@/components/ui/TypographyWrapper';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import { MyCard as Card, MyButton as Button } from '@/components/ui/TypographyWrapper';
import Icon from '@leafygreen-ui/icon';
import Badge from '@leafygreen-ui/badge';
import ExpandableCard from '@leafygreen-ui/expandable-card';
import Tooltip from '@leafygreen-ui/tooltip';
import Banner from '@leafygreen-ui/banner';
import Link from 'next/link';
import Code from '@leafygreen-ui/code';
import { useState } from 'react';

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
  
  // Check if there are safety notices (either from explicit notices or from metadata flag)
  const hasSafetyNotices = (chunk.safety_notices && chunk.safety_notices.length > 0) || 
                          (chunk.metadata && chunk.metadata.has_safety === true);
  
  // Check if there are procedural steps
  const hasProcedures = chunk.procedural_steps && chunk.procedural_steps.length > 0;
  
  // State to toggle MongoDB document view
  const [showMongoDoc, setShowMongoDoc] = useState(false);
  
  // Prepare MongoDB document representation
  const mongoDoc = {
    _id: chunk._id || chunk.id,
    text: chunk.text,
    page_numbers: chunk.page_numbers,
    content_type: chunk.content_type,
    metadata: chunk.metadata,
    ...(chunk.breadcrumb_trail && { breadcrumb_trail: chunk.breadcrumb_trail }),
    ...(chunk.heading_level_1 && { heading_level_1: chunk.heading_level_1 }),
    ...(chunk.heading_level_2 && { heading_level_2: chunk.heading_level_2 }),
    ...(chunk.heading_level_3 && { heading_level_3: chunk.heading_level_3 }),
    ...(chunk.safety_notices && { safety_notices: chunk.safety_notices }),
    ...(chunk.procedural_steps && { procedural_steps: chunk.procedural_steps }),
    ...(chunk.vehicle_systems && { vehicle_systems: chunk.vehicle_systems }),
    ...(chunk.part_numbers && { part_numbers: chunk.part_numbers }),
    ...(chunk.next_chunk_id && { next_chunk_id: chunk.next_chunk_id }),
    ...(chunk.related_chunks && { related_chunks: chunk.related_chunks })
  };
  
  return (
    <div>
      {/* Header with background */}
      <Card
        style={{ 
          marginBottom: spacing[3], 
          padding: spacing[3], 
          backgroundColor: palette.green.light3,
          borderTop: `4px solid ${palette.green.base}`,
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Breadcrumb trail */}
        {chunk.breadcrumb_trail && (
          <div style={{
            background: palette.white,
            borderRadius: '4px',
            padding: `${spacing[1]}px ${spacing[2]}px`,
            marginBottom: spacing[2],
            display: 'inline-block',
          }}>
            <Body size="small" style={{ 
              color: palette.gray.dark1,
              display: 'flex',
              alignItems: 'center',
              gap: spacing[1],
              margin: 0,
            }}>
              <Icon glyph="Folder" size="small" /> {chunk.breadcrumb_trail}
            </Body>
          </div>
        )}
        
        {/* Heading levels */}
        {chunk.heading_level_1 && (
          <H1 style={{ marginBottom: spacing[1], color: palette.green.dark2 }}>{chunk.heading_level_1}</H1>
        )}
        
        {chunk.heading_level_2 && (
          <H2 style={{ marginBottom: spacing[1], color: palette.green.dark1 }}>{chunk.heading_level_2}</H2>
        )}
        
        {chunk.heading_level_3 && (
          <H3 style={{ marginBottom: spacing[1] }}>{chunk.heading_level_3}</H3>
        )}

        {/* Quick info badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2], marginTop: spacing[2] }}>
          <Tooltip
            trigger={
              <Badge variant="darkgray">
                <span style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                  <Icon glyph="File" size="small" /> {pageInfo}
                </span>
              </Badge>
            }
            triggerEvent="hover"
          >
            Manual page reference
          </Tooltip>
          
          {hasSafetyNotices && (
            <Tooltip
              trigger={
                <Badge variant="red">
                  <span style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                    <Icon glyph="Warning" size="small" /> {chunk.safety_notices?.length} Safety {chunk.safety_notices?.length === 1 ? 'Notice' : 'Notices'}
                  </span>
                </Badge>
              }
              triggerEvent="hover"
            >
              Contains important safety information
            </Tooltip>
          )}
          
          {hasProcedures && (
            <Tooltip
              trigger={
                <Badge variant="blue">
                  <span style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                    <Icon glyph="CheckmarkWithCircle" size="small" /> {chunk.procedural_steps?.length} {chunk.procedural_steps?.length === 1 ? 'Step' : 'Steps'}
                  </span>
                </Badge>
              }
              triggerEvent="hover"
            >
              Contains a step-by-step procedure
            </Tooltip>
          )}
        </div>
      </Card>
      
      {/* Metadata grid layout */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: spacing[3],
        marginBottom: spacing[3]
      }}>
        {/* Metadata card */}
        <Card style={{ padding: spacing[3] }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] }}>
            <Icon glyph="InfoWithCircle" fill={palette.blue.base} />
            <Subtitle>Document Information</Subtitle>
          </div>
          
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: `${spacing[1]}px ${spacing[2]}px`,
            alignItems: 'center'
          }}>
            <Body size="small" weight="medium">Page Count:</Body>
            <Body size="small">{chunk.metadata.page_count}</Body>
            
            <Body size="small" weight="medium">Content Length:</Body>
            <Body size="small">{chunk.metadata.chunk_length} characters</Body>
            
            {chunk.metadata.source_pages && (
              <>
                <Body size="small" weight="medium">Source Pages:</Body>
                <Body size="small">{chunk.metadata.source_pages}</Body>
              </>
            )}
            
            {chunk.metadata.has_safety && (
              <>
                <Body size="small" weight="medium">Safety Information:</Body>
                <Body size="small">
                  <span style={{ 
                    color: palette.red.base, 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: spacing[1]
                  }}>
                    <Icon glyph="Warning" size="small" /> Present
                  </span>
                </Body>
              </>
            )}
            
            <Body size="small" weight="medium">ID:</Body>
            <Body size="small" style={{ 
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>{chunk.id || (chunk._id && (typeof chunk._id === 'string' ? chunk._id : chunk._id.$oid))}</Body>
          </div>
        </Card>
        
        {/* Content types card */}
        <Card style={{ padding: spacing[3] }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] }}>
            <Icon glyph="Tag" fill={palette.purple.base} />
            <Subtitle>Content Classification</Subtitle>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
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
            
            {/* Show message if no classifications */}
            {(!chunk.content_type?.length && !chunk.vehicle_systems?.length && !chunk.part_numbers?.length) && (
              <Body size="small" style={{ color: palette.gray.dark1 }}>No classifications available for this content</Body>
            )}
          </div>
        </Card>
      </div>
      
      {/* Safety notices banner */}
      {hasSafetyNotices && (
        <Banner 
          variant="warning"
          style={{ marginBottom: spacing[3] }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
            <Icon glyph="Warning" size="large" />
            <H3 style={{ margin: 0 }}>Important Safety Information</H3>
          </div>
          <Body>This section contains critical safety notices that should be carefully reviewed before proceeding.</Body>
        </Banner>
      )}
      
      {/* Safety notices section */}
      {hasSafetyNotices && (
        <div style={{ marginBottom: spacing[3] }}>
          {chunk.safety_notices && chunk.safety_notices.length > 0 ? (
            // Display explicit safety notices if available
            chunk.safety_notices.map((notice, index) => (
              <SafetyNotice key={index} notice={notice} />
            ))
          ) : (
            // Display default safety notice if we only have the has_safety flag
            <Card style={{ 
              padding: spacing[3], 
              borderLeft: `4px solid ${palette.red.base}`,
              backgroundColor: palette.red.light3 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                <Icon glyph="Warning" size="large" fill={palette.red.base} />
                <div>
                  <H3 style={{ color: palette.red.dark2, margin: 0, marginBottom: spacing[1] }}>
                    Safety Information
                  </H3>
                  <Body>
                    This section contains important safety information. Please read all warnings 
                    and precautions carefully before proceeding with any operations described in this document.
                  </Body>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
      
      {/* Procedural steps section */}
      {hasProcedures && (
        <div style={{ marginBottom: spacing[3] }}>
          <Card style={{ 
            borderLeft: `4px solid ${palette.blue.base}`,
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}>
            <div style={{ 
              backgroundColor: palette.blue.light3, 
              padding: spacing[2],
              borderBottom: `1px solid ${palette.blue.light1}`,
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
            }}>
              <Icon glyph="CheckmarkWithCircle" fill={palette.blue.base} />
              <H3 style={{ margin: 0, color: palette.blue.dark2 }}>
                {chunk.procedural_steps?.length} Step Procedure
              </H3>
            </div>
            <div style={{ padding: spacing[3] }}>
              <ProceduralSteps 
                steps={chunk.procedural_steps || []} 
                title=""
              />
            </div>
          </Card>
        </div>
      )}
      
      {/* Main content text */}
      <Card style={{ 
        marginBottom: spacing[3], 
        padding: spacing[3],
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)',
        border: `1px solid ${palette.gray.light2}`,
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: spacing[2], 
          marginBottom: spacing[2],
          paddingBottom: spacing[2],
          borderBottom: `1px solid ${palette.gray.light2}`,
        }}>
          <Icon glyph="Note" fill={palette.green.base} size="large" />
          <H3 style={{ margin: 0 }}>Content</H3>
        </div>
        <Body style={{ lineHeight: '1.6' }}>{chunk.text}</Body>
      </Card>
      
      {/* MongoDB Document View */}
      <ExpandableCard
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
            <Icon glyph="Database" fill={palette.blue.base} size="small" />
            <span style={{ color: palette.blue.base, fontSize: '16px' }}>{ '{' }</span>
            <span style={{ fontSize: '13px', fontWeight: 'medium' }}>MongoDB Document</span>
            <span style={{ color: palette.blue.base, fontSize: '16px' }}>{ '}' }</span>
          </span>
        }
        description="View the raw MongoDB document structure"
        defaultOpen={showMongoDoc}
        onClick={() => setShowMongoDoc(!showMongoDoc)}
        style={{ 
          marginBottom: spacing[3],
          border: `1px solid ${palette.blue.light1}`,
          borderRadius: '4px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div>
          <Body size="small" style={{ marginBottom: spacing[2], color: palette.gray.dark1 }}>
            This is the raw MongoDB document structure that contains all metadata and content for this chunk.
            MongoDB's document model allows for flexible schemas and nested data structures.
          </Body>
          <div style={{ maxHeight: '400px', overflow: 'auto', backgroundColor: palette.gray.light3, borderRadius: '4px' }}>
            <Code language="json" copyable={true}>
              {JSON.stringify(mongoDoc, null, 2)}
            </Code>
          </div>
        </div>
      </ExpandableCard>
      
      {/* Navigation links to next chunk and related chunks */}
      {showNavigation && (chunk.related_chunks?.length > 0 || chunk.next_chunk_id) && (
        <Card style={{ 
          marginTop: spacing[3],
          padding: spacing[3],
          backgroundColor: palette.gray.light3,
          border: `1px solid ${palette.gray.light1}`,
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing[3],
          }}>
            <div>
              <Body size="small" weight="medium" style={{ marginBottom: spacing[1] }}>Document Navigation</Body>
            </div>
            
            {/* Next chunk navigation */}
            {chunk.next_chunk_id && (
              <div style={{ 
                display: 'flex',
                gap: spacing[2],
                justifyContent: 'flex-end'
              }}>
                <Link href={`/chunk/${chunk.next_chunk_id}`}>
                  <div style={{ display: 'inline-block' }}>
                    <Button
                      variant="default"
                      size="small"
                      rightGlyph={<Icon glyph="ChevronRight" />}
                    >
                      Next Section
                    </Button>
                  </div>
                </Link>
              </div>
            )}
            
            {/* Related chunks section */}
            {chunk.related_chunks && chunk.related_chunks.length > 0 && (
              <div>
                <Subtitle style={{ marginBottom: spacing[2] }}>Related Content</Subtitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                  {chunk.related_chunks.map(relatedChunkId => (
                    <Link key={relatedChunkId} href={`/chunk/${relatedChunkId}`}>
                      <div style={{ 
                        padding: spacing[2],
                        backgroundColor: palette.white,
                        borderRadius: '4px',
                        border: `1px solid ${palette.gray.light2}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing[2],
                        transition: 'background-color 0.2s',
                        ':hover': {
                          backgroundColor: palette.gray.light1
                        }
                      }}>
                        <Icon glyph="Link" />
                        <Body size="small">{relatedChunkId}</Body>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ChunkViewer;