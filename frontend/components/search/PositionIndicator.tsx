'use client';

import React from 'react';
import { Body } from '@leafygreen-ui/typography';
import Icon from '@leafygreen-ui/icon';
import { palette } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';
import Badge from '@leafygreen-ui/badge';
import Tooltip from '@leafygreen-ui/tooltip';

/**
 * PositionIndicator - Visual arrows with tooltips showing position changes
 */
interface PositionIndicatorProps {
  originalPosition?: number;
  newPosition?: number;
  positionChange?: number;
  rerankerScore?: number;
  showTooltip?: boolean;
}

export function PositionIndicator({
  originalPosition,
  newPosition,
  positionChange,
  rerankerScore,
  showTooltip = true,
}: PositionIndicatorProps) {
  if (
    originalPosition === undefined ||
    newPosition === undefined ||
    positionChange === undefined
  ) {
    return null;
  }

  // Determine styling based on position change
  const getIndicatorStyle = () => {
    if (positionChange > 0) {
      // Moved up - green
      return {
        backgroundColor: palette.green.light3,
        borderColor: palette.green.light1,
        textColor: palette.green.dark2,
        iconColor: palette.green.base,
        icon: 'ChevronUp',
        direction: 'up',
      };
    } else if (positionChange < 0) {
      // Moved down - red
      return {
        backgroundColor: palette.red.light3,
        borderColor: palette.red.light1,
        textColor: palette.red.dark2,
        iconColor: palette.red.base,
        icon: 'ChevronDown',
        direction: 'down',
      };
    } else {
      // No change - gray
      return {
        backgroundColor: palette.gray.light3,
        borderColor: palette.gray.light1,
        textColor: palette.gray.dark1,
        iconColor: palette.gray.base,
        icon: 'Minus',
        direction: 'none',
      };
    }
  };

  const style = getIndicatorStyle();
  const absChange = Math.abs(positionChange);

  // Tooltip content
  const tooltipContent = (
    <div style={{ maxWidth: '200px' }}>
      <Body style={{ fontSize: '12px', color: 'white', lineHeight: 1.4 }}>
        {positionChange > 0
          ? `Moved up ${absChange} position${absChange === 1 ? '' : 's'} (${originalPosition} → ${newPosition})`
          : positionChange < 0
          ? `Moved down ${absChange} position${absChange === 1 ? '' : 's'} (${originalPosition} → ${newPosition})`
          : `Position unchanged (${originalPosition})`}
      </Body>
      {rerankerScore && (
        <Body
          style={{
            fontSize: '11px',
            color: palette.gray.light2,
            marginTop: spacing[1],
          }}
        >
          Reranker Score: {rerankerScore.toFixed(4)}
        </Body>
      )}
    </div>
  );

  const indicator = (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: positionChange === 0 ? 0 : spacing[1],
        padding: `${spacing[1]}px ${spacing[2]}px`,
        backgroundColor: style.backgroundColor,
        borderRadius: '12px',
        border: `1px solid ${style.borderColor}`,
        fontSize: '11px',
        fontWeight: '600',
        color: style.textColor,
        cursor: showTooltip ? 'help' : 'default',
        transition: 'all 0.2s ease',
      }}
    >
      {positionChange !== 0 && <Icon glyph={style.icon as any} size={12} fill={style.iconColor} />}
      <span>{positionChange === 0 ? '=' : absChange}</span>
    </div>
  );

  if (showTooltip) {
    return (
      <Tooltip trigger={indicator} triggerEvent="hover">
        {tooltipContent}
      </Tooltip>
    );
  }

  return indicator;
}

/**
 * PositionBadge - Compact badges for inline display
 */
interface PositionBadgeProps {
  originalPosition?: number;
  newPosition?: number;
  positionChange?: number;
  size?: 'small' | 'default';
}

export function PositionBadge({
  originalPosition,
  newPosition,
  positionChange,
  size = 'small',
}: PositionBadgeProps) {
  if (
    originalPosition === undefined ||
    newPosition === undefined ||
    positionChange === undefined
  ) {
    return null;
  }

  const getVariant = (): 'green' | 'red' | 'lightgray' => {
    if (positionChange > 0) return 'green';
    if (positionChange < 0) return 'red';
    return 'lightgray';
  };

  const getDisplayText = () => {
    if (positionChange > 0) return `↑${Math.abs(positionChange)}`;
    if (positionChange < 0) return `↓${Math.abs(positionChange)}`;
    return '=';
  };

  return (
    <Badge variant={getVariant()}>
      {getDisplayText()}
    </Badge>
  );
}

/**
 * RerankingSummary - Statistics panel showing overall reranking impact
 */
interface RerankingSummaryProps {
  positionStats?: {
    moved_up: number;
    moved_down: number;
    unchanged: number;
    total_tracked: number;
  };
  reranking?: {
    reranking_applied: boolean;
    reranker_model?: string;
    rerank_time?: number;
  };
  className?: string;
}

export function RerankingSummary({
  positionStats,
  reranking,
  className,
}: RerankingSummaryProps) {
  if (!positionStats || !reranking?.reranking_applied) {
    return null;
  }

  const { moved_up, moved_down, unchanged, total_tracked } = positionStats;

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing[2],
        padding: `${spacing[1]}px ${spacing[3]}px`,
        backgroundColor: palette.blue.light3,
        borderRadius: '8px',
        border: `1px solid ${palette.blue.light1}`,
        fontSize: '12px',
      }}
    >
      <Icon glyph="Diagram3" size={14} fill={palette.blue.base} />
      <Body
        style={{
          fontSize: '12px',
          color: palette.blue.dark2,
          fontWeight: '600',
          margin: 0,
        }}
      >
        Reranked with Voyage AI:
      </Body>

      {moved_up > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[1],
          }}
        >
          <Icon glyph="ChevronUp" size={12} fill={palette.green.base} />
          <Body style={{ fontSize: '11px', color: palette.green.dark2, margin: 0 }}>
            {moved_up} improved
          </Body>
        </div>
      )}

      {moved_down > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[1],
          }}
        >
          <Icon glyph="ChevronDown" size={12} fill={palette.red.base} />
          <Body style={{ fontSize: '11px', color: palette.red.dark2, margin: 0 }}>
            {moved_down} declined
          </Body>
        </div>
      )}

      {unchanged > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[1],
          }}
        >
          <Icon glyph="Minus" size={12} fill={palette.gray.base} />
          <Body style={{ fontSize: '11px', color: palette.gray.dark1, margin: 0 }}>
            {unchanged} unchanged
          </Body>
        </div>
      )}
    </div>
  );
}

