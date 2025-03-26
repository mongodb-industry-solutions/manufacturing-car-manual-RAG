'use client';

/**
 * Footer component
 */
import React from 'react';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import { Body } from '@leafygreen-ui/typography';
import Icon from '@leafygreen-ui/icon';
import Link from 'next/link';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer
      style={{
        backgroundColor: palette.gray.dark3,
        color: palette.gray.light2,
        padding: `${spacing[3]}px 0`,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
            <Icon glyph="Database" size={24} fill={palette.green.base} />
            <Body weight="medium">
              Car Manual RAG
            </Body>
          </div>
          
          <Body size="small">
            Explore your vehicle&#39;s manual using advanced search and AI-powered answers
          </Body>
          
          <Body size="small" style={{ marginTop: spacing[2] }}>
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