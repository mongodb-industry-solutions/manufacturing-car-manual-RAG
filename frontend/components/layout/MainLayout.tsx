'use client';

/**
 * Main layout component with header and footer
 */
import React, { ReactNode } from 'react';
import { palette } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';
import Icon from '@leafygreen-ui/icon';
import { Body } from '@leafygreen-ui/typography';
import Banner from '@leafygreen-ui/banner';
import LeafyGreenProvider from '@leafygreen-ui/leafygreen-provider';

// Components
import Header from './Header';

interface MainLayoutProps {
  children: ReactNode;
  showBanner?: boolean;
  bannerMessage?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  showBanner = false,
  bannerMessage = ""
}) => {
  return (
    <LeafyGreenProvider darkMode={false}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          backgroundColor: 'white'
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
    </LeafyGreenProvider>
  );
};

export default MainLayout;