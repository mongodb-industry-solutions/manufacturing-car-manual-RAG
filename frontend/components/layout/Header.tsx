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
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        padding: `${spacing[3]}px ${spacing[3]}px`,
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
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            margin: 0, 
            color: palette.gray.light3, 
            fontFamily: "'Euclid Circular A', sans-serif",
            fontWeight: 700,
            fontSize: '20px',
            lineHeight: '24px'
          }}>
            {BRANDING.title}
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
                  gap: spacing[1],
                  padding: `${spacing[2]}px ${spacing[3]}px`,
                  borderRadius: '4px',
                  transition: 'background-color 0.2s ease',
                  backgroundColor: pathname === '/' ? palette.green.dark1 : 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = palette.green.dark1;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = pathname === '/' ? palette.green.dark1 : 'transparent';
                }}
              >
                <Icon glyph="Home" fill={palette.gray.light3} />
                <Body style={{ fontFamily: "'Euclid Circular A', sans-serif", fontWeight: 500, color: palette.gray.light3 }}>
                  Home
                </Body>
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
                  gap: spacing[1],
                  padding: `${spacing[2]}px ${spacing[3]}px`,
                  borderRadius: '4px',
                  transition: 'background-color 0.2s ease',
                  backgroundColor: pathname?.startsWith('/browse') ? palette.green.dark1 : 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = palette.green.dark1;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = pathname?.startsWith('/browse') ? palette.green.dark1 : 'transparent';
                }}
              >
                <Icon glyph="Table" fill={palette.gray.light3} />
                <Body style={{ fontFamily: "'Euclid Circular A', sans-serif", fontWeight: 500, color: palette.gray.light3 }}>
                  {TERMINOLOGY.browse}
                </Body>
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
                  gap: spacing[1],
                  padding: `${spacing[2]}px ${spacing[3]}px`,
                  borderRadius: '4px',
                  transition: 'background-color 0.2s ease',
                  backgroundColor: pathname?.startsWith('/search') ? palette.green.dark1 : 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = palette.green.dark1;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = pathname?.startsWith('/search') ? palette.green.dark1 : 'transparent';
                }}
              >
                <Icon glyph="MagnifyingGlass" fill={palette.gray.light3} />
                <Body style={{ fontFamily: "'Euclid Circular A', sans-serif", fontWeight: 500, color: palette.gray.light3 }}>
                  {TERMINOLOGY.search}
                </Body>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;