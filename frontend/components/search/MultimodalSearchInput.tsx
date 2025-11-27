/**
 * Multimodal Search Input Component
 * Supports both text and image queries for multimodal search
 */
import React, { useState, useEffect } from 'react';
import TextInput from '@leafygreen-ui/text-input';
import Card from '@leafygreen-ui/card';
import { Body } from '@leafygreen-ui/typography';
import Button from '@leafygreen-ui/button';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import Icon from '@leafygreen-ui/icon';
import Badge from '@leafygreen-ui/badge';
import { CARD_STYLES } from '@/lib/styleConstants';

interface MultimodalSearchInputProps {
  onSearch: (params: { query_type: 'text' | 'image'; query_text?: string; sample_image_id?: string }) => void;
  isLoading: boolean;
  initialTextQuery?: string; // External value to sync with (like SearchInput)
}

// Sample images - stored in public folder
// Add your images to frontend/public/ and they'll automatically show up here
const SAMPLE_IMAGES = [
  { id: "sample-battery-image.png", label: "Battery" },
  { id: "sample-climatecontrol-image.png", label: "Climate Control" },
  { id: "sample-fusebox-image.png", label: "Fuse Box" },
  { id: "sample-instrumentcluster-image.png", label: "Instrument Cluster" }
];

function MultimodalSearchInput({ onSearch, isLoading, initialTextQuery = '' }: MultimodalSearchInputProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [textQuery, setTextQuery] = useState(initialTextQuery);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Update internal state when initialTextQuery prop changes (same pattern as SearchInput)
  useEffect(() => {
    setTextQuery(initialTextQuery);
  }, [initialTextQuery]);

  // Handle sample image selection
  const handleSampleSelect = (imageId: string) => {
    setSelectedSampleId(imageId);
    
    // Use image from public folder
    const imageUrl = `/${imageId}`;
    setPreviewUrl(imageUrl);
  };

  // Handle search submission
  const handleSearch = () => {
    if (activeTab === 'text') {
      if (!textQuery.trim()) {
        alert('Please enter a search query');
        return;
      }
      onSearch({
        query_type: 'text',
        query_text: textQuery
      });
    } else {
      if (selectedSampleId) {
        // Send sample image ID directly
        onSearch({
          query_type: 'image',
          sample_image_id: selectedSampleId
        });
      } else {
        alert('Please select a sample image');
      }
    }
  };

  return (
    <Card style={{ padding: spacing[4], marginBottom: spacing[3] }}>
      {/* Tab Selector */}
      <div style={{ marginBottom: spacing[3] }}>
        <div style={{ display: 'flex', gap: spacing[2], borderBottom: `2px solid ${palette.gray.light2}` }}>
          <button
            onClick={() => setActiveTab('text')}
            style={{
              padding: `${spacing[2]}px ${spacing[3]}px`,
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'text' ? `3px solid ${palette.blue.base}` : 'none',
              color: activeTab === 'text' ? palette.blue.base : palette.gray.dark1,
              fontWeight: activeTab === 'text' ? 600 : 400,
              cursor: 'pointer',
              marginBottom: '-2px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: spacing[1]
            }}
          >
            <Icon glyph="Edit" size="small" />
            <span>Text Query</span>
          </button>
          <button
            onClick={() => setActiveTab('image')}
            style={{
              padding: `${spacing[2]}px ${spacing[3]}px`,
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'image' ? `3px solid ${palette.blue.base}` : 'none',
              color: activeTab === 'image' ? palette.blue.base : palette.gray.dark1,
              fontWeight: activeTab === 'image' ? 600 : 400,
              cursor: 'pointer',
              marginBottom: '-2px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: spacing[1]
            }}
          >
            <Icon glyph="Camera" size="small" />
            <span>Image Query</span>
          </button>
        </div>
      </div>

      {/* Text Query Tab */}
      {activeTab === 'text' && (
        <div>
          <Body size="small" style={{ marginBottom: spacing[2], color: palette.gray.dark1 }}>
            Enter text to find related images
          </Body>
          <div style={{ marginBottom: spacing[3], width: '98%', maxWidth: '100%', boxSizing: 'border-box' }}>
            <TextInput
              label="Search Query"
              placeholder="e.g., dashboard symbols, climate control..."
              value={textQuery}
              onChange={(e) => setTextQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              disabled={isLoading}
              style={{ width: '100%', maxWidth: '95%', boxSizing: 'border-box' }}
            />
          </div>
          <Button
            variant="primary"
            onClick={handleSearch}
            disabled={isLoading || !textQuery.trim()}
            style={{ width: '100%' }}
          >
            {isLoading ? 'Searching...' : 'Search Images'}
          </Button>
        </div>
      )}

      {/* Image Query Tab */}
      {activeTab === 'image' && (
        <div>
          <Body size="small" style={{ marginBottom: spacing[2], color: palette.gray.dark1 }}>
            Select a sample image to find similar images
          </Body>

          {/* Preview */}
          {previewUrl && (
            <div style={{ marginBottom: spacing[3] }}>
              <Body weight="medium" style={{ marginBottom: spacing[2] }}>Preview:</Body>
              <img
                src={previewUrl}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '300px',
                  objectFit: 'contain',
                  border: `1px solid ${palette.gray.light2}`,
                  borderRadius: '4px'
                }}
              />
            </div>
          )}

          {/* Sample Images */}
          <div style={{ marginBottom: spacing[3] }}>
            <Body weight="medium" style={{ marginBottom: spacing[2] }}>
              Select a sample image:
            </Body>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: spacing[2] }}>
              {SAMPLE_IMAGES.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => handleSampleSelect(sample.id)}
                  style={{
                    border: `2px solid ${selectedSampleId === sample.id ? palette.blue.base : palette.gray.light2}`,
                    borderRadius: '8px',
                    padding: spacing[2],
                    cursor: 'pointer',
                    textAlign: 'center',
                    backgroundColor: selectedSampleId === sample.id ? palette.blue.light3 : 'white'
                  }}
                >
                  <img
                    src={`/${sample.id}`}
                    alt={sample.label}
                    style={{
                      width: '100%',
                      height: '80px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      marginBottom: spacing[1]
                    }}
                    onError={(e) => {
                      // Fallback for missing images in public folder
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="12"%3EAdd to /public%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  <Body size="xsmall">{sample.label}</Body>
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="primary"
            onClick={handleSearch}
            disabled={isLoading || !selectedSampleId}
            style={{ width: '100%', marginTop: spacing[2] }}
          >
            {isLoading ? 'Searching...' : 'Search Similar Images'}
          </Button>
        </div>
      )}
    </Card>
  );
}

export default MultimodalSearchInput;
