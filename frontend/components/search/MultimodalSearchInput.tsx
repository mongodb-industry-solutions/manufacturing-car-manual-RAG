/**
 * Multimodal Search Input Component
 * Supports both text and image queries for multimodal search
 */
import React, { useState, useRef, useEffect } from 'react';
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
  onSearch: (params: { query_type: 'text' | 'image'; query_text?: string; image_base64?: string }) => void;
  isLoading: boolean;
  initialTextQuery?: string; // External value to sync with (like SearchInput)
}

// Sample images - update these IDs after ingesting actual images
const SAMPLE_IMAGES = [
  { id: "image_engine_diagram_page_42", label: "Engine Diagram" },
  { id: "image_electrical_system_page_85", label: "Electrical System" },
  { id: "image_brake_assembly_page_112", label: "Brake Assembly" },
  { id: "image_suspension_page_134", label: "Suspension" },
  { id: "image_transmission_page_98", label: "Transmission" }
];

function MultimodalSearchInput({ onSearch, isLoading, initialTextQuery = '' }: MultimodalSearchInputProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [textQuery, setTextQuery] = useState(initialTextQuery);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update internal state when initialTextQuery prop changes (same pattern as SearchInput)
  useEffect(() => {
    setTextQuery(initialTextQuery);
  }, [initialTextQuery]);

  // Convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove the data:image/jpeg;base64, prefix
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      
      setSelectedFile(file);
      setSelectedSampleId(null);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileChange({ target: { files: [file] } } as any);
    }
  };

  // Handle sample image selection
  const handleSampleSelect = async (imageId: string) => {
    setSelectedSampleId(imageId);
    setSelectedFile(null);
    
    // Fetch image from backend to set preview
    const imageUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/images/${imageId}/file`;
    setPreviewUrl(imageUrl);
  };

  // Handle search submission
  const handleSearch = async () => {
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
      if (selectedFile) {
        // Upload file
        try {
          const base64 = await fileToBase64(selectedFile);
          onSearch({
            query_type: 'image',
            image_base64: base64
          });
        } catch (error) {
          console.error('Error converting image:', error);
          alert('Failed to process image');
        }
      } else if (selectedSampleId) {
        // Use sample image - fetch and convert to base64
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/images/${selectedSampleId}/file`);
          const blob = await response.blob();
          const file = new File([blob], 'sample.jpg', { type: 'image/jpeg' });
          const base64 = await fileToBase64(file);
          onSearch({
            query_type: 'image',
            image_base64: base64
          });
        } catch (error) {
          console.error('Error fetching sample image:', error);
          alert('Failed to load sample image');
        }
      } else {
        alert('Please select or upload an image');
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
          <div style={{ marginBottom: spacing[3] }}>
            <TextInput
              label="Search Query"
              placeholder="e.g., dashboard symbols, climate control..."
              value={textQuery}
              onChange={(e) => setTextQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              disabled={isLoading}
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
            Upload an image or select from samples to find similar images
          </Body>

          {/* File Upload Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragActive ? palette.blue.base : palette.gray.light2}`,
              borderRadius: '8px',
              padding: spacing[4],
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: dragActive ? palette.blue.light3 : palette.gray.light3,
              marginBottom: spacing[3]
            }}
          >
            <Icon glyph="CloudUpload" size="large" fill={palette.gray.base} />
            <Body style={{ marginTop: spacing[2] }}>
              Drag & drop an image here, or click to browse
            </Body>
            <Body size="small" style={{ color: palette.gray.dark1 }}>
              JPG, PNG, JPEG (Max 5MB)
            </Body>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

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
              Or select a sample image:
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
                    src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/images/${sample.id}/file`}
                    alt={sample.label}
                    style={{
                      width: '100%',
                      height: '80px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      marginBottom: spacing[1]
                    }}
                    onError={(e) => {
                      // Fallback for missing images
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
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
            disabled={isLoading || (!selectedFile && !selectedSampleId)}
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
