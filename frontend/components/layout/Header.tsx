'use client';

/**
 * Header component with navigation
 */
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import { MyH3 as H3 } from '@/components/ui/TypographyWrapper';
import { MyButton as Button } from '@/components/ui/TypographyWrapper';
import Icon from '@leafygreen-ui/icon';
import Tooltip from '@leafygreen-ui/tooltip';

const Header: React.FC = () => {
  const pathname = usePathname();
  
  return (
    <header
      style={{
        backgroundColor: 'white',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)',
        padding: `${spacing[2]}px ${spacing[3]}px`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: `1px solid ${palette.gray.light2}`,
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
          <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip
              trigger={
                <div style={{ 
                  backgroundColor: palette.green.light2, 
                  borderRadius: '50%', 
                  padding: spacing[1], 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon glyph="Database" size={30} fill={palette.green.base} />
                </div>
              }
              triggerEvent="hover"
            >
              Back to home
            </Tooltip>
          </Link>
          
          <H3 style={{ margin: 0, color: palette.gray.dark2, fontWeight: 'bold' }}>
            Technical Manual Explorer
          </H3>
        </div>
        
        <nav>
          <ul
            style={{
              display: 'flex',
              listStyle: 'none',
              margin: 0,
              padding: 0,
              gap: spacing[2],
            }}
          >
            <li>
              <Link href="/">
                <div style={{ display: 'inline-block' }}>
                  <Button
                    variant={pathname === '/' ? 'primary' : 'default'}
                    size="large"
                    leftGlyph={<Icon glyph="Home" />}
                  >
                    Home
                  </Button>
                </div>
              </Link>
            </li>
            
            <li>
              <Link href="/search">
                <div style={{ display: 'inline-block' }}>
                  <Button
                    variant={pathname?.startsWith('/search') ? 'primary' : 'default'}
                    size="large"
                    leftGlyph={<Icon glyph="MagnifyingGlass" />}
                  >
                    Search
                  </Button>
                </div>
              </Link>
            </li>
            
            <li>
              <Link href="/browse">
                <div style={{ display: 'inline-block' }}>
                  <Button
                    variant={pathname?.startsWith('/browse') ? 'primary' : 'default'}
                    size="large"
                    leftGlyph={<Icon glyph="Table" />}
                  >
                    Browse Chunks
                  </Button>
                </div>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;