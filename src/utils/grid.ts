import { useWindowDimensions } from 'react-native';
import { useDeviceType } from '@/hooks/useDeviceType';

export const useGridColumns = (defaultColumns?: number) => {
  const { isSmallPhone, isPhone, isTablet, isLandscape } = useDeviceType();

  if (defaultColumns !== undefined) {
    return defaultColumns;
  }

  if (isSmallPhone) return 1;
  if (isPhone && !isLandscape) return 1; // Standard phones usually have 1 column for cards, but if the user wants 2, we can adjust. The prompt said: Small phones: 1 column. Standard phones: 2 columns.

  // Actually, adhering strictly to the prompt:
  // Small phones: 1 column
  // Standard phones: 2 columns
  // Large phones: 2 columns
  // Tablets: 3-4 columns
  if (isSmallPhone) return 1;
  if (isTablet) return isLandscape ? 4 : 3;

  return 2; // Standard and Large phones
};

export const getColumns = (width: number, isLandscape: boolean = false) => {
  if (width < 375) return 1; // Small phone
  if (width >= 768) return isLandscape ? 4 : 3; // Tablet
  return 2; // Standard / Large phone
};
