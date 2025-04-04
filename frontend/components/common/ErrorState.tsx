/**
 * Error state component
 */
import React from 'react';
import Card from '@leafygreen-ui/card';
import { H3, Body } from '@leafygreen-ui/typography';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import Button from '@leafygreen-ui/button';
import Icon from '@leafygreen-ui/icon';
import Banner from '@leafygreen-ui/banner';

interface ErrorStateProps {
  title?: string;
  message?: string;
  details?: string;
  onRetry?: () => void;
  isFullPage?: boolean;
  action?: React.ReactNode;
}

const ErrorState: React.FC<ErrorStateProps> = ({ 
  title,
  message = 'An error occurred',
  details,
  onRetry,
  isFullPage = false,
  action
}) => {
  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: spacing[4],
        textAlign: 'center',
        gap: spacing[3]
      }}
    >
      <Icon 
        glyph="Warning" 
        size="large" 
        fill={palette.red.base} 
      />
      
      <H3>{title || message}</H3>
      
      {message && title && <Body>{message}</Body>}
      
      {details && (
        <Banner variant="danger">
          {details}
        </Banner>
      )}
      
      {onRetry && (
        <Button
          variant="primary"
          onClick={onRetry}
          leftGlyph={<Icon glyph={title?.includes("Error Loading") ? "Home" : "Refresh"} />}
        >
          {title?.includes("Error Loading") ? "Return Home" : "Try Again"}
        </Button>
      )}
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
        <Card style={{ maxWidth: '600px', width: '100%' }}>
          {content}
        </Card>
      </div>
    );
  }

  return <Card>{content}</Card>;
};

export default ErrorState;