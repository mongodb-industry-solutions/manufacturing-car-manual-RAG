'use client';

/**
 * Footer component
 */
import React from 'react';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import { MyBody as Body } from '@/components/ui/TypographyWrapper';
import Icon from '@leafygreen-ui/icon';
import Link from 'next/link';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer
      style={{
        backgroundColor: palette.gray.dark2,
        color: palette.gray.light3,
        padding: `${spacing[3]}px 0`,
        borderTop: `3px solid ${palette.green.base}`,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: `0 ${spacing[3]}px`,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: spacing[2],
          }}
        >
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: spacing[1],
              backgroundColor: palette.green.light3,
              padding: `${spacing[1]}px ${spacing[2]}px`,
              borderRadius: '4px',
              border: `1px solid ${palette.green.light1}`
            }}
          >
            <Icon glyph="Database" size={24} fill={palette.green.base} />
            <Body weight="medium" style={{ color: palette.green.dark2 }}>
              Car Manual RAG
            </Body>
          </div>
          
          <Body size="small">
            Explore your vehicle&#39;s manual using advanced search and AI-powered answers
          </Body>
          
          <Body
            size="small"
            style={{
              marginTop: spacing[2],
              color: palette.gray.light2,
              backgroundColor: palette.gray.dark3,
              padding: `${spacing[1]}px ${spacing[2]}px`,
              borderRadius: '4px',
              display: 'inline-block'
            }}
          >
            © {currentYear} MongoDB, Inc. All rights reserved.
          </Body>
          
          <div
            style={{
              display: 'flex',
              gap: spacing[3],
              marginTop: spacing[1],
            }}
          >
            <Link href="/about" style={{ color: palette.gray.light1, textDecoration: 'none' }}>
              <Body size="small">About</Body>
            </Link>
            <Link href="/privacy" style={{ color: palette.gray.light1, textDecoration: 'none' }}>
              <Body size="small">Privacy</Body>
            </Link>
            <Link href="/terms" style={{ color: palette.gray.light1, textDecoration: 'none' }}>
              <Body size="small">Terms</Body>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;