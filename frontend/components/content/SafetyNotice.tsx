/**
 * Safety notice component for displaying safety warnings
 */
import React from 'react';
import Callout from '@leafygreen-ui/callout';
import { MyBody as Body } from '@/components/ui/TypographyWrapper';
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
        return 'warning'; // LeafyGreen only has 'warning', not 'danger'
      case 'warning':
        return 'warning';
      case 'caution':
        return 'warning';
      default:
        return 'note';
    }
  };

  const variant = getVariant(notice.type);
  
  return (
    <div style={{ marginBottom: spacing[3] }}>
      <Callout
        variant={variant as any}
        title={notice.type.toUpperCase()}
      >
        <Body>{notice.content}</Body>
      </Callout>
    </div>
  );
};

export default SafetyNotice;