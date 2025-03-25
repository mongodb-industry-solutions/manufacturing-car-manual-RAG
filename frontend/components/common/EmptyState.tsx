/**
 * Empty state component
 */
import React from 'react';
import Card from '@leafygreen-ui/card';
import { H3, Body } from '@leafygreen-ui/typography';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import Button from '@leafygreen-ui/button';
import Icon from '@leafygreen-ui/icon';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: string;
  actionText?: string;
  onAction?: () => void;
  isFullPage?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  title = 'No Data Found',
  message = 'There are no results to display.',
  icon = 'MagnifyingGlass',
  actionText,
  onAction,
  isFullPage = false
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
        glyph={icon as any} 
        size="large" 
        fill={palette.gray.base} 
      />
      
      <H3>{title}</H3>
      <Body>{message}</Body>
      
      {actionText && onAction && (
        <Button
          variant="primary"
          onClick={onAction}
        >
          {actionText}
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
        <Card style={{ maxWidth: '500px', width: '100%' }}>
          {content}
        </Card>
      </div>
    );
  }

  return <Card>{content}</Card>;
};

export default EmptyState;