/**
 * Main layout component with header and footer
 */
import React, { ReactNode } from 'react';
import { palette } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';
import LeafyGreenProvider from '@leafygreen-ui/leafygreen-provider';

// Components
import Header from './Header';
import Footer from './Footer';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <LeafyGreenProvider darkMode={false}>
      <div 
        style={{ 
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          backgroundColor: palette.gray.light3
        }}
      >
        <Header />
        
        <main 
          style={{ 
            flex: 1,
            paddingTop: spacing[3],
            paddingBottom: spacing[3],
          }}
        >
          {children}
        </main>
        
        <Footer />
      </div>
    </LeafyGreenProvider>
  );
};

export default MainLayout;