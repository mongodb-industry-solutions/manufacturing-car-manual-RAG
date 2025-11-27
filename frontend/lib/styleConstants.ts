import { palette } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';

/**
 * Professional styling constants following UI Design System Guide
 */

// Card Styles
export const CARD_STYLES = {
  base: {
    padding: spacing[4],
    backgroundColor: 'white',
    border: `1px solid ${palette.gray.light2}`,
    borderRadius: '8px',
    boxShadow: '0 3px 8px rgba(0,0,0,0.12)',
    transition: 'all 0.2s ease-in-out',
  },
  hoverable: {
    cursor: 'pointer',
  },
  metric: {
    background: `linear-gradient(135deg, ${palette.blue.light2}, ${palette.blue.light3})`,
    border: `1px solid ${palette.blue.light1}`,
    padding: spacing[4],
    borderRadius: '8px',
    textAlign: 'center' as const,
    color: palette.blue.dark2,
    boxShadow: '0 3px 8px rgba(0,0,0,0.12)',
  },
} as const;

// Badge Styles
export const BADGE_STYLES = {
  similarityScore: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[1],
    padding: `${spacing[1]}px ${spacing[2]}px`,
    borderRadius: '16px',
    backgroundColor: palette.green.light2,
    color: palette.green.dark2,
    border: `1px solid ${palette.green.base}`,
    fontSize: '12px',
    fontWeight: 600,
  },
  textScore: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[1],
    padding: `${spacing[1]}px ${spacing[2]}px`,
    borderRadius: '16px',
    backgroundColor: palette.blue.light2,
    color: palette.blue.dark2,
    border: `1px solid ${palette.blue.base}`,
    fontSize: '12px',
    fontWeight: 600,
  },
  hybridScore: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[1],
    padding: `${spacing[1]}px ${spacing[2]}px`,
    borderRadius: '16px',
    backgroundColor: palette.purple.light2,
    color: palette.purple.dark2,
    border: `1px solid ${palette.purple.base}`,
    fontSize: '12px',
    fontWeight: 600,
  },
} as const;

// Section Header Style
export const SECTION_HEADER_STYLE = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: spacing[4],
  paddingBottom: spacing[2],
  borderBottom: `1px solid ${palette.gray.light2}`,
} as const;

// Flex Container Styles
export const FLEX_STYLES = {
  center: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
  },
  spaceBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  column: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing[3],
  },
} as const;

// Processing State Indicators
export const PROCESSING_STATE_STYLES = {
  active: {
    backgroundColor: palette.blue.light3,
    border: `1px solid ${palette.blue.light2}`,
    color: palette.blue.dark2,
  },
  completed: {
    backgroundColor: palette.green.light3,
    border: `1px solid ${palette.green.light2}`,
    color: palette.green.dark2,
  },
  pending: {
    backgroundColor: 'transparent',
    color: palette.gray.dark1,
  },
} as const;

// Status Badge Styles
export const STATUS_BADGE_STYLES = {
  success: {
    backgroundColor: palette.green.light2,
    color: palette.green.dark2,
    border: `1px solid ${palette.green.base}`,
  },
  warning: {
    backgroundColor: palette.yellow.light2,
    color: palette.yellow.dark2,
    border: `1px solid ${palette.yellow.base}`,
  },
  error: {
    backgroundColor: palette.red.light2,
    color: palette.red.dark2,
    border: `1px solid ${palette.red.base}`,
  },
  info: {
    backgroundColor: palette.blue.light2,
    color: palette.blue.dark2,
    border: `1px solid ${palette.blue.base}`,
  },
} as const;

