'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { H1, H2, H3, Body, Subtitle } from '@leafygreen-ui/typography';
import Card from '@leafygreen-ui/card';
import { spacing } from '@leafygreen-ui/tokens';
import Button from '@leafygreen-ui/button';
import Icon from '@leafygreen-ui/icon';
import { palette } from '@leafygreen-ui/palette';
import Pagination from '@leafygreen-ui/pagination';
import Badge from '@leafygreen-ui/badge';
import TextInput from '@leafygreen-ui/text-input';

const MainLayout = dynamic(() => import('@/components/layout/MainLayout'));
const LoadingState = dynamic(() => import('@/components/common/LoadingState'));
const ErrorState = dynamic(() => import('@/components/common/ErrorState'));

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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // This ensures we rerender when the page changes
  const [paginationKey, setPaginationKey] = useState(0);
  
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
        await getChunks(0, 100); // Get first 100 chunks
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
        if (chunk.content_type) {
          chunk.content_type.forEach(type => contentTypes.add(type));
        }
        if (chunk.vehicle_systems) {
          chunk.vehicle_systems.forEach(system => vehicleSystems.add(system));
        }
      });
      
      setAvailableFilters({
        contentTypes: Array.from(contentTypes),
        vehicleSystems: Array.from(vehicleSystems)
      });
    }
  }, [chunks]);
  
  // Filter chunks based on current filters
  const filteredChunks = React.useMemo(() => {
    if (!chunks || !chunks.chunks) return [];
    
    return chunks.chunks.filter(chunk => {
      // Text filter
      if (textFilter && !chunkMatchesText(chunk, textFilter)) {
        return false;
      }
      
      // Content type filter
      if (filters.contentType.length > 0) {
        if (!chunk.content_type || !chunk.content_type.some(type => filters.contentType.includes(type))) {
          return false;
        }
      }
      
      // Vehicle systems filter
      if (filters.vehicleSystems.length > 0) {
        if (!chunk.vehicle_systems || !chunk.vehicle_systems.some(system => filters.vehicleSystems.includes(system))) {
          return false;
        }
      }
      
      // Safety notices filter
      if (filters.hasSafetyNotices && (!chunk.safety_notices || chunk.safety_notices.length === 0)) {
        return false;
      }
      
      // Procedures filter
      if (filters.hasProcedures && (!chunk.procedural_steps || chunk.procedural_steps.length === 0)) {
        return false;
      }
      
      return true;
    });
  }, [chunks, filters, textFilter]);
  
  // Helper to check if chunk matches text filter
  const chunkMatchesText = (chunk: Chunk, text: string): boolean => {
    const lowerText = text.toLowerCase();
    if (chunk.text.toLowerCase().includes(lowerText)) return true;
    if (chunk.heading_level_1 && chunk.heading_level_1.toLowerCase().includes(lowerText)) return true;
    if (chunk.heading_level_2 && chunk.heading_level_2.toLowerCase().includes(lowerText)) return true;
    if (chunk.heading_level_3 && chunk.heading_level_3.toLowerCase().includes(lowerText)) return true;
    return false;
  };
  
  // Toggle filter value
  const toggleFilter = (type, value) => {
    setFilters(prev => {
      if (type === 'contentType' || type === 'vehicleSystems') {
        const index = prev[type].indexOf(value);
        if (index === -1) {
          return { ...prev, [type]: [...prev[type], value] };
        } else {
          return { ...prev, [type]: prev[type].filter(item => item !== value) };
        }
      } else {
        return { ...prev, [type]: !prev[type] };
      }
    });
  };
  
  // Handle page change properly
  const handlePageChange = useCallback((newPage: number) => {
    console.log("Changing to page:", newPage);
    setCurrentPage(newPage);
    // Force re-render with a new key for the pagination component
    setPaginationKey(prev => prev + 1);
    // Scroll to top of the page for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  
  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredChunks.slice(indexOfFirstItem, indexOfLastItem);
  
  // Get chunk title
  const getChunkTitle = (chunk: Chunk): string => {
    if (chunk.heading_level_1) return chunk.heading_level_1;
    if (chunk.heading_level_2) return chunk.heading_level_2;
    if (chunk.heading_level_3) return chunk.heading_level_3;
    return `${chunk.id.substring(0, 10)}...`;
  };
  
  // Handle chunk click to view details
  const handleChunkClick = (chunkId: string) => {
    router.push(`/chunk/${chunkId}`);
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
            action={
              <Button
                variant="primary"
                onClick={() => router.push('/')}
                leftGlyph={<Icon glyph="Home" />}
              >
                Return Home
              </Button>
            }
          />
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing[3] }}>
        <div style={{ marginBottom: spacing[3], display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <H1>Browse Car Manual Chunks</H1>
          <div style={{ display: 'flex', gap: spacing[2] }}>
            <Button
              variant="primaryOutline"
              onClick={() => {
                clearCache();
                window.location.reload();
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
            <H3 style={{ marginBottom: spacing[2] }}>About Chunks</H3>
            <Body>
              This page displays all the chunks extracted from the car manual. Each chunk represents a semantically 
              meaningful section of content that balances size, context, and coherence. You can filter chunks by 
              various properties to explore how technical documentation is processed for search.
            </Body>
          </div>
          
          <div style={{ marginBottom: spacing[3] }}>
            <TextInput
              label="Filter Chunks"
              description="Search within chunk titles and content"
              placeholder="Enter keywords to filter chunks"
              value={textFilter}
              onChange={e => setTextFilter(e.target.value)}
            />
          </div>
          
          <div style={{ marginBottom: spacing[3] }}>
            <Subtitle style={{ marginBottom: spacing[2] }}>Content Type</Subtitle>
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
            <Subtitle style={{ marginBottom: spacing[2] }}>Vehicle Systems</Subtitle>
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
          
          <div style={{ marginBottom: spacing[3], display: 'flex', gap: spacing[3] }}>
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
        </Card>
        
        <div style={{ marginBottom: spacing[3] }}>
          <Subtitle>
            Showing {filteredChunks.length} of {chunks?.total || 0} total chunks
          </Subtitle>
        </div>
        
        {/* Chunk list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3], marginBottom: spacing[3] }}>
          {currentItems.map(chunk => (
            <Card 
              key={chunk.id} 
              style={{ padding: spacing[3], cursor: 'pointer' }} 
              onClick={() => handleChunkClick(chunk.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing[2] }}>
                <H3>{getChunkTitle(chunk)}</H3>
                <Body size="small" style={{ color: palette.gray.dark1 }}>
                  Page {chunk.page_numbers.join(', ')}
                </Body>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[3] }}>
                {chunk.content_type?.map(type => (
                  <Badge key={type} variant="darkgray">{type}</Badge>
                ))}
                
                {chunk.vehicle_systems?.map(system => (
                  <Badge key={system} variant="blue">{system}</Badge>
                ))}
                
                {chunk.safety_notices && chunk.safety_notices.length > 0 && (
                  <Badge variant="red">Safety Notices ({chunk.safety_notices.length})</Badge>
                )}
                
                {chunk.procedural_steps && chunk.procedural_steps.length > 0 && (
                  <Badge variant="green">Procedural Steps ({chunk.procedural_steps.length})</Badge>
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
        
        {/* Pagination */}
        {filteredChunks.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: spacing[3] }}>
            <Pagination
              key={`pagination-${paginationKey}`}
              numPages={Math.ceil(filteredChunks.length / itemsPerPage)}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
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
                  window.location.reload();
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