'use client';

/**
 * Header component with navigation
 */
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import { MyH3 as H3, MyButton as Button, MyTooltip as Tooltip } from '@/components/ui/TypographyWrapper';
import Icon from '@leafygreen-ui/icon';
import { BRANDING, TERMINOLOGY } from '@/constants/appConstants';

const Header: React.FC = () => {
  const pathname = usePathname();
  
  // Convert hex color to rgb for lighter background
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };
  
  // Get the primary color from constants
  const primaryColor = BRANDING.primaryColor;
  const rgbColor = hexToRgb(primaryColor);
  const bgColor = rgbColor ? `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.1)` : palette.green.light2;
  
  return (
    <header
      style={{
        backgroundColor: 'white',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)',
        padding: `${spacing[2]}px ${spacing[3]}px`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: `3px solid ${palette.green.base}`,
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
                  backgroundColor: bgColor, 
                  borderRadius: '50%', 
                  padding: spacing[1], 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon glyph="Database" size={30} fill={primaryColor} />
                </div>
              }
              triggerEvent="hover"
            >
              Back to home
            </Tooltip>
          </Link>
          
          <H3 style={{ margin: 0, color: palette.gray.dark2, fontWeight: 'bold' }}>
            {BRANDING.title}
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
                    {TERMINOLOGY.search}
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
                    {TERMINOLOGY.browse}
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