import { Dimensions } from 'react-native';

import { getColumns } from './grid';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Global spacing token scale to be used in calculation
const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
};

export const getCardWidth = (
  containerWidth: number = SCREEN_WIDTH,
  gap: number = SPACING.md,
  padding: number = SPACING.md * 2, // Left + Right screen padding
  isLandscape: boolean = false,
) => {
  const columns = getColumns(containerWidth, isLandscape);

  // Total available width minus screen padding and gaps between columns
  const availableWidth = containerWidth - padding;
  const totalGapSpace = gap * (columns - 1);

  return (availableWidth - totalGapSpace) / columns;
};

// Returns a proportional height for horizontal scrolling cards
export const getHorizontalCardSize = (
  type: 'small' | 'medium' | 'large' = 'medium',
  screenWidth: number = SCREEN_WIDTH,
) => {
  const isTablet = screenWidth >= 768;

  switch (type) {
    case 'small':
      return {
        width: isTablet ? 180 : 140,
        height: isTablet ? 200 : 160,
      };
    case 'large':
      return {
        width: isTablet ? 320 : 280,
        height: isTablet ? 360 : 320,
      };
    case 'medium':
    default:
      return {
        width: isTablet ? 240 : 200,
        height: isTablet ? 280 : 240,
      };
  }
};
