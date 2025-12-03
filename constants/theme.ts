export const colors = {
  background: '#ffffff',
  surface: '#f5f5f5',
  surfaceCode: '#e8e8e8',
  border: '#e0e0e0',
  textPrimary: '#000000',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textDisabled: '#cccccc',
  error: '#dc2626',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const typography = {
  headingLarge: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  headingMedium: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  headingSmall: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 22,
  },
  bodySemibold: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  mono: {
    fontFamily: 'monospace' as const,
  },
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 20,
  full: 999,
};
