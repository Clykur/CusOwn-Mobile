import { colors, BASE_COLORS } from './colors';
import { spacing } from './spacing';
import { radius } from './radius';
import { typography } from './typography';

export { BASE_COLORS };

export const THEME = {
  colors,
  gradient: {
    start: BASE_COLORS.vibrantMint,
    end: BASE_COLORS.forestGreen,
    colors: [BASE_COLORS.vibrantMint, BASE_COLORS.forestGreen] as string[],
  },
  spacing,
  borderRadius: radius,
  typography,
};
