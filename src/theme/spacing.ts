// Assuming moderateScale is used for spacing to allow for slight adjustments based on device size.
// To use with Tailwind, we might just define the base pixel values here, and Tailwind's px will handle it, or we configure tailwind to use our custom values.
// Given the user wants a standard scale replacing arbitrary values.

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
  luxury: 24, // legacy mapping if needed, or replace entirely
  premium: 32,
};

export const spacingTokens = {
  xs: `${spacing.xs}px`,
  sm: `${spacing.sm}px`,
  md: `${spacing.md}px`,
  lg: `${spacing.lg}px`,
  xl: `${spacing.xl}px`,
  '2xl': `${spacing['2xl']}px`,
  '3xl': `${spacing['3xl']}px`,
  '4xl': `${spacing['4xl']}px`,
  luxury: `${spacing.luxury}px`,
  premium: `${spacing.premium}px`,
};
