'use client';

/**
 * Header component with navigation - MongoDB Professional Design
 */
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import { Body } from '@leafygreen-ui/typography';
import Icon from '@leafygreen-ui/icon';
import { BRANDING, TERMINOLOGY } from '@/constants/appConstants';

const Header: React.FC = () => {
  const pathname = usePathname();
  
  return (
    <header
      style={{
        backgroundColor: palette.green.dark2,
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
        padding: `${spacing[4]}px ${spacing[3]}px`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: `1px solid ${palette.green.dark3}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1] }}>
          <div style={{
            margin: 0,
            color: palette.gray.light3,
            fontFamily: "'Euclid Circular A', sans-serif",
            fontWeight: 700,
            fontSize: '28px',
            lineHeight: '32px'
          }}>
            {BRANDING.title}
          </div>
          <div style={{
            margin: 0,
            color: palette.gray.light2,
            fontFamily: "'Euclid Circular A', sans-serif",
            fontWeight: 400,
            fontSize: '15px',
            lineHeight: '20px',
            opacity: 0.95
          }}>
            {BRANDING.subtitle}
          </div>
        </div>
        
        <nav>
          <ul
            style={{
              display: 'flex',
              listStyle: 'none',
              margin: 0,
              padding: 0,
              gap: spacing[3],
            }}
          >
            <li>
              <Link
                href="/"
                style={{
                  color: palette.gray.light3,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  padding: `${spacing[2]}px ${spacing[4]}px`,
                  borderRadius: '6px',
                  transition: 'background-color 0.2s ease',
                  backgroundColor: pathname === '/' ? palette.green.dark1 : 'transparent',
                  fontSize: '16px',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = palette.green.dark1;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = pathname === '/' ? palette.green.dark1 : 'transparent';
                }}
              >
                <Icon glyph="Home" size={20} fill={palette.gray.light3} />
                <span style={{ fontFamily: "'Euclid Circular A', sans-serif" }}>
                  Home
                </span>
              </Link>
            </li>

            <li>
              <Link
                href="/browse"
                style={{
                  color: palette.gray.light3,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  padding: `${spacing[2]}px ${spacing[4]}px`,
                  borderRadius: '6px',
                  transition: 'background-color 0.2s ease',
                  backgroundColor: pathname?.startsWith('/browse') ? palette.green.dark1 : 'transparent',
                  fontSize: '16px',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = palette.green.dark1;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = pathname?.startsWith('/browse') ? palette.green.dark1 : 'transparent';
                }}
              >
                <Icon glyph="Table" size={20} fill={palette.gray.light3} />
                <span style={{ fontFamily: "'Euclid Circular A', sans-serif" }}>
                  {TERMINOLOGY.browse}
                </span>
              </Link>
            </li>

            <li>
              <Link
                href="/search"
                style={{
                  color: palette.gray.light3,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  padding: `${spacing[2]}px ${spacing[4]}px`,
                  borderRadius: '6px',
                  transition: 'background-color 0.2s ease',
                  backgroundColor: pathname?.startsWith('/search') ? palette.green.dark1 : 'transparent',
                  fontSize: '16px',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = palette.green.dark1;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = pathname?.startsWith('/search') ? palette.green.dark1 : 'transparent';
                }}
              >
                <Icon glyph="MagnifyingGlass" size={20} fill={palette.gray.light3} />
                <span style={{ fontFamily: "'Euclid Circular A', sans-serif" }}>
                  {TERMINOLOGY.search}
                </span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;