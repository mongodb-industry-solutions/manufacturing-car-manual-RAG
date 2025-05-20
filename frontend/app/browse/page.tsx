'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { MyH1 as H1, MyH2 as H2, MyH3 as H3, MyBody as Body, MySubtitle as Subtitle } from '@/components/ui/TypographyWrapper';
import { MyCard as Card } from '@/components/ui/TypographyWrapper';
import { spacing } from '@leafygreen-ui/tokens';
import { MyButton as Button } from '@/components/ui/TypographyWrapper';
import Icon from '@leafygreen-ui/icon';
import { palette } from '@leafygreen-ui/palette';
import Badge from '@leafygreen-ui/badge';
import TextInput from '@leafygreen-ui/text-input';

// No longer needed as we're using infinite scroll instead of pagination

const MainLayout = dynamic(() => import('@/components/layout/MainLayout'));
const LoadingState = dynamic(() => import('@/components/common/LoadingState'));
const ErrorState = dynamic(() => import('@/components/common/ErrorState'));
const MongoDBFilterVisualization = dynamic(() => import('@/components/content/MongoDBFilterVisualization'));

import { useChunks } from '@/hooks/useChunks';
import { Chunk } from '@/types/Chunk';

// Chip component for filtering
const FilterChip = ({ label, selected, onClick }) => (
  <div 
    style={{ 
      display: 'inline-flex',
      alignItems: 'center',
      padding: `${spacing[1]}px ${spacing[2]}px`,
      borderRadius: '16px',
      backgroundColor: selected ? palette.green.light2 : palette.gray.light2,
      color: selected ? palette.green.dark2 : palette.gray.dark2,
      cursor: 'pointer',
      marginRight: spacing[2],
      marginBottom: spacing[2],
      border: selected ? `1px solid ${palette.green.base}` : '1px solid transparent'
    }}
    onClick={onClick}
  >
    {label}
    {selected && <Icon glyph="X" size="small" style={{ marginLeft: spacing[1] }} />}
  </div>
);

