/**
 * Loading state component
 */
import React from 'react';
import Card from '@leafygreen-ui/card';
import { Spinner } from '@leafygreen-ui/loading-indicator';
import { H3, Body } from '@leafygreen-ui/typography';
import { spacing } from '@leafygreen-ui/tokens';

interface LoadingStateProps {
  message?: string;
  isFullPage?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Loading...',
  isFullPage = false
}) => {
  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing[4],
        textAlign: 'center',
        gap: spacing[3]
      }}
    >
      <Spinner size="large" />
      <H3>{message}</H3>
      <Body>Please wait while we retrieve the data</Body>
    </div>
  );

  if (isFullPage) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          width: '100%'
        }}
      >
        <Card style={{ maxWidth: '500px', width: '100%' }}>
          {content}
        </Card>
      </div>
    );
  }

  return <Card>{content}</Card>;
};

export default LoadingState;