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
            <>Found {response.total_images} image{response.total_images !== 1 ? 's' : ''} for &quot;{response.query_text}&quot; using MongoDB Atlas multimodal search</>
          ) : (
            <>Found {response.total_images} image{response.total_images !== 1 ? 's' : ''} using MongoDB Atlas multimodal search</>
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

        {/* Show the actual query text prominently if available */}
        {response.query_text && (
          <div style={{
            marginTop: spacing[2],
            padding: spacing[2],
            backgroundColor: palette.blue.light3,
            borderRadius: '4px',
            borderLeft: `3px solid ${palette.blue.base}`
          }}>
            <Body size="small" style={{ color: palette.gray.dark1, marginBottom: spacing[1] }}>
              Query:
            </Body>
            <Body weight="medium" style={{ color: palette.blue.dark2 }}>
              {response.query_text}
            </Body>
          </div>
        )}
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
