/**
 * Image Result Card Component
 * Displays a single image search result with metadata and associated text chunks
 */
import React, { useState } from 'react';
import Card from '@leafygreen-ui/card';
import { Body } from '@leafygreen-ui/typography';
import Badge from '@leafygreen-ui/badge';
import Icon from '@leafygreen-ui/icon';
import Modal from '@leafygreen-ui/modal';
import ExpandableCard from '@leafygreen-ui/expandable-card';
import Code from '@leafygreen-ui/code';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import { ImageResult } from '@/types/Search';
import { getImageFileUrl } from '@/services/api';
import Link from 'next/link';
import { CARD_STYLES } from '@/lib/styleConstants';

interface ImageResultCardProps {
  result: ImageResult;
  rank: number;
}

function ImageResultCard({ result, rank }: ImageResultCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const imageUrl = getImageFileUrl(result.image_id);

  // Format embedding for display (show first 3, last 1 with ... in between)
  const formatEmbedding = (embedding?: number[]): string => {
    if (!embedding || embedding.length === 0) return '[]';
    if (embedding.length <= 4) {
      return `[${embedding.map(n => n.toFixed(3)).join(', ')}]`;
    }
    const first3 = embedding.slice(0, 3).map(n => n.toFixed(3));
    const last1 = embedding[embedding.length - 1].toFixed(3);
    return `[${first3.join(', ')}, ..., ${last1}]`;
  };

  // Build document object for display - show actual MongoDB document structure
  const buildDocumentView = () => {
    const doc: any = {
      _id: result.image_id,
      id: result.image_id,
      gridfs_file_id: result.gridfs_file_id
    };

    if (result.title) doc.title = result.title;
    if (result.description) doc.description = result.description;
    if (result.category) doc.category = result.category;
    if (result.languages && result.languages.length > 0) doc.languages = result.languages;
    if (result.breadcrumb_trail) doc.breadcrumb_trail = result.breadcrumb_trail;
    if (result.page_number !== undefined) doc.page_number = result.page_number;
    if (result.associated_chunks && result.associated_chunks.length > 0) {
      doc.associated_chunk_ids = result.associated_chunks.map(c => c.chunk_id);
    }

    // Add multimodal embedding with proper formatting
    // Show actual values if available, otherwise show placeholder
    if (result.multimodal_embedding && result.multimodal_embedding.length > 0) {
      doc.multimodal_embedding = formatEmbedding(result.multimodal_embedding) + ` // 1024 dimensions`;
    } else {
      doc.multimodal_embedding = "[0.120, -1.434, 0.892, ..., 0.432] // 1024 dimensions";
    }

    return doc;
  };

  return (
    <>
      <Card style={{ padding: 0, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Image Preview */}
        <div
          style={{
            width: '100%',
            height: '200px',
            backgroundColor: palette.gray.light3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
            cursor: 'pointer'
          }}
          onClick={() => setModalOpen(true)}
        >
          {!imageError ? (
            <img
              src={imageUrl}
              alt={result.title || result.caption || `Image ${rank}`}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
              onError={() => setImageError(true)}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: spacing[3] }}>
              <Icon glyph="Camera" size="large" fill={palette.gray.base} />
              <Body size="small" style={{ color: palette.gray.dark1, marginTop: spacing[2] }}>
                Image not available
              </Body>
            </div>
          )}

          {/* Rank Badge */}
          <div style={{
            position: 'absolute',
            top: spacing[2],
            left: spacing[2]
          }}>
            <Badge variant="lightgray">#{rank}</Badge>
          </div>

          {/* Score Badge */}
          <div style={{
            position: 'absolute',
            top: spacing[2],
            right: spacing[2]
          }}>
            <Badge variant="blue">
              {(result.score * 100).toFixed(1)}%
            </Badge>
          </div>

          {/* Expand Icon Overlay */}
          <div style={{
            position: 'absolute',
            bottom: spacing[2],
            right: spacing[2],
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            borderRadius: '50%',
            padding: spacing[1],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon glyph="FullScreenEnter" size="small" fill="white" />
          </div>
        </div>

        {/* Metadata Section */}
        <div style={{ padding: spacing[3], flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Title */}
          {result.title && (
            <Body weight="medium" style={{ marginBottom: spacing[2], fontSize: '16px' }}>
              {result.title}
            </Body>
          )}

          {/* Description */}
          {result.description && (
            <Body size="small" style={{
              marginBottom: spacing[2],
              color: palette.gray.dark2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {result.description}
            </Body>
          )}

          {/* Metadata Tags */}
          <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap', marginBottom: spacing[2] }}>
            {result.category && (
              <Badge variant="blue">{result.category}</Badge>
            )}

            {result.page_number && (
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                <Icon glyph="File" size="small" fill={palette.gray.dark1} />
                <Body size="small" style={{ color: palette.gray.dark1 }}>
                  Page {result.page_number}
                </Body>
              </div>
            )}

            {result.diagram_type && !result.category && (
              <Badge variant="darkgray">{result.diagram_type}</Badge>
            )}

            {result.languages && result.languages.length > 1 && (
              <Badge variant="lightgray">
                {result.languages.length} languages
              </Badge>
            )}
          </div>

          {/* Keywords */}
          {result.keywords && result.keywords.length > 0 && (
            <div style={{ marginBottom: spacing[2] }}>
              <Body size="xsmall" weight="medium" style={{ color: palette.gray.dark1, marginBottom: spacing[1] }}>
                Keywords:
              </Body>
              <div style={{ display: 'flex', gap: spacing[1], flexWrap: 'wrap' }}>
                {result.keywords.slice(0, 5).map((keyword, idx) => (
                  <Badge key={idx} variant="lightgray" style={{ fontSize: '11px' }}>
                    {keyword}
                  </Badge>
                ))}
                {result.keywords.length > 5 && (
                  <Badge variant="lightgray" style={{ fontSize: '11px' }}>
                    +{result.keywords.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Breadcrumb Trail */}
          {result.breadcrumb_trail && (
            <Body size="small" style={{
              color: palette.gray.dark1,
              marginBottom: spacing[2],
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {result.breadcrumb_trail}
            </Body>
          )}

          {/* Associated Chunks */}
          {result.associated_chunks && result.associated_chunks.length > 0 && (
            <div style={{ marginTop: 'auto' }}>
              <button
                onClick={() => setExpanded(!expanded)}
                style={{
                  width: '100%',
                  padding: `${spacing[2]}px ${spacing[3]}px`,
                  border: `1px solid ${palette.gray.light2}`,
                  borderRadius: '4px',
                  backgroundColor: expanded ? palette.blue.light3 : 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background-color 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                  <Icon glyph="InviteUser" size="small" fill={palette.blue.base} />
                  <Body size="small" weight="medium" style={{ color: palette.blue.base }}>
                    {result.associated_chunks.length} Associated Text Chunk{result.associated_chunks.length !== 1 ? 's' : ''}
                  </Body>
                </div>
                <Icon
                  glyph={expanded ? "ChevronUp" : "ChevronDown"}
                  size="small"
                  fill={palette.blue.base}
                />
              </button>

              {/* Expanded Chunks */}
              {expanded && (
                <div style={{
                  marginTop: spacing[2],
                  maxHeight: '300px',
                  overflowY: 'auto',
                  border: `1px solid ${palette.gray.light2}`,
                  borderRadius: '4px',
                  padding: spacing[2]
                }}>
                  {result.associated_chunks.map((chunk, idx) => (
                    <div
                      key={chunk.chunk_id || idx}
                      style={{
                        padding: spacing[2],
                        marginBottom: idx < result.associated_chunks!.length - 1 ? spacing[2] : 0,
                        backgroundColor: palette.gray.light3,
                        borderRadius: '4px'
                      }}
                    >
                      {chunk.breadcrumb_trail && (
                        <Body size="xsmall" style={{
                          color: palette.blue.base,
                          marginBottom: spacing[1],
                          fontWeight: 600
                        }}>
                          {chunk.breadcrumb_trail}
                        </Body>
                      )}
                      <Body size="small" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        color: palette.gray.dark3
                      }}>
                        {chunk.text}
                      </Body>
                      {chunk.chunk_id && (
                        <Link
                          href={`/chunk/${chunk.chunk_id}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: spacing[1],
                            marginTop: spacing[1],
                            color: palette.blue.base,
                            textDecoration: 'none',
                            fontSize: '12px'
                          }}
                        >
                          View full chunk
                          <Icon glyph="ArrowRight" size="small" fill={palette.blue.base} />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Fullscreen Modal */}
      <Modal
        open={modalOpen}
        setOpen={setModalOpen}
        size="large"
      >
        <div style={{ padding: spacing[4] }}>
          {/* Large Image */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: spacing[4],
            maxHeight: '60vh',
            overflow: 'auto'
          }}>
            {!imageError ? (
              <img
                src={imageUrl}
                alt={result.title || result.caption || `Image ${rank}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '60vh',
                  objectFit: 'contain'
                }}
                onError={() => setImageError(true)}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: spacing[5] }}>
                <Icon glyph="Camera" size="xlarge" fill={palette.gray.base} />
                <Body style={{ color: palette.gray.dark1, marginTop: spacing[3] }}>
                  Image not available
                </Body>
              </div>
            )}
          </div>

          {/* Title and Description */}
          {result.title && (
            <Body weight="medium" style={{ fontSize: '20px', marginBottom: spacing[2] }}>
              {result.title}
            </Body>
          )}
          {result.description && (
            <Body style={{ marginBottom: spacing[3], color: palette.gray.dark2 }}>
              {result.description}
            </Body>
          )}

          {/* MongoDB Document View */}
          <ExpandableCard
            title="View MongoDB Document"
            description="Complete document structure with metadata and embeddings"
            defaultOpen={false}
          >
            <div style={{ padding: spacing[3] }}>
              <Code language="json" copyable>
                {JSON.stringify(buildDocumentView(), null, 2)}
              </Code>
              <Body size="small" style={{ marginTop: spacing[2], color: palette.gray.dark1 }}>
                <strong>Note:</strong> Multimodal embedding shown as truncated ({formatEmbedding([]).replace('[]', '[first 3 values, ..., last value]')})
              </Body>
            </div>
          </ExpandableCard>
        </div>
      </Modal>
    </>
  );
}



export default ImageResultCard;
