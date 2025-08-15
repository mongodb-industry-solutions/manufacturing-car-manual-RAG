'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // Pagination state for API calls
  const [currentOffset, setCurrentOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreInAPI, setHasMoreInAPI] = useState(true);
  const [totalChunks, setTotalChunks] = useState(0);
  
  // Remove display limit logic - using server-side pagination only
  
  // Scroll observer reference
  const observerTarget = React.useRef(null);
  
  // Ref to prevent double initialization in React Strict Mode
  const hasInitialized = useRef(false);
  
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
  
  // Function to build API filters from current state
  const buildApiFilters = useCallback(() => {
    const apiFilters: any = {};
    if (filters.contentType.length > 0) {
      apiFilters.content_types = filters.contentType;
    }
    if (filters.vehicleSystems.length > 0) {
      apiFilters.vehicle_systems = filters.vehicleSystems;
    }
    if (filters.hasSafetyNotices) {
      apiFilters.has_safety_notices = true;
    }
    if (filters.hasProcedures) {
      apiFilters.has_procedures = true;
    }
    if (textFilter) {
      apiFilters.text_search = textFilter;
    }
    return Object.keys(apiFilters).length > 0 ? apiFilters : undefined;
  }, [filters, textFilter]);

  // Initial load function
  const loadInitialChunks = useCallback(async () => {
    try {
      console.log('Loading initial chunks...');
      const filtersToPass = buildApiFilters();
      console.log('Initial load filters:', filtersToPass);
      
      const result = await getChunks(0, 20, false, filtersToPass);
      console.log(`Initial load: ${result.chunks.length} chunks out of ${result.total} total`);
      
      setTotalChunks(result.total);
      setCurrentOffset(20); // Always increment by page size
      setHasMoreInAPI(20 < result.total);
    } catch (err) {
      console.error('Failed to load initial chunks:', err);
    }
  }, [getChunks, buildApiFilters]);

  // Load more chunks function
  const loadMoreChunks = useCallback(async () => {
    if (isLoadingMore || !hasMoreInAPI) return;
    
    setIsLoadingMore(true);
    try {
      console.log(`Loading more chunks from offset ${currentOffset}`);
      const filtersToPass = buildApiFilters();
      
      const result = await getChunks(currentOffset, 20, true, filtersToPass);
      console.log(`Loaded 20 more chunks (total in view: ${result.chunks.length})`);
      
      // Always increment offset by page size
      const newOffset = currentOffset + 20;
      setCurrentOffset(newOffset);
      setHasMoreInAPI(newOffset < result.total);
    } catch (err) {
      console.error('Failed to load more chunks:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentOffset, isLoadingMore, hasMoreInAPI, getChunks, buildApiFilters]);
  
  // Fetch initial chunks on load
  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      // Always load initial chunks - server-side filtering will handle empty filters
      loadInitialChunks();
    }
  }, []); // Empty dependency array - only run once on mount
  
  // Refetch when filters change
  useEffect(() => {
    // Skip if not initialized yet
    if (!hasInitialized.current) {
      return;
    }
    
    // Skip if all filters are empty (initial state)
    if (filters.contentType.length === 0 && filters.vehicleSystems.length === 0 && 
        !filters.hasSafetyNotices && !filters.hasProcedures && !textFilter) {
      return;
    }
    
    console.log('Filters changed, reloading with server-side filtering...');
    // Reset pagination and reload with new filters
    setCurrentOffset(0);
    setHasMoreInAPI(true);
    loadInitialChunks();
  }, [filters, textFilter]); // Removed loadInitialChunks to prevent dependency cycle
  
  // Fetch available filters from API instead of extracting from chunks
  useEffect(() => {
    const fetchAvailableFilters = async () => {
      try {
        console.log('Fetching available filter values from API...');
        // Use the existing API endpoint to get all available filter values
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/chunks/filters`);
        if (response.ok) {
          const filterData = await response.json();
          setAvailableFilters({
            contentTypes: filterData.content_types || [],
            vehicleSystems: filterData.vehicle_systems || []
          });
          console.log('Loaded filter values:', filterData);
        }
      } catch (error) {
        console.error('Failed to fetch available filters:', error);
        // Fallback to extracting from loaded chunks if API call fails
        if (chunks && chunks.chunks && chunks.chunks.length > 0) {
          const contentTypes = new Set();
          const vehicleSystems = new Set();
          
          chunks.chunks.forEach(chunk => {
            if (chunk.content_type && Array.isArray(chunk.content_type)) {
              chunk.content_type.forEach(type => contentTypes.add(type));
            }
            if (chunk.vehicle_systems && Array.isArray(chunk.vehicle_systems)) {
              chunk.vehicle_systems.forEach(system => vehicleSystems.add(system));
            }
          });
          
          setAvailableFilters({
            contentTypes: Array.from(contentTypes),
            vehicleSystems: Array.from(vehicleSystems)
          });
        }
      }
    };

    // Only fetch if we don't already have filter values
    if (availableFilters.contentTypes.length === 0 && availableFilters.vehicleSystems.length === 0) {
      fetchAvailableFilters();
    }
  }, [availableFilters]);
  
  // Since filtering is now done server-side, we just use the chunks directly
  const filteredChunks = React.useMemo(() => {
    if (!chunks || !chunks.chunks) return [];
    
    console.log(`Using server-filtered chunks: ${chunks.chunks.length} chunks`);
    return chunks.chunks;
  }, [chunks]);
  
  // Toggle filter value - triggers server-side filtering
  const toggleFilter = (type, value) => {
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
      
      // Log new filter state - server-side filtering will be triggered by useEffect
      console.log('New filter state (will trigger server-side filtering):', newFilters);
      return newFilters;
    });
    
    // Pagination reset is handled in the filters change useEffect
  };
  
  // Function to load more items from API
  // Simplified infinite scroll handler
  const handleInfiniteScroll = useCallback(() => {
    if (isLoadingMore || !hasMoreInAPI) return;
    
    console.log('Loading more chunks via infinite scroll...');
    loadMoreChunks();
  }, [isLoadingMore, hasMoreInAPI, loadMoreChunks]);
  
  // Setup intersection observer for infinite scroll
  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;
    
    // If we don't have chunks yet or we're already at the end, don't observe
    if (!filteredChunks || filteredChunks.length === 0 || !hasMoreInAPI) return;
    
    const observer = new IntersectionObserver(
      entries => {
        // If the target element is intersecting (visible)
        if (entries[0].isIntersecting && !isLoadingMore) {
          console.log("Triggering infinite scroll...");
          handleInfiniteScroll();
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
  }, [filteredChunks, hasMoreInAPI, isLoadingMore, handleInfiniteScroll]);
  
  // Reset pagination state when filters change (handled in filter change useEffect above)
  
  // All loaded chunks are displayed (server-side filtering handles everything)
  const currentItems = filteredChunks;
  
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
              <Icon glyph="File" fill={palette.green.dark1} style={{ marginRight: spacing[1] }} /> 
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
                // Pagination reset is handled in the filters change useEffect
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
          totalResults={713}
          filteredResults={totalChunks || chunks?.total || 0}
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
              Showing {currentItems.length} of {totalChunks || chunks?.total || 0} total chunks matching filters
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
                <Body>Loading more chunks from database...</Body>
              </div>
            ) : hasMoreInAPI ? (
              <Body style={{ color: palette.gray.dark1 }}>Scroll to load more</Body>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing[2] }}>
                <Icon glyph="Checkmark" fill={palette.green.base} />
                <Body>All {totalChunks || chunks?.total || filteredChunks.length} matching chunks displayed</Body>
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
                  // Reset will be handled by the filters change useEffect
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