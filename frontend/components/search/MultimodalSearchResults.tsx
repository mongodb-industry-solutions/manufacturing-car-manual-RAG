/**
 * Multimodal Search Results Component
 * Displays image results in a grid layout
 */
import React from 'react';
import { Body } from '@leafygreen-ui/typography';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import Badge from '@leafygreen-ui/badge';
import Icon from '@leafygreen-ui/icon';
import ExpandableCard from '@leafygreen-ui/expandable-card';
import Code from '@leafygreen-ui/code';
import Tooltip from '@leafygreen-ui/tooltip';
import { MultimodalSearchResponse } from '@/types/Search';
import ImageResultCard from './ImageResultCard';

interface MultimodalSearchResultsProps {
  response: MultimodalSearchResponse;
}

function MultimodalSearchResults({ response }: MultimodalSearchResultsProps) {
  const hasImageResults = response.image_results && response.image_results.length > 0;

  return (
    <div>
      {/* Query Summary Card - matching other search methods */}
      <div style={{
        padding: spacing[3],
        backgroundColor: 'white',
        borderRadius: '8px',
        marginBottom: spacing[3],
        border: `1px solid ${palette.gray.light2}`,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
      }}>
        <Body weight="medium" style={{ fontSize: '16px', marginBottom: spacing[1] }}>
          {response.query_text ? (
            <>Found {response.total_images} image{response.total_images !== 1 ? 's' : ''} for &quot;{response.query_text}&quot; using MongoDB Atlas Multimodal Search</>
          ) : (
            <>Found {response.total_images} image{response.total_images !== 1 ? 's' : ''} using MongoDB Atlas Multimodal Search</>
          )}
        </Body>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginTop: spacing[2] }}>
          <Badge variant={response.query_type === 'text' ? 'blue' : 'green'}>
            {response.query_type === 'text' ? 'Text Query' : 'Image Query'}
          </Badge>
          <Badge variant="lightgray">
            Voyage AI Multimodal Embeddings
          </Badge>
        </div>
      </div>

      {/* MongoDB Aggregation Pipeline - Expandable Card */}
      <div style={{ marginBottom: spacing[3] }}>
        <ExpandableCard
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
              <Icon glyph="Camera" size="small" fill={palette.yellow.dark2} />
              <span>MongoDB Multimodal Vector Search Query</span>
            </div>
          }
          description="Uses MongoDB Atlas Vector Search with Voyage AI multimodal embeddings to find semantically similar images"
          defaultOpen={false}
          style={{
            border: `1px solid ${palette.yellow.dark2}`,
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div style={{ marginBottom: spacing[3] }}>
            <div style={{ display: 'flex', gap: spacing[2], marginBottom: spacing[3], flexWrap: 'wrap' }}>
              <Tooltip
                trigger={
                  <Badge variant="green">Atlas Vector Search</Badge>
                }
                triggerEvent="hover"
              >
                MongoDB Atlas Vector Search for multimodal image retrieval
              </Tooltip>
              
              <Tooltip
                trigger={
                  <Badge variant="lightgray">Voyage AI Multimodal</Badge>
                }
                triggerEvent="hover"
              >
                Voyage AI multimodal embeddings for unified text-image search
              </Tooltip>
            </div>
            
            <div style={{ backgroundColor: palette.gray.light3, padding: spacing[2], borderRadius: '4px' }}>
              <Code language="javascript">
                {`db.images.aggregate([
  {
    $vectorSearch: {
      index: "multimodal_vector_index",
      path: "multimodal_embedding",
      queryVector: [0.123, 0.456, 0.789, ...], // ${response.query_type === 'text' ? `Voyage AI Multimodal Embedding for "${response.query_text}"` : 'Voyage AI Multimodal Image Embedding'}
      numCandidates: ${response.total_images * 10}, // limit * num_candidates_multiplier
      limit: ${response.total_images}
    }
  },
  {
    $project: {
      _id: 0,
      score: { $meta: "vectorSearchScore" },
      image_id: "$id",
      gridfs_file_id: "$gridfs_file_id",
      
      // Rich metadata fields
      title: 1,
      description: 1,
      keywords: 1,
      languages: 1,
      category: 1,
      
      // Additional fields
      page_number: { $arrayElemAt: ["$page_numbers", 0] },
      breadcrumb_trail: 1,
      associated_chunk_ids: 1
    }
  }
])`}
              </Code>
            </div>
            
            <div style={{ 
              marginTop: spacing[3],
              padding: spacing[2],
              backgroundColor: 'white',
              borderLeft: `4px solid ${palette.yellow.dark2}`,
              borderRadius: '4px'
            }}>
              <Body size="small">
                <strong>How it works:</strong> Multimodal vector search uses Voyage AI&apos;s multimodal embeddings to convert both text and images into a unified vector space. This enables semantic search across images using either text descriptions or image similarity, finding visually and conceptually related diagrams in the car manual.
              </Body>
            </div>
          </div>
        </ExpandableCard>
      </div>

      {/* Header with counts */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing[3],
        flexWrap: 'wrap',
        gap: spacing[2]
      }}>
        <Body weight="medium" style={{ fontSize: '14px', color: palette.gray.dark2 }}>
          Showing {response.total_images} image result{response.total_images !== 1 ? 's' : ''}
        </Body>
      </div>

      {/* Image Results Grid */}
      {hasImageResults ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: spacing[4]
        }}>
          {response.image_results.map((result, idx) => (
            <ImageResultCard
              key={result.image_id}
              result={result}
              rank={idx + 1}
            />
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: spacing[5],
          backgroundColor: palette.gray.light3,
          borderRadius: '8px'
        }}>
          <Icon glyph="Camera" size="xlarge" fill={palette.gray.base} />
          <Body style={{ marginTop: spacing[3], color: palette.gray.dark1 }}>
            No images found
          </Body>
          <Body size="small" style={{ marginTop: spacing[1], color: palette.gray.dark1 }}>
            Try a different query or image
          </Body>
        </div>
      )}
    </div>
  );
}

export default MultimodalSearchResults;
