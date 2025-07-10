'use client';

/**
 * Main layout component with header and footer
 */
import React, { ReactNode, useEffect, useState } from 'react';
import { palette } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';
import Icon from '@leafygreen-ui/icon';
import { MyBody as Body, MyBanner as Banner } from '@/components/ui/TypographyWrapper';
import dynamic from 'next/dynamic';

// Components
import Header from './Header';

interface MainLayoutProps {
  children: ReactNode;
  showBanner?: boolean;
  bannerMessage?: string;
}

// Dynamically import LeafyGreenProvider with SSR disabled
const LeafyGreenProvider = dynamic(
  () => import('@leafygreen-ui/leafygreen-provider').then(mod => mod.default),
  { ssr: false }
);

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  showBanner = false,
  bannerMessage = ""
}) => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const content = (
    <div 
      style={{ 
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: palette.gray.light3,
        backgroundImage: `linear-gradient(to bottom, ${palette.green.light3}, ${palette.gray.light3} 300px)`
      }}
    >
      <Header />
      
      {showBanner && (
        <Banner 
          variant="info"
          dismissible
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: spacing[2] 
          }}>
            <Icon glyph="InfoWithCircle" />
            <Body>{bannerMessage}</Body>
          </div>
        </Banner>
      )}
      
      <main 
        style={{ 
          flex: 1,
          paddingTop: spacing[3],
          paddingBottom: spacing[3],
        }}
      >
        {children}
      </main>
    </div>
  );
  
  // Only render with LeafyGreenProvider on the client side
  if (!isClient) {
    return content;
  }
  
  return (
    <LeafyGreenProvider darkMode={false}>
      {content}
    </LeafyGreenProvider>
  );
};

export default MainLayout;