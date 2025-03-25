/**
 * Safety notice component for displaying safety warnings
 */
import React from 'react';
import Callout from '@leafygreen-ui/callout';
import { Body } from '@leafygreen-ui/typography';
import { spacing } from '@leafygreen-ui/tokens';
import { SafetyNotice as SafetyNoticeType } from '../../types/Chunk';

interface SafetyNoticeProps {
  notice: SafetyNoticeType;
}

const SafetyNotice: React.FC<SafetyNoticeProps> = ({ notice }) => {
  // Determine callout variant based on safety notice type
  const getVariant = (type: string) => {
    switch (type.toLowerCase()) {
      case 'danger':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'caution':
        return 'warning';
      default:
        return 'note';
    }
  };

  return (
    <Callout
      variant={getVariant(notice.type)}
      title={notice.type.toUpperCase()}
      style={{ marginBottom: spacing[3] }}
    >
      <Body>{notice.content}</Body>
    </Callout>
  );
};

export default SafetyNotice;