'use client';

import React from 'react';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';

interface CustomButtonProps {
  onClick?: () => void;
  leftGlyph?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
  minWidth?: string | number;
  width?: string | number;
}

/**
 * Custom button component styled to match LeafyGreen Button appearance
 * but with full width control for multi-language search buttons
 */
const CustomButton: React.FC<CustomButtonProps> = ({
  onClick,
  leftGlyph,
  children,
  style = {},
  minWidth,
  width
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    padding: `${spacing[1]}px ${spacing[2]}px`,
    fontSize: '14px',
    fontWeight: 500,
    fontFamily: "'Euclid Circular A', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    lineHeight: '20px',
    border: `1px solid ${palette.yellow.dark2}`,
    borderRadius: '6px',
    backgroundColor: 'transparent',
    color: palette.yellow.dark2,
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    outline: 'none',
    boxSizing: 'border-box',
    ...(minWidth && { minWidth }),
    ...(width && { width }),
    ...style
  };

  const hoverStyle: React.CSSProperties = {
    backgroundColor: palette.yellow.light2,
    borderColor: palette.yellow.dark1,
    transform: 'translateY(-1px)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  };

  const activeStyle: React.CSSProperties = {
    transform: 'translateY(0)',
    boxShadow: 'none'
  };

  const [isActive, setIsActive] = React.useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsActive(false);
      }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      onFocus={(e) => {
        e.target.style.outline = `2px solid ${palette.yellow.base}`;
        e.target.style.outlineOffset = '2px';
      }}
      onBlur={(e) => {
        e.target.style.outline = 'none';
      }}
      style={{
        ...baseStyle,
        ...(isHovered && !isActive ? hoverStyle : {}),
        ...(isActive ? activeStyle : {})
      }}
    >
      {leftGlyph && (
        <span style={{ display: 'flex', alignItems: 'center' }}>
          {leftGlyph}
        </span>
      )}
      {children}
    </button>
  );
};

export default CustomButton;


