/**
 * Weight slider component for hybrid search
 */
import React from 'react';
import Slider from '@leafygreen-ui/slider';
import { Body } from '@leafygreen-ui/typography';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import Card from '@leafygreen-ui/card';
import Icon from '@leafygreen-ui/icon';
import Tooltip from '@leafygreen-ui/tooltip';

interface WeightSliderProps {
  vectorWeight: number;
  onWeightChange: (vectorWeight: number, textWeight: number) => void;
}

const WeightSlider: React.FC<WeightSliderProps> = ({
  vectorWeight = 0.7,
  onWeightChange,
}) => {
  // Text weight is always the complement of vector weight
  const textWeight = 1 - vectorWeight;
  
  const handleChange = (newValue: number) => {
    // Ensure the value is between 0 and 1
    const newVectorWeight = Math.max(0, Math.min(1, newValue));
    const newTextWeight = 1 - newVectorWeight;
    
    onWeightChange(newVectorWeight, newTextWeight);
  };
  
  return (
    <Card style={{ padding: spacing[3], marginBottom: spacing[3] }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: spacing[2]
      }}>
        <Body weight="medium">Search Weight Balance</Body>
        
        <Tooltip
          trigger={<Icon glyph="InfoWithCircle" />}
          triggerEvent="hover"
          align="top"
        >
          Adjust the balance between semantic and keyword search approaches
        </Tooltip>
      </div>
      
      <div style={{ 
        display: 'flex',
        marginBottom: spacing[2],
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
          <Icon glyph="Diagram" size="small" fill={palette.green.base} />
          <Body size="small">Semantic: {Math.round(vectorWeight * 100)}%</Body>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
          <Body size="small">Keyword: {Math.round(textWeight * 100)}%</Body>
          <Icon glyph="Type" size="small" fill={palette.blue.base} />
        </div>
      </div>
      
      <Slider
        min={0}
        max={1}
        step={0.05}
        value={vectorWeight}
        onChange={handleChange}
        label="Search Weight Balance"
      />
      
      <div style={{ 
        display: 'flex',
        marginTop: spacing[1],
        justifyContent: 'space-between'
      }}>
        <div style={{ 
          width: `${vectorWeight * 100}%`, 
          height: '4px', 
          backgroundColor: palette.green.light1,
          borderRadius: '4px 0 0 4px',
          transition: 'width 0.3s ease-in-out'
        }} />
        <div style={{ 
          width: `${textWeight * 100}%`, 
          height: '4px', 
          backgroundColor: palette.blue.light1,
          borderRadius: '0 4px 4px 0',
          transition: 'width 0.3s ease-in-out'
        }} />
      </div>
    </Card>
  );
};

export default WeightSlider;