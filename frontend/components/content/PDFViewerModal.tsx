'use client';

import React from 'react';
import Modal from '@leafygreen-ui/modal';
import PDFViewer from './PDFViewer';
import { palette } from '@leafygreen-ui/palette';

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfPath: string;
  pageNumber: number;
}

const PDFViewerModal: React.FC<PDFViewerModalProps> = ({ 
  isOpen, 
  onClose, 
  pdfPath, 
  pageNumber 
}) => {
  return (
    <Modal
      open={isOpen}
      setOpen={(open) => {
        if (!open) onClose();
      }}
      size="large" // Use large size for better PDF viewing
      // Removed problematic props: baseFontSize, closeOnEscape, closeOnBackdropClick
      // These props are no longer supported or need to be handled differently
    >
      <div style={{ 
        padding: '16px',
        backgroundColor: palette.white,
        borderRadius: '4px',
        maxWidth: '90vw',
        maxHeight: 'calc(90vh - 80px)',
        overflow: 'auto',
        margin: '0 auto'
      }}>
        <PDFViewer 
          pdfPath={pdfPath} 
          pageNumber={pageNumber} 
          onClose={onClose}
        />
      </div>
    </Modal>
  );
};

export default PDFViewerModal;