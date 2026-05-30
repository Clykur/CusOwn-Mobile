import { useWindowDimensions } from 'react-native';

export const useDeviceType = () => {
  const { width, height } = useWindowDimensions();

  // Standard breakpoints
  const isSmallPhone = width < 375;
  const isPhone = width >= 375 && width < 768;
  const isLargePhone = width >= 414 && width < 768; // Includes Max/Plus models
  const isTablet = width >= 768;
  const isLandscape = width > height;

  return {
    isSmallPhone,
    isPhone,
    isLargePhone,
    isTablet,
    isLandscape,
    windowWidth: width,
    windowHeight: height,
  };
};