export default function BrowsePage() {
  const router = useRouter();
  const { getChunks, chunks, loading, error, clearCache } = useChunks();
  
  // Infinite scroll state
  const [displayLimit, setDisplayLimit] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  // Scroll observer reference
  const observerTarget = React.useRef(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    contentType: [],
    vehicleSystems: [],
    hasSafetyNotices: false,
    hasProcedures: false
  });
  
  const [textFilter, setTextFilter] = useState('');
  const [availableFilters, setAvailableFilters] = useState({
    contentTypes: [],
    vehicleSystems: []
  });
  
  // Fetch chunks on initial load
  useEffect(() => {
    const fetchChunks = async () => {
      try {
        console.log('Fetching initial chunks...');
        const result = await getChunks(0, 100); // Get first 100 chunks
        console.log(`Successfully fetched ${result.chunks.length} chunks out of ${result.total} total`);
        
        // Debug: Log the first chunk to see its structure
        if (result.chunks && result.chunks.length > 0) {
          console.log('Sample chunk structure:', JSON.stringify(result.chunks[0], null, 2));
        }
      } catch (err) {
        console.error('Failed to fetch chunks:', err);
      }
    };
    
    fetchChunks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remove getChunks from dependencies to prevent infinite loops
  
  // Extract available filters from chunks
  useEffect(() => {
    if (chunks && chunks.chunks) {
      const contentTypes = new Set();
      const vehicleSystems = new Set();
      
      chunks.chunks.forEach(chunk => {
        // Extract content_type from the array
        if (chunk.content_type && Array.isArray(chunk.content_type)) {
          chunk.content_type.forEach(type => contentTypes.add(type));
        }
        
        // Extract vehicle_systems from the array or metadata.systems if present
        if (chunk.vehicle_systems && Array.isArray(chunk.vehicle_systems)) {
          chunk.vehicle_systems.forEach(system => vehicleSystems.add(system));
        }
        // Also check metadata.systems as an alternative source
        if (chunk.metadata && chunk.metadata.systems && Array.isArray(chunk.metadata.systems)) {
          chunk.metadata.systems.forEach(system => vehicleSystems.add(system));
        }
      });
      
      // Log the found filter values for debugging
      console.log('Found content types:', Array.from(contentTypes));
      console.log('Found vehicle systems:', Array.from(vehicleSystems));
      
      setAvailableFilters({
        contentTypes: Array.from(contentTypes),
        vehicleSystems: Array.from(vehicleSystems)
      });
    }
  }, [chunks]);
  
  // Helper to check if chunk matches text filter
  const chunkMatchesText = (chunk: Chunk, text: string): boolean => {
    const lowerText = text.toLowerCase();
    
    // Check in text content
    if (chunk.text.toLowerCase().includes(lowerText)) {
      console.debug(`Text match found in chunk text: "${chunk.id}"`);
      return true;
    }
    
    // Check in headings
    if (chunk.heading_level_1 && chunk.heading_level_1.toLowerCase().includes(lowerText)) {
      console.debug(`Text match found in heading_level_1: "${chunk.id}"`);
      return true;
    }
    if (chunk.heading_level_2 && chunk.heading_level_2.toLowerCase().includes(lowerText)) {
      console.debug(`Text match found in heading_level_2: "${chunk.id}"`);
      return true;
    }
    if (chunk.heading_level_3 && chunk.heading_level_3.toLowerCase().includes(lowerText)) {
      console.debug(`Text match found in heading_level_3: "${chunk.id}"`);
      return true;
    }
    
    return false;
  };
  
  // Filter chunks based on current filters
  const filteredChunks = React.useMemo(() => {
    if (!chunks || !chunks.chunks) return [];
    
    console.log(`Filtering ${chunks.chunks.length} chunks with filters:`, 
      JSON.stringify({...filters, textFilter}, null, 2));
    
    const filtered = chunks.chunks.filter(chunk => {
      // For debugging specific chunks
      const isDebugging = false; // Set to true and specify chunk ID for detailed debugging
      const debugChunkId = 'chunk_00001';
      const isDebugChunk = isDebugging && chunk.id === debugChunkId;
      
      if (isDebugChunk) {
        console.log(`Debugging chunk ${chunk.id}:`, chunk);
      }
      
      // Text filter
      if (textFilter && !chunkMatchesText(chunk, textFilter)) {
        if (isDebugChunk) console.log(`${chunk.id} failed text filter`);
        return false;
      }
      
      // Content type filter
      if (filters.contentType.length > 0) {
        if (!chunk.content_type || !Array.isArray(chunk.content_type) || 
            !chunk.content_type.some(type => filters.contentType.includes(type))) {
          if (isDebugChunk) {
            console.log(`${chunk.id} failed content_type filter`);
            console.log(`  - chunk.content_type:`, chunk.content_type);
            console.log(`  - filters.contentType:`, filters.contentType);
          }
          return false;
        } else if (isDebugChunk) {
          console.log(`${chunk.id} passed content_type filter`);
          console.log(`  - chunk.content_type:`, chunk.content_type);
          console.log(`  - filters.contentType:`, filters.contentType);
        }
      }
      
      // Vehicle systems filter - check both vehicle_systems array and metadata.systems
      if (filters.vehicleSystems.length > 0) {
        const directMatch = chunk.vehicle_systems && Array.isArray(chunk.vehicle_systems) && 
          chunk.vehicle_systems.some(system => filters.vehicleSystems.includes(system));
          
        const metadataMatch = chunk.metadata && chunk.metadata.systems && Array.isArray(chunk.metadata.systems) &&
          chunk.metadata.systems.some(system => filters.vehicleSystems.includes(system));
          
        const hasMatchingSystem = directMatch || metadataMatch;
        
        if (isDebugChunk) {
          console.log(`${chunk.id} vehicle_systems filter check:`);
          console.log(`  - chunk.vehicle_systems:`, chunk.vehicle_systems);
          console.log(`  - chunk.metadata?.systems:`, chunk.metadata?.systems);
          console.log(`  - filters.vehicleSystems:`, filters.vehicleSystems);
          console.log(`  - directMatch:`, directMatch);
          console.log(`  - metadataMatch:`, metadataMatch);
          console.log(`  - hasMatchingSystem:`, hasMatchingSystem);
        }
        
        if (!hasMatchingSystem) {
          if (isDebugChunk) console.log(`${chunk.id} failed vehicle_systems filter`);
          return false;
        } else if (isDebugChunk) {
          console.log(`${chunk.id} passed vehicle_systems filter`);
        }
      }
      
      // Safety notices filter - check all safety indicators
      if (filters.hasSafetyNotices) {
        // Check for safety notices in the content
        const hasExplicitSafetyNotices = 
          chunk.safety_notices && 
          Array.isArray(chunk.safety_notices) && 
          chunk.safety_notices.length > 0;
        
        // Check for safety flag in metadata
        const hasSafetyMetadata = 
          chunk.metadata && 
          chunk.metadata.has_safety === true;
        
        // Check for safety notices in text (warning symbols)
        const hasWarningSymbols = 
          chunk.text && 
          (chunk.text.includes('⚠️') || 
           chunk.text.toLowerCase().includes('warning') || 
           chunk.text.toLowerCase().includes('caution'));
        
        // Check if content_type includes 'safety'
        const hasSafetyContentType = 
          chunk.content_type && 
          Array.isArray(chunk.content_type) && 
          chunk.content_type.includes('safety');
          
        const hasSafety = hasExplicitSafetyNotices || hasSafetyMetadata || hasWarningSymbols || hasSafetyContentType;
        
        if (isDebugChunk) {
          console.log(`${chunk.id} safety filter check:`);
          console.log(`  - hasExplicitSafetyNotices:`, hasExplicitSafetyNotices);
          console.log(`  - hasSafetyMetadata:`, hasSafetyMetadata);
          console.log(`  - hasWarningSymbols:`, hasWarningSymbols);
          console.log(`  - hasSafetyContentType:`, hasSafetyContentType);
          console.log(`  - overall hasSafety:`, hasSafety);
        }
        
        if (!hasSafety) {
          if (isDebugChunk) console.log(`${chunk.id} failed safety filter`);
          return false;
        } else if (isDebugChunk) {
          console.log(`${chunk.id} passed safety filter`);
        }
      }
      
      // Procedures filter - check for procedural steps and procedural content type
      if (filters.hasProcedures) {
        // Check for explicit procedural steps
        const hasProceduralSteps = 
          chunk.procedural_steps && 
          Array.isArray(chunk.procedural_steps) && 
          chunk.procedural_steps.length > 0;
        
        // Check if content_type includes 'procedure'
        const hasProceduralContentType = 
          chunk.content_type && 
          Array.isArray(chunk.content_type) && 
          chunk.content_type.some(type => 
            type === 'procedure' || 
            type === 'procedural' || 
            type.includes('step')
          );
        
        // Check for numbered steps in the text
        const hasNumberedSteps = 
          chunk.text && 
          (chunk.text.match(/\d+\.\s+[A-Z]/) || // Matches patterns like "1. Do something"
           chunk.text.match(/Step\s+\d+/i));     // Matches patterns like "Step 1"
           
        const hasProcedures = hasProceduralSteps || hasProceduralContentType || hasNumberedSteps;
        
        if (isDebugChunk) {
          console.log(`${chunk.id} procedures filter check:`);
          console.log(`  - hasProceduralSteps:`, hasProceduralSteps);
          console.log(`  - hasProceduralContentType:`, hasProceduralContentType);
          console.log(`  - hasNumberedSteps:`, hasNumberedSteps);
          console.log(`  - overall hasProcedures:`, hasProcedures);
          
          if (hasNumberedSteps && chunk.text) {
            console.log(`  - Matched pattern in text:`, 
              chunk.text.match(/\d+\.\s+[A-Z]/) || chunk.text.match(/Step\s+\d+/i));
          }
        }
        
        if (!hasProcedures) {
          if (isDebugChunk) console.log(`${chunk.id} failed procedures filter`);
          return false;
        } else if (isDebugChunk) {
          console.log(`${chunk.id} passed procedures filter`);
        }
      }
      
      return true;
    });
    
    console.log(`Filtering complete. Found ${filtered.length} matching chunks out of ${chunks.chunks.length} total`);
    
    // If we have very few matches, log them to help with debugging
    if (filtered.length > 0 && filtered.length < 5) {
      console.log('Matching chunks:', filtered.map(chunk => ({
        id: chunk.id,
        content_type: chunk.content_type,
        vehicle_systems: chunk.vehicle_systems,
        metadata: chunk.metadata
      })));
    }
    
    return filtered;
  }, [chunks, filters, textFilter]);
  
  // Toggle filter value
  const toggleFilter = (type, value) => {
    // Reset to page 1 whenever filters change
    setCurrentPage(1);
    setPaginationKey(prev => prev + 1);
    
    console.log(`Toggling filter: ${type}${value ? ` (${value})` : ''}`);
    
    setFilters(prev => {
      let newFilters;
      
      if (type === 'contentType' || type === 'vehicleSystems') {
        const index = prev[type].indexOf(value);
        if (index === -1) {
          // Adding value to filter
          newFilters = { ...prev, [type]: [...prev[type], value] };
          console.log(`Added ${value} to ${type} filter`);
        } else {
          // Removing value from filter
          newFilters = { ...prev, [type]: prev[type].filter(item => item !== value) };
          console.log(`Removed ${value} from ${type} filter`);
        }
      } else {
        // Toggling boolean filter
        newFilters = { ...prev, [type]: !prev[type] };
        console.log(`Toggled ${type} filter to ${!prev[type]}`);
      }
      
      // Log new filter state
      console.log('New filter state:', newFilters);
      return newFilters;
    });
  };
  
  // Function to load more items - defined BEFORE the useEffect that uses it
  const loadMoreItems = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    console.log(`Loading more chunks, current limit: ${displayLimit}`);
    
    // Simulate a small delay for smoother UX
    setTimeout(() => {
      setDisplayLimit(prev => prev + 20);
      setIsLoadingMore(false);
      
      // Check if we've shown all items
      if (displayLimit + 20 >= filteredChunks.length) {
        setHasMore(false);
      }
    }, 500);
  }, [displayLimit, filteredChunks.length, hasMore, isLoadingMore]);
  
  // Setup intersection observer for infinite scroll
  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;
    
    // If we don't have chunks yet or we're already at the end, don't observe
    if (!filteredChunks || !hasMore) return;
    
    const observer = new IntersectionObserver(
      entries => {
        // If the target element is intersecting (visible)
        if (entries[0].isIntersecting && !isLoadingMore) {
          console.log("Loading more chunks...");
          loadMoreItems();
        }
      },
      { threshold: 0.1 } // Trigger when 10% of the element is visible
    );
    
    // Start observing the target element
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    
    // Cleanup on unmount
    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [filteredChunks, hasMore, isLoadingMore, loadMoreItems]);
  
  // Reset display limit and hasMore when filters change
  useEffect(() => {
    setDisplayLimit(20);
    setHasMore(true);
  }, [filters, textFilter]);
  
  // Get current items to display based on displayLimit
  const currentItems = filteredChunks.slice(0, displayLimit);
  
  // Get chunk title
  const getChunkTitle = (chunk: Chunk): string => {
    if (chunk.heading_level_1) return chunk.heading_level_1;
    if (chunk.heading_level_2) return chunk.heading_level_2;
    if (chunk.heading_level_3) return chunk.heading_level_3;
    if (chunk.context) return chunk.context;
    
    // Handle case where id might not be available
    const displayId = chunk.id || 
      (chunk._id ? (typeof chunk._id === 'string' ? chunk._id : chunk._id.$oid) : 'Unknown ID');
    
    return `${displayId.substring(0, 15)}...`;
  };
  
  // Handle chunk click to view details
  const handleChunkClick = (chunk: Chunk) => {
    // Get the proper ID to use for navigation
    const chunkId = chunk.id || 
      (chunk._id ? (typeof chunk._id === 'string' ? chunk._id : chunk._id.$oid) : null);
    
    if (chunkId) {
      // Add source=browse parameter to track that we're coming from the browse page
      console.log("Navigating to chunk with source=browse parameter");
      
      // Also save to sessionStorage directly in case URL parameters are lost
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('car_manual_previous_search_url', '/browse');
        sessionStorage.setItem('car_manual_referrer_type', 'browse');
      }
      
      router.push(`/chunk/${chunkId}?source=browse`);
    } else {
      console.error('Could not determine chunk ID for navigation');
    }
  };
  
  // Handle direct PDF page view
  const handleViewPdf = (chunk: Chunk, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the card click from triggering
    
    if (chunk.page_numbers && chunk.page_numbers.length > 0) {
      // Get the chunk ID
      const chunkId = chunk.id || 
        (chunk._id ? (typeof chunk._id === 'string' ? chunk._id : chunk._id.$oid) : null);
      
      if (chunkId) {
        console.log("Navigating to PDF view with source=browse parameter");
        
        // Also save to sessionStorage directly in case URL parameters are lost
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('car_manual_previous_search_url', '/browse');
          sessionStorage.setItem('car_manual_referrer_type', 'browse');
        }
        
        router.push(`/chunk/${chunkId}?source=browse&open_pdf=true`);
      }
    }
  };
  
  // Render loading state
  if (loading && !chunks) {
    return (
      <MainLayout>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing[3] }}>
          <LoadingState message="Loading chunks from the car manual..." />
        </div>
      </MainLayout>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <MainLayout>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing[3] }}>
          <ErrorState
            title="Error Loading Chunks"
            message={`We couldn't load the chunks: ${error}`}
            onRetry={() => router.push('/')}
            details="Please try again later or return to the home page."
          />
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing[3] }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          marginBottom: spacing[3]
        }}>
          <div style={{ display: 'flex', gap: spacing[2] }}>
            <Button
              variant="primaryOutline"
              onClick={() => {
                clearCache();
                if (typeof window !== 'undefined') {
                  window.location.reload();
                }
              }}
              leftGlyph={<Icon glyph="Refresh" />}
            >
              Refresh Cache
            </Button>
            <Button
              variant="default"
              onClick={() => router.push('/')}
              leftGlyph={<Icon glyph="Home" />}
            >
              Home
            </Button>
          </div>
        </div>
        
        <Card style={{ padding: spacing[3], marginBottom: spacing[3] }}>
          <div style={{ marginBottom: spacing[3] }}>
            <H3 style={{ marginBottom: spacing[2], color: palette.green.dark2 }}>
              <Icon glyph="Document" fill={palette.green.dark1} style={{ marginRight: spacing[1] }} /> 
              MongoDB Document Collection
            </H3>
            <Body style={{ marginBottom: spacing[2] }}>
              This page displays car manual chunks stored as MongoDB documents. Each chunk is a document in the MongoDB collection, 
              representing a semantically meaningful section of content that balances size, context, and coherence.
            </Body>
            <div style={{ 
              backgroundColor: palette.green.light3, 
              padding: spacing[2], 
              borderRadius: '4px',
              marginBottom: spacing[2],
              borderLeft: `4px solid ${palette.green.base}`
            }}>
              <Body size="small" style={{ color: palette.green.dark2 }}>
                <strong>MongoDB Advantage:</strong> MongoDB's flexible document model is perfect for storing semi-structured 
                content like these chunks, with varying fields, nested arrays, and different content types - all without 
                requiring complex table joins or schema migrations.
              </Body>
            </div>
          </div>
          
          <div style={{ marginBottom: spacing[4], width: '95%', paddingBottom: spacing[2] }}>
            <div style={{ marginBottom: spacing[1] }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                <Icon glyph="MagnifyingGlass" size="small" fill={palette.green.base} />
                <span style={{ fontWeight: 'bold', color: palette.green.dark2 }}>MongoDB Text Search</span>
                <div style={{ 
                  fontSize: '12px', 
                  marginLeft: spacing[1], 
                  padding: `0 ${spacing[1]}px`, 
                  backgroundColor: palette.green.light3, 
                  borderRadius: '4px', 
                  color: palette.green.dark2 
                }}>
                  $regex operator
                </div>
              </div>
            </div>
            <TextInput
              label="Filter Chunks"
              description="Search within chunk titles and content using MongoDB regex matching"
              placeholder="Enter keywords to filter chunks"
              value={textFilter}
              onChange={e => {
                setTextFilter(e.target.value);
                // Reset infinite scroll state when filter changes
                setDisplayLimit(20);
                setHasMore(true);
              }}
            />
          </div>
          
          <div style={{ marginBottom: spacing[3] }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1], marginBottom: spacing[2] }}>
              <Icon glyph="Filter" size="small" fill={palette.blue.base} />
              <Subtitle style={{ color: palette.blue.dark2, margin: 0 }}>Content Type Filter</Subtitle>
              <div style={{ 
                fontSize: '12px', 
                marginLeft: spacing[1], 
                padding: `0 ${spacing[1]}px`, 
                backgroundColor: palette.blue.light3, 
                borderRadius: '4px', 
                color: palette.blue.dark2 
              }}>
                MongoDB $match
              </div>
            </div>
            <div>
              {availableFilters.contentTypes.map(type => (
                <FilterChip
                  key={type}
                  label={type}
                  selected={filters.contentType.includes(type)}
                  onClick={() => toggleFilter('contentType', type)}
                />
              ))}
            </div>
          </div>
          
          <div style={{ marginBottom: spacing[3] }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1], marginBottom: spacing[2] }}>
              <Icon glyph="Filter" size="small" fill={palette.green.base} />
              <Subtitle style={{ color: palette.green.dark2, margin: 0 }}>Vehicle Systems Filter</Subtitle>
              <div style={{ 
                fontSize: '12px', 
                marginLeft: spacing[1], 
                padding: `0 ${spacing[1]}px`, 
                backgroundColor: palette.green.light3, 
                borderRadius: '4px', 
                color: palette.green.dark2 
              }}>
                MongoDB $match
              </div>
            </div>
            <div>
              {availableFilters.vehicleSystems.map(system => (
                <FilterChip
                  key={system}
                  label={system}
                  selected={filters.vehicleSystems.includes(system)}
                  onClick={() => toggleFilter('vehicleSystems', system)}
                />
              ))}
            </div>
          </div>
          
          <div style={{ marginBottom: spacing[3] }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1], marginBottom: spacing[2] }}>
              <Icon glyph="Filter" size="small" fill={palette.purple.base} />
              <Subtitle style={{ color: palette.purple.dark2, margin: 0 }}>Special Content Filters</Subtitle>
              <div style={{ 
                fontSize: '12px', 
                marginLeft: spacing[1], 
                padding: `0 ${spacing[1]}px`, 
                backgroundColor: palette.purple.light3, 
                borderRadius: '4px', 
                color: palette.purple.dark2 
              }}>
                MongoDB $exists operator
              </div>
            </div>
            <div style={{ display: 'flex', gap: spacing[3] }}>
              <FilterChip
                label="Has Safety Notices"
                selected={filters.hasSafetyNotices}
                onClick={() => toggleFilter('hasSafetyNotices', null)}
              />
              <FilterChip
                label="Has Procedural Steps"
                selected={filters.hasProcedures}
                onClick={() => toggleFilter('hasProcedures', null)}
              />
            </div>
          </div>
        </Card>
        
        {/* MongoDB Filter Visualization */}
        <MongoDBFilterVisualization
          filters={filters}
          textFilter={textFilter}
          totalResults={chunks?.total || 0}
          filteredResults={filteredChunks.length}
        />
        
        <div style={{ 
          marginBottom: spacing[3],
          padding: spacing[2],
          borderRadius: '4px',
          backgroundColor: palette.gray.light3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
            <Icon glyph="Checkmark" fill={palette.green.base} />
            <Subtitle style={{ margin: 0 }}>
              Showing {filteredChunks.length} of {chunks?.total || 0} total chunks
            </Subtitle>
          </div>
          <div style={{ 
            backgroundColor: palette.green.light3, 
            padding: `${spacing[1]}px ${spacing[2]}px`,
            borderRadius: '4px',
            color: palette.green.dark2,
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            MongoDB Document Collection
          </div>
        </div>
        
        {/* Chunk list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3], marginBottom: spacing[3] }}>
          {currentItems.map(chunk => (
            <Card 
              key={chunk.id || (chunk._id ? (typeof chunk._id === 'string' ? chunk._id : chunk._id.$oid) : Math.random().toString())} 
              style={{ padding: spacing[3], cursor: 'pointer' }} 
              onClick={() => handleChunkClick(chunk)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing[2] }}>
                <H3>{getChunkTitle(chunk)}</H3>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                  <Body size="small" style={{ color: palette.gray.dark1 }}>
                    Page {chunk.page_numbers.join(', ')}
                  </Body>
                  {chunk.page_numbers && chunk.page_numbers.length > 0 && (
                    <Button
                      size="small"
                      variant="primaryOutline"
                      onClick={(e) => handleViewPdf(chunk, e)}
                      leftGlyph={<Icon glyph="Document" size="small" />}
                    >
                      PDF
                    </Button>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[3] }}>
                {chunk.content_type?.map(type => (
                  <Badge key={type} variant="darkgray">{type}</Badge>
                ))}
                
                {/* Display vehicle systems from both potential sources */}
                {chunk.vehicle_systems && Array.isArray(chunk.vehicle_systems) && 
                  chunk.vehicle_systems.map(system => (
                    <Badge key={`vs-${system}`} variant="blue">{system}</Badge>
                  ))
                }
                {chunk.metadata?.systems && Array.isArray(chunk.metadata.systems) && 
                  chunk.metadata.systems
                    // Filter out duplicates that might already be shown from vehicle_systems
                    .filter(system => !chunk.vehicle_systems || !chunk.vehicle_systems.includes(system))
                    .map(system => (
                      <Badge key={`ms-${system}`} variant="blue">{system}</Badge>
                    ))
                }
                
                {/* Safety notices - check all potential sources of safety information */}
                {(() => {
                  // Check for explicit safety notices
                  const hasExplicitSafetyNotices = 
                    chunk.safety_notices && 
                    Array.isArray(chunk.safety_notices) && 
                    chunk.safety_notices.length > 0;
                  
                  // Check for safety flag in metadata
                  const hasSafetyMetadata = 
                    chunk.metadata && 
                    chunk.metadata.has_safety === true;
                  
                  // Check for warning symbols in text
                  const hasWarningSymbols = 
                    chunk.text && 
                    (chunk.text.includes('⚠️') || 
                     chunk.text.toLowerCase().includes('warning') || 
                     chunk.text.toLowerCase().includes('caution'));
                  
                  // Check if content_type includes 'safety'
                  const hasSafetyContentType = 
                    chunk.content_type && 
                    Array.isArray(chunk.content_type) && 
                    chunk.content_type.includes('safety');
                  
                  if (hasExplicitSafetyNotices || hasSafetyMetadata || hasWarningSymbols || hasSafetyContentType) {
                    return (
                      <Badge variant="red">
                        Safety Information
                        {hasExplicitSafetyNotices && ` (${chunk.safety_notices.length})`}
                        {!hasExplicitSafetyNotices && hasWarningSymbols && " (⚠️)"}
                      </Badge>
                    );
                  }
                  return null;
                })()}
                
                {/* Procedural steps - check all potential sources */}
                {(() => {
                  // Check for explicit procedural steps
                  const hasProceduralSteps = 
                    chunk.procedural_steps && 
                    Array.isArray(chunk.procedural_steps) && 
                    chunk.procedural_steps.length > 0;
                  
                  // Check if content_type includes 'procedure'
                  const hasProceduralContentType = 
                    chunk.content_type && 
                    Array.isArray(chunk.content_type) && 
                    chunk.content_type.some(type => 
                      type === 'procedure' || 
                      type === 'procedural' || 
                      type.includes('step')
                    );
                  
                  // Check for numbered steps in the text
                  const hasNumberedSteps = 
                    chunk.text && 
                    (chunk.text.match(/\d+\.\s+[A-Z]/) || // Matches patterns like "1. Do something"
                     chunk.text.match(/Step\s+\d+/i));     // Matches patterns like "Step 1"
                  
                  if (hasProceduralSteps || hasProceduralContentType || hasNumberedSteps) {
                    return (
                      <Badge variant="green">
                        Procedural Steps
                        {hasProceduralSteps ? ` (${chunk.procedural_steps.length})` : ''}
                      </Badge>
                    );
                  }
                  return null;
                })()}

                {/* Related chunks badge */}
                {chunk.related_chunks && chunk.related_chunks.length > 0 && (
                  <Badge variant="yellow">Related Sections ({chunk.related_chunks.length})</Badge>
                )}
              </div>
              
              <Body style={{ 
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {chunk.text}
              </Body>
            </Card>
          ))}
        </div>
        
        {/* Infinite scroll loading indicator */}
        {filteredChunks.length > 0 && (
          <div 
            ref={observerTarget}
            style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              padding: spacing[4],
              marginTop: spacing[3],
              textAlign: 'center'
            }}
          >
            {isLoadingMore ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing[2] }}>
                <Icon glyph="Refresh" fill={palette.green.base} />
                <Body>Loading more chunks...</Body>
              </div>
            ) : hasMore ? (
              <Body style={{ color: palette.gray.dark1 }}>Scroll to load more</Body>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing[2] }}>
                <Icon glyph="Checkmark" fill={palette.green.base} />
                <Body>All {filteredChunks.length} chunks loaded</Body>
              </div>
            )}
          </div>
        )}
        
        {/* Empty state */}
        {filteredChunks.length === 0 && (
          <Card style={{ padding: spacing[4], textAlign: 'center' }}>
            <Icon glyph="Warning" size="large" style={{ marginBottom: spacing[2] }} />
            <H3 style={{ marginBottom: spacing[2] }}>No Chunks Found</H3>
            <Body>
              No chunks match your filter criteria. Try adjusting your filters or clearing them to see all chunks.
            </Body>
            <div style={{ display: 'flex', gap: spacing[2], justifyContent: 'center' }}>
              <Button
                variant="primary"
                onClick={() => {
                  setFilters({
                    contentType: [],
                    vehicleSystems: [],
                    hasSafetyNotices: false,
                    hasProcedures: false
                  });
                  setTextFilter('');
                  // Reset infinite scroll state
                  setDisplayLimit(20);
                  setHasMore(true);
                }}
                style={{ marginTop: spacing[3] }}
              >
                Clear All Filters
              </Button>
              
              <Button
                variant="primaryOutline"
                leftGlyph={<Icon glyph="Refresh" />}
                onClick={() => {
                  clearCache();
                  if (typeof window !== 'undefined') {
                    window.location.reload();
                  }
                }}
                style={{ marginTop: spacing[3] }}
              >
                Refresh Data
              </Button>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}