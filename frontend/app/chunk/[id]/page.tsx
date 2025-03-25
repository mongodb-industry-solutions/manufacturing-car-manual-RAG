'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { H1, H3, Body } from '@leafygreen-ui/typography';
import Card from '@leafygreen-ui/card';
import Banner from '@leafygreen-ui/banner';
import Button from '@leafygreen-ui/button';
import Icon from '@leafygreen-ui/icon';
import { spacing } from '@leafygreen-ui/tokens';
import Link from 'next/link';

import dynamic from 'next/dynamic';
const MainLayout = dynamic(() => import('@/components/layout/MainLayout'));
const ChunkViewer = dynamic(() => import('@/components/content/ChunkViewer'));
const ProceduralSteps = dynamic(() => import('@/components/content/ProceduralSteps'));
// Note: The SafetyNotice component expects a "notice" prop object with type and content
// but we're using the component differently here than ChunkViewer does
const SafetyNotice = dynamic(() => import('@/components/content/SafetyNotice'));
const LoadingState = dynamic(() => import('@/components/common/LoadingState'));
const ErrorState = dynamic(() => import('@/components/common/ErrorState'));
import { useChunks } from '@/hooks/useChunks';
import { Chunk } from '@/types/Chunk';

export default function ChunkPage() {
  const params = useParams();
  const router = useRouter();
  const chunkId = params?.id as string;
  
  const { getChunk, loading, error } = useChunks();
  const [chunk, setChunk] = useState<Chunk | null>(null);
  
  useEffect(() => {
    if (chunkId) {
      fetchChunk();
    }
  }, [chunkId]);
  
  const fetchChunk = async () => {
    try {
      const chunkData = await getChunk(chunkId);
      setChunk(chunkData);
    } catch (err) {
      console.error('Error fetching chunk:', err);
    }
  };
  
  const handleNavigateToChunk = (id: string) => {
    router.push(`/chunk/${id}`);
  };
  
  if (loading) {
    return (
      <MainLayout>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: spacing[3] }}>
          <LoadingState message="Loading document content..." />
        </div>
      </MainLayout>
    );
  }
  
  if (error || !chunk) {
    return (
      <MainLayout>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: spacing[3] }}>
          <ErrorState 
            title="Could not load document"
            message={error || "The requested document section could not be found"}
          />
          <div style={{ textAlign: 'center', marginTop: spacing[3] }}>
            <Link href="/" passHref>
              <Button variant="primary">Back to Search</Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  // Extract heading hierarchy for breadcrumb
  const title = chunk.heading_level_1 || 'Document Section';
  const subtitle = chunk.heading_level_2 || '';
  const subsubtitle = chunk.heading_level_3 || '';
  
  return (
    <MainLayout>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: spacing[3] }}>
        {/* Breadcrumb */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: spacing[1],
          marginBottom: spacing[3],
          flexWrap: 'wrap'
        }}>
          <Link href="/" passHref>
            <Body weight="medium" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Icon glyph="Home" size="small" style={{ marginRight: '4px' }} /> Home
            </Body>
          </Link>
          <Icon glyph="ChevronRight" size="small" />
          
          {chunk.breadcrumb_trail ? (
            <>
              <Body>{chunk.breadcrumb_trail}</Body>
              <Icon glyph="ChevronRight" size="small" />
            </>
          ) : null}
          
          <Body style={{ fontWeight: 'bold' }}>{title}</Body>
        </div>
        
        {/* Title Section */}
        <div style={{ marginBottom: spacing[4] }}>
          <H1 style={{ marginBottom: spacing[1] }}>{title}</H1>
          {subtitle && <H3 style={{ marginBottom: spacing[1] }}>{subtitle}</H3>}
          {subsubtitle && <Body weight="medium">{subsubtitle}</Body>}
          
          <div style={{ 
            display: 'flex', 
            gap: spacing[2],
            marginTop: spacing[2],
            flexWrap: 'wrap'
          }}>
            <Body size="small">
              Page{chunk.page_numbers.length > 1 ? 's' : ''}: {chunk.page_numbers.join(', ')}
            </Body>
            
            {chunk.metadata && chunk.metadata.systems && chunk.metadata.systems.length > 0 && (
              <Body size="small">
                System: {chunk.metadata.systems.join(', ')}
              </Body>
            )}
            
            {chunk.metadata && chunk.metadata.parts && chunk.metadata.parts.length > 0 && (
              <Body size="small">
                Parts: {chunk.metadata.parts.join(', ')}
              </Body>
            )}
          </div>
        </div>
        
        {/* Safety Notices */}
        {chunk.safety_notices && chunk.safety_notices.length > 0 && (
          <div style={{ marginBottom: spacing[4] }}>
            <H3 style={{ marginBottom: spacing[2] }}>Safety Notices</H3>
            {chunk.safety_notices.map((notice, index) => (
              <SafetyNotice 
                key={index}
                notice={notice}
              />
            ))}
          </div>
        )}
        
        {/* Main Content */}
        <Card style={{ padding: spacing[4], marginBottom: spacing[4] }}>
          <ChunkViewer 
            chunk={chunk} 
            showNavigation={false}
          />
        </Card>
        
        {/* Procedural Steps */}
        {chunk.procedural_steps && chunk.procedural_steps.length > 0 && (
          <div style={{ marginBottom: spacing[4] }}>
            <H3 style={{ marginBottom: spacing[2] }}>Procedure Steps</H3>
            <Card style={{ padding: spacing[4] }}>
              <ProceduralSteps steps={chunk.procedural_steps} />
            </Card>
          </div>
        )}
        
        {/* Navigation links */}
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: spacing[4]
        }}>
          {chunk.prev_chunk_id ? (
            <Button 
              variant="default" 
              leftGlyph={<Icon glyph="ChevronLeft" />}
              onClick={() => handleNavigateToChunk(chunk.prev_chunk_id!)}
            >
              Previous Section
            </Button>
          ) : (
            <div></div> /* Empty placeholder to maintain flex spacing */
          )}
          
          <Link href="/" passHref>
            <Button variant="default" glyph="Home">
              Back to Search
            </Button>
          </Link>
          
          {chunk.next_chunk_id ? (
            <Button 
              variant="default" 
              rightGlyph={<Icon glyph="ChevronRight" />}
              onClick={() => handleNavigateToChunk(chunk.next_chunk_id!)}
            >
              Next Section
            </Button>
          ) : (
            <div></div> /* Empty placeholder to maintain flex spacing */
          )}
        </div>
      </div>
    </MainLayout>
  );
}