'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { palette } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';
import { MyBody as Body, MyH3 as H3, MyButton as Button } from '@/components/ui/TypographyWrapper';
import Icon from '@leafygreen-ui/icon';

// We'll dynamically import the worker in a useEffect to avoid SSR issues

interface PDFViewerProps {
  pdfPath: string;
  pageNumber: number;
  onClose?: () => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ pdfPath, pageNumber, onClose }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(pageNumber);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [scale, setScale] = useState<number>(1.2);
  const [workerInitialized, setWorkerInitialized] = useState<boolean>(false);

  // Initialize the worker when component mounts
  useEffect(() => {
    const initializeWorker = async () => {
      try {
        // Set worker source directly to the hosted worker file
        // Use the CDN URL based on the installed version
        pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        setWorkerInitialized(true);
      } catch (error) {
        console.error('Error initializing PDF worker:', error);
        setLoadError(`Error initializing PDF worker: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    initializeWorker();
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  function onDocumentLoadError(error: Error) {
    console.error('Error loading PDF:', error);
    setLoadError(`Error loading PDF: ${error.message}`);
    setLoading(false);
  }

  // Navigation functions
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (numPages && currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Zoom functions
  const zoomIn = () => setScale(prevScale => Math.min(prevScale + 0.2, 3));
  const zoomOut = () => setScale(prevScale => Math.max(prevScale - 0.2, 0.6));
  
  // Memoize the file object to prevent unnecessary reloads
  const fileObject = useMemo(() => ({
    url: pdfPath,
    httpHeaders: {
      'Content-Type': 'application/pdf',
    }
  }), [pdfPath]);
  
  return (
    <div style={{ maxWidth: '100%', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: spacing[2],
        padding: spacing[2],
        backgroundColor: palette.gray.light2,
        borderRadius: '4px'
      }}>
        <H3 style={{ margin: 0 }}>Original PDF</H3>
        <div style={{ display: 'flex', gap: spacing[2] }}>
          {/* Zoom controls */}
          <Button
            onClick={zoomOut}
            disabled={scale <= 0.6}
          >
            Zoom Out
          </Button>
          <Button
            onClick={zoomIn}
            disabled={scale >= 3}
            leftGlyph={<Icon glyph="Plus" />}
          >
            Zoom In
          </Button>
          {onClose && (
            <Button
              onClick={onClose}
              variant="primaryOutline"
              leftGlyph={<Icon glyph="X" />}
            >
              Close
            </Button>
          )}
        </div>
      </div>

      {loading && !loadError && !workerInitialized && (
        <div style={{ 
          padding: spacing[3], 
          backgroundColor: palette.gray.light1,
          borderRadius: '4px',
          textAlign: 'center' 
        }}>
          <div style={{ animation: 'spin 2s linear infinite', display: 'inline-block', marginBottom: spacing[2] }}>
            <Icon glyph="Refresh" />
          </div>
          <Body>Loading PDF...</Body>
        </div>
      )}

      {loadError && (
        <div style={{ 
          padding: spacing[3], 
          backgroundColor: palette.red.light1,
          borderRadius: '4px',
          color: palette.red.dark2
        }}>
          <Body>{loadError}</Body>
          <Body>Please make sure you've placed the PDF in the correct location.</Body>
        </div>
      )}

      <div style={{ 
        border: `1px solid ${palette.gray.light2}`, 
        borderRadius: '4px',
        padding: spacing[2], 
        backgroundColor: palette.gray.light1,
        overflow: 'auto',
        maxHeight: '600px'
      }}>
        {workerInitialized ? (
          <Document
            file={fileObject}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div style={{ textAlign: 'center', padding: spacing[3] }}>
                <Body>Loading PDF document...</Body>
              </div>
            }
          >
            {/* Don't use hooks inside conditional renders */}
            <Page 
              pageNumber={currentPage} 
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              loading={
                <div style={{ textAlign: 'center', padding: spacing[3] }}>
                  <Body>Loading page {currentPage}...</Body>
                </div>
              }
            />
          </Document>
        ) : (
          <div style={{ textAlign: 'center', padding: spacing[3] }}>
            <Body>Initializing PDF viewer...</Body>
          </div>
        )}
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: spacing[2],
        padding: spacing[2],
        backgroundColor: palette.gray.light2,
        borderRadius: '4px'
      }}>
        <Button
          onClick={goToPrevPage}
          disabled={currentPage <= 1}
          leftGlyph={<Icon glyph="ChevronLeft" />}
        >
          Previous
        </Button>
        <Body>
          Page {currentPage} of {numPages || '?'}
        </Body>
        <Button
          onClick={goToNextPage}
          disabled={!numPages || currentPage >= numPages}
          rightGlyph={<Icon glyph="ChevronRight" />}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default PDFViewer;