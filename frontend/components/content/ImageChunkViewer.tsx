/**
 * Image Chunk Viewer - Displays image chunks
 */
import React, { useState } from 'react';
import { Chunk } from '../../types/Chunk';
import { H1, H2, H3, Body, Subtitle } from '@leafygreen-ui/typography';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import Card from '@leafygreen-ui/card';
import Button from '@leafygreen-ui/button';
import Icon from '@leafygreen-ui/icon';
import Badge from '@leafygreen-ui/badge';
import ExpandableCard from '@leafygreen-ui/expandable-card';
import Tooltip from '@leafygreen-ui/tooltip';
import Link from 'next/link';
import Code from '@leafygreen-ui/code';
import { getImageFileUrl } from '@/services/api';

interface ImageChunkViewerProps {
  chunk: Chunk;
  showNavigation?: boolean;
}

const ImageChunkViewer: React.FC<ImageChunkViewerProps> = ({ chunk, showNavigation = true }) => {
  const [imageError, setImageError] = useState(false);
  const [showMongoDoc, setShowMongoDoc] = useState(false);

  // Get image URL using the chunk ID
  const chunkId = chunk.id || (chunk._id && (typeof chunk._id === 'string' ? chunk._id : chunk._id.$oid));
  const imageUrl = chunkId ? getImageFileUrl(chunkId) : null;

  // Create page info text
  const pageInfo = chunk.page_numbers && chunk.page_numbers.length > 0
    ? chunk.page_numbers.length > 1
      ? `Pages ${chunk.page_numbers.join(', ')}`
      : `Page ${chunk.page_numbers[0]}`
    : 'No page info';

  // Generate fake multimodal embedding for display
  const generateFakeMultimodalEmbedding = () => {
    const embedding = [];
    for (let i = 0; i < 1024; i++) {
      embedding.push(parseFloat((Math.random() * 0.16 - 0.08).toFixed(6)));
    }
    return embedding;
  };

  // Prepare MongoDB document representation
  const mongoDoc = {
    _id: chunk._id || chunk.id,
    id: chunk.id,
    gridfs_file_id: chunk.gridfs_file_id,
    ...(chunk.title && { title: chunk.title }),
    ...(chunk.description && { description: chunk.description }),
    ...(chunk.category && { category: chunk.category }),
    ...(chunk.keywords && chunk.keywords.length > 0 && { keywords: chunk.keywords }),
    ...(chunk.languages && chunk.languages.length > 0 && { languages: chunk.languages }),
    ...(chunk.breadcrumb_trail && { breadcrumb_trail: chunk.breadcrumb_trail }),
    ...(chunk.page_numbers && chunk.page_numbers.length > 0 && { page_numbers: chunk.page_numbers }),
    ...(chunk.content_type && { content_type: chunk.content_type }),
    ...(chunk.associated_chunk_ids && chunk.associated_chunk_ids.length > 0 && {
      associated_chunk_ids: chunk.associated_chunk_ids
    }),
    multimodal_embedding: chunk.multimodal_embedding || generateFakeMultimodalEmbedding()
  };

  return (
    <div>
      {/* Header with background */}
      <Card
        style={{
          marginBottom: spacing[3],
          padding: spacing[3],
          backgroundColor: palette.blue.light3,
          borderTop: `4px solid ${palette.blue.base}`,
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

        {/* Title */}
        {chunk.title && (
          <H1 style={{ marginBottom: spacing[1], color: palette.blue.dark2 }}>
            {chunk.title}
          </H1>
        )}

        {/* Category as subtitle */}
        {chunk.category && (
          <H3 style={{ marginBottom: spacing[2], color: palette.blue.dark1 }}>
            {chunk.category}
          </H3>
        )}

        {/* Quick info badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2], marginTop: spacing[2] }}>
          <Badge variant="blue">
            <span style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
              <Icon glyph="Camera" size="small" /> Image Document
            </span>
          </Badge>

          {chunk.page_numbers && chunk.page_numbers.length > 0 && (
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
          )}

          {chunk.languages && chunk.languages.length > 0 && (
            <Badge variant="lightgray">
              {chunk.languages.length} language{chunk.languages.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </Card>

      {/* Image Display Card */}
      <Card style={{
        marginBottom: spacing[3],
        padding: 0,
        overflow: 'hidden',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
      }}>
        <div style={{
          backgroundColor: palette.gray.light3,
          padding: spacing[3],
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}>
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={chunk.title || chunk.description || 'Image'}
              style={{
                maxWidth: '100%',
                maxHeight: '600px',
                objectFit: 'contain',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              }}
              onError={() => setImageError(true)}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: spacing[5] }}>
              <Icon glyph="Camera" size="xlarge" fill={palette.gray.base} />
              <Body style={{ color: palette.gray.dark1, marginTop: spacing[3] }}>
                {imageUrl ? 'Image failed to load' : 'No image available'}
              </Body>
            </div>
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
            <Subtitle>Image Information</Subtitle>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: `${spacing[1]}px ${spacing[2]}px`,
            alignItems: 'center'
          }}>
            <Body size="small" weight="medium">Image ID:</Body>
            <Body size="small" style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {chunk.id || (chunk._id && (typeof chunk._id === 'string' ? chunk._id : chunk._id.$oid))}
            </Body>

            {chunk.gridfs_file_id && (
              <>
                <Body size="small" weight="medium">File ID:</Body>
                <Body size="small" style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {chunk.gridfs_file_id}
                </Body>
              </>
            )}

            {chunk.category && (
              <>
                <Body size="small" weight="medium">Category:</Body>
                <Body size="small">{chunk.category}</Body>
              </>
            )}

            {chunk.languages && chunk.languages.length > 0 && (
              <>
                <Body size="small" weight="medium">Languages:</Body>
                <Body size="small">{chunk.languages.join(', ')}</Body>
              </>
            )}
          </div>
        </Card>

        {/* Keywords and tags card */}
        {chunk.keywords && chunk.keywords.length > 0 && (
          <Card style={{ padding: spacing[3] }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] }}>
              <Icon glyph="Tag" fill={palette.purple.base} />
              <Subtitle>Keywords</Subtitle>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
              {chunk.keywords.map(keyword => (
                <Badge key={keyword} variant="lightgray">{keyword}</Badge>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Description */}
      {chunk.description && (
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
            <Icon glyph="Note" fill={palette.blue.base} size="large" />
            <H3 style={{ margin: 0 }}>Description</H3>
          </div>
          <Body style={{ lineHeight: '1.6' }}>{chunk.description}</Body>
        </Card>
      )}

      {/* Associated Text Chunks */}
      {chunk.associated_chunk_ids && chunk.associated_chunk_ids.length > 0 && (
        <Card style={{
          marginBottom: spacing[3],
          padding: spacing[3],
          backgroundColor: palette.gray.light3,
          border: `1px solid ${palette.gray.light2}`,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
            marginBottom: spacing[2],
          }}>
            <Icon glyph="InviteUser" fill={palette.blue.base} />
            <Subtitle>Associated Text Chunks ({chunk.associated_chunk_ids.length})</Subtitle>
          </div>

          <Body size="small" style={{ marginBottom: spacing[2], color: palette.gray.dark1 }}>
            These text chunks are related to this image and provide additional context.
          </Body>

          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
            {chunk.associated_chunk_ids.map(chunkId => (
              <Link key={chunkId} href={`/chunk/${chunkId}`}>
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
                }}>
                  <Icon glyph="Link" />
                  <Body size="small">{chunkId}</Body>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* MongoDB Document View */}
      <ExpandableCard
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
            <Icon glyph="Database" fill={palette.blue.base} size="small" />
            <span style={{ color: palette.blue.base, fontSize: '16px' }}>{ '{' }</span>
            <span style={{ fontSize: '13px', fontWeight: 'medium' }}>MongoDB Image Document</span>
            <span style={{ color: palette.blue.base, fontSize: '16px' }}>{ '}' }</span>
          </span>
        }
        description="View the raw MongoDB document structure for this image"
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
            This is the raw MongoDB document structure that contains all metadata for this image.
            The image binary data is stored separately and referenced by file_id.
          </Body>
          <div style={{ maxHeight: '400px', overflow: 'auto', backgroundColor: palette.gray.light3, borderRadius: '4px' }}>
            <Code language="json">
              {JSON.stringify(mongoDoc, null, 2)}
            </Code>
          </div>
        </div>
      </ExpandableCard>
    </div>
  );
};

export default ImageChunkViewer;
