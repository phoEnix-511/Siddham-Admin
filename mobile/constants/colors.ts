// Siddham Wellness Design Tokens — matches the web app palette
export const Colors = {
  // Primary
  forestDark: '#0f2318',
  forest: '#1a3d2b',
  forestMid: '#245c3f',
  sage: '#4a7c59',
  sageMid: '#6b8f71',
  sageLight: '#a8c5af',

  // Accent
  saffron: '#c4852a',
  saffronDark: '#9d6720',
  saffronLight: '#d9a85c',
  saffronPale: '#f5e6cc',

  // Neutrals
  parchment: '#f8f4ee',
  parchmentDark: '#ede7d9',
  cream: '#faf8f4',
  bark: '#8b5e3c',

  // UI
  white: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',

  // Semantic
  success: '#166534',
  successBg: '#dcfce7',
  error: '#991b1b',
  errorBg: '#fee2e2',
  warning: '#92400e',
  warningBg: '#fef3c7',
  info: '#1e40af',
  infoBg: '#dbeafe',
};

export const Fonts = {
  serif: 'PlayfairDisplay_700Bold',
  serifRegular: 'PlayfairDisplay_400Regular',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 24,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};
