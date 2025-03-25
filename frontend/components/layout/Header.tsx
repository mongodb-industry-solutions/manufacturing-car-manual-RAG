'use client';

/**
 * Header component with navigation
 */
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import { H3 } from '@leafygreen-ui/typography';
import Button from '@leafygreen-ui/button';
import Icon from '@leafygreen-ui/icon';

const Header: React.FC = () => {
  const pathname = usePathname();
  
  return (
    <header
      style={{
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        padding: `${spacing[2]}px ${spacing[3]}px`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
          <Link href="/" passHref style={{ display: 'flex', alignItems: 'center' }}>
            <Icon glyph="MongoDB" size={30} fill={palette.green.base} />
          </Link>
          
          <H3 style={{ margin: 0, color: palette.gray.dark2 }}>
            Car Manual RAG
          </H3>
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
              <Link href="/" passHref>
                <Button
                  variant={pathname === '/' ? 'primary' : 'default'}
                >
                  Home
                </Button>
              </Link>
            </li>
            
            <li>
              <Link href="/search" passHref>
                <Button
                  variant={pathname?.startsWith('/search') ? 'primary' : 'default'}
                >
                  Search
                </Button>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;