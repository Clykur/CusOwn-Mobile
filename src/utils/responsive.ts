import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Based on iPhone X standard size
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * Scale horizontally (e.g. for width, horizontal padding/margin)
 */
export const horizontalScale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;

/**
 * Scale vertically (e.g. for height, vertical padding/margin)
 */
export const verticalScale = (size: number) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;

/**
 * Moderate scale for values you want to scale down a bit less aggressively
 */
export const moderateScale = (size: number, factor = 0.5) =>
  size + (horizontalScale(size) - size) * factor;

/**
 * Responsive font sizing based on pixel ratio
 */
export const responsiveFontSize = (size: number) => {
  const newSize = size * (SCREEN_WIDTH / guidelineBaseWidth);
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
};
