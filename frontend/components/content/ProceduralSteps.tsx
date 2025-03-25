/**
 * Procedural steps component for displaying step-by-step instructions
 */
import React from 'react';
import Card from '@leafygreen-ui/card';
import { H3, Body } from '@leafygreen-ui/typography';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import { ProceduralStep } from '../../types/Chunk';
import Icon from '@leafygreen-ui/icon';

interface ProceduralStepsProps {
  steps: ProceduralStep[];
  title?: string;
}

const ProceduralSteps: React.FC<ProceduralStepsProps> = ({ 
  steps,
  title = 'Procedure'
}) => {
  if (!steps || steps.length === 0) {
    return null;
  }

  return (
    <Card style={{ marginBottom: spacing[3], padding: spacing[3] }}>
      <H3 style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: spacing[2],
        marginBottom: spacing[2],
        color: palette.green.dark1
      }}>
        <Icon 
          glyph="Checkmark" 
          fill={palette.green.base} 
          size="small" 
        />
        {title}
      </H3>
      
      <div style={{ paddingLeft: spacing[2] }}>
        {steps.map((step, index) => (
          <div 
            key={index}
            style={{ 
              display: 'flex',
              marginBottom: index === steps.length - 1 ? 0 : spacing[2],
              position: 'relative',
            }}
          >
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '28px',
              height: '28px',
              backgroundColor: palette.green.light2,
              borderRadius: '50%',
              marginRight: spacing[2],
              fontWeight: 'bold',
              color: palette.green.dark1,
              flexShrink: 0
            }}>
              {step.marker}
            </div>
            
            <Body style={{ paddingTop: '4px' }}>
              {step.instruction}
            </Body>
            
            {/* Vertical line connecting steps */}
            {index !== steps.length - 1 && (
              <div style={{
                position: 'absolute',
                left: '14px',
                top: '28px',
                bottom: '-14px',
                width: '2px',
                backgroundColor: palette.green.light2,
              }} />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ProceduralSteps;