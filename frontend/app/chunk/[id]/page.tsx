'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { H1, Body } from '@leafygreen-ui/typography';
import Button from '@leafygreen-ui/button';
import Banner from '@leafygreen-ui/banner';
import Icon from '@leafygreen-ui/icon';
import Card from '@leafygreen-ui/card';
import { spacing } from '@leafygreen-ui/tokens';
import { Spinner } from '@leafygreen-ui/loading-indicator';

const MainLayout = dynamic(() => import('@/components/layout/MainLayout'));
const ChunkViewer = dynamic(() => import('@/components/content/ChunkViewer'));
const AskQuestion = dynamic(() => import('@/components/search/AskQuestion'));
const ErrorState = dynamic(() => import('@/components/common/ErrorState'));
const LoadingState = dynamic(() => import('@/components/common/LoadingState'));

import { useChunks } from '@/hooks/useChunks';

export default function ChunkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const chunkId = params.id as string;
  const { getChunk, chunk, loading, error } = useChunks();

  // State for toggling the ask question panel
  const [showAskQuestion, setShowAskQuestion] = useState(false);

  // Fetch chunk data when the ID changes
  useEffect(() => {
    if (chunkId) {
      getChunk(chunkId).catch(error => console.error('Failed to fetch chunk:', error));
    }
  }, [chunkId, getChunk]);

  // Handle source click from AskQuestion component
  const handleSourceClick = (sourceId: string) => {
    router.push(`/chunk/${sourceId}`);
  };

  // Render loading state
  if (loading) {
    return (
      <MainLayout>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: spacing[3] }}>
          <LoadingState message="Loading chunk details..." />
        </div>
      </MainLayout>
    );
  }

  // Render error state
  if (error) {
    return (
      <MainLayout>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: spacing[3] }}>
          <ErrorState
            title="Error Loading Content"
            message={`We couldn't load the requested content: ${error}`}
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

  // Render empty state if no chunk found
  if (!chunk && !loading) {
    return (
      <MainLayout>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: spacing[3] }}>
          <ErrorState
            title="Content Not Found"
            message="The requested page from the manual could not be found."
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
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: spacing[3] }}>
        {/* Back to search button */}
        <div style={{ marginBottom: spacing[3] }}>
          <Button
            variant="default"
            onClick={() => router.back()}
            leftGlyph={<Icon glyph="ArrowLeft" />}
          >
            Back
          </Button>
        </div>

        {/* Main content area */}
        <div style={{ marginBottom: spacing[4] }}>
          {chunk && <ChunkViewer chunk={chunk} showNavigation={true} />}
        </div>
      </div> 
    </MainLayout>
  );
}