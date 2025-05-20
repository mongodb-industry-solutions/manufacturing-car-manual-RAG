'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { MyH1 as H1, MyBody as Body } from '@/components/ui/TypographyWrapper';
import { MyButton as Button } from '@/components/ui/TypographyWrapper';
import Banner from '@leafygreen-ui/banner';
import Icon from '@leafygreen-ui/icon';
import { MyCard as Card } from '@/components/ui/TypographyWrapper';
import { spacing } from '@leafygreen-ui/tokens';
import { MySpinner as Spinner } from '@/components/ui/TypographyWrapper';
import { palette } from '@leafygreen-ui/palette';

const MainLayout = dynamic(() => import('@/components/layout/MainLayout'));
const ChunkViewer = dynamic(() => import('@/components/content/ChunkViewer'));
const AskQuestion = dynamic(() => import('@/components/search/AskQuestion'));
const ErrorState = dynamic(() => import('@/components/common/ErrorState'));
const LoadingState = dynamic(() => import('@/components/common/LoadingState'));
const PDFViewerModal = dynamic(() => import('@/components/content/PDFViewerModal'), { ssr: false });

import { useChunks } from '@/hooks/useChunks';

// Save the referrer in sessionStorage when navigating to chunk detail
const STORAGE_KEY_REFERRER = 'car_manual_previous_search_url';

export default function ChunkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const chunkId = params.id as string;
  const { getChunk, chunk, loading, error } = useChunks();

  // State for toggling the ask question panel
  const [showAskQuestion, setShowAskQuestion] = useState(false);
  // State to store the referrer URL and type - default to search
  const [referrerUrl, setReferrerUrl] = useState('/search');
  const [referrerType, setReferrerType] = useState('search');
  // State for toggling the PDF viewer
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  // Path to your PDF - update this to the actual path where you've stored your PDF
  const pdfPath = '/car-manual.pdf'; // This should be in the public directory

  // Store referrer info when component mounts and check for PDF open param
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log("Checking referrer information...");
      
      // Try to get the referrer from sessionStorage
      const storedReferrer = sessionStorage.getItem(STORAGE_KEY_REFERRER);
      console.log("Stored referrer:", storedReferrer);
      
      // Check if we have a source parameter (search or browse)
      const source = searchParams.get('source');
      console.log("Source parameter:", source);
      
      // Check for explicit source parameter in URL
      if (source) {
        console.log("URL has explicit source parameter:", source);
        
        if (source === 'browse') {
          console.log("Setting browse as referrer source");
          // When coming from browse page, always use the browse page URL
          const browseUrl = '/browse';
          sessionStorage.setItem(STORAGE_KEY_REFERRER, browseUrl);
          sessionStorage.setItem('car_manual_referrer_type', 'browse');
          setReferrerUrl(browseUrl);
          setReferrerType('browse');
        } 
        else if (source === 'search') {
          // If we navigated from search page, use search URL
          console.log("Setting search as referrer source");
          // Default to /search if referrer isn't available
          const referrer = document.referrer || '/search';
          sessionStorage.setItem(STORAGE_KEY_REFERRER, referrer);
          sessionStorage.setItem('car_manual_referrer_type', 'search');
          setReferrerUrl(referrer);
          setReferrerType('search');
        }
      } 
      // Fallback to stored referrer if no source parameter
      else if (storedReferrer) {
        console.log("No source parameter, using stored referrer");
        setReferrerUrl(storedReferrer);
        const storedType = sessionStorage.getItem('car_manual_referrer_type') || 'search';
        setReferrerType(storedType);
        console.log("Stored referrer type:", storedType);
      }
      // Default fallback to search if nothing else
      else {
        console.log("No source or stored referrer, defaulting to search");
        setReferrerUrl('/search');
        setReferrerType('search');
      }
      
      // Check if we should open the PDF viewer automatically
      const openPdf = searchParams.get('open_pdf');
      if (openPdf === 'true') {
        setShowPdfViewer(true);
      }
    }
  }, [searchParams]);

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
        {/* Back navigation button */}
        <div style={{ marginBottom: spacing[3] }}>
          <Button
            variant="default"
            onClick={() => {
              console.log("Navigating back to:", referrerUrl, "with type:", referrerType);
              // Ensure we use the correct referrer URL
              const targetUrl = referrerType === 'browse' ? '/browse' : referrerUrl;
              router.push(targetUrl);
            }}
            leftGlyph={<Icon glyph="ArrowLeft" />}
          >
            {referrerType === 'browse' 
              ? 'Back to Browse Chunks' 
              : 'Back to Search'}
          </Button>
        </div>

        {/* Main content area */}
        <div style={{ marginBottom: spacing[4] }}>
          {chunk && <ChunkViewer chunk={chunk} showNavigation={true} />}
        </div>

        {/* PDF Viewer Button */}
        {chunk && chunk.page_numbers && chunk.page_numbers.length > 0 && (
          <div style={{ 
            marginTop: spacing[4],
            padding: spacing[3],
            backgroundColor: palette.blue.light1,
            borderRadius: '4px',
            borderLeft: `4px solid ${palette.blue.base}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Body weight="medium">Original Source Reference</Body>
                <Body>
                  This content appears on page{chunk.page_numbers.length > 1 ? 's' : ''}{' '}
                  <strong>{chunk.page_numbers.join(', ')}</strong> of the original manual.
                </Body>
              </div>
              
              <Button
                variant="primary"
                onClick={() => setShowPdfViewer(true)}
                leftGlyph={<Icon glyph="Document" />}
              >
                View in Original PDF
              </Button>
            </div>
          </div>
        )}

        {/* PDF Viewer Modal */}
        {showPdfViewer && chunk && chunk.page_numbers && chunk.page_numbers.length > 0 && (
          <PDFViewerModal
            isOpen={showPdfViewer}
            onClose={() => setShowPdfViewer(false)}
            pdfPath={pdfPath}
            pageNumber={chunk.page_numbers[0]}
          />
        )}
      </div> 
    </MainLayout>
  );
}