export const colors = {
  // Primary - Siyah
  primary: '#1a1a1a',
  onPrimary: '#ffffff',
  primaryContainer: '#2a2a2a',
  onPrimaryContainer: '#e0e0e0',

  // Secondary - Gri
  secondary: '#6a6a6a',
  onSecondary: '#ffffff',
  secondaryContainer: '#e0e0e0',
  onSecondaryContainer: '#3a3a3a',

  // Surface - Beyaz/Açık Gri
  surface: '#ffffff',
  surfaceDim: '#f8f8f8',
  surfaceBright: '#ffffff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#fafafa',
  surfaceContainer: '#f5f5f5',
  surfaceContainerHigh: '#f0f0f0',
  surfaceContainerHighest: '#e8e8e8',
  surfaceVariant: '#f5f5f5',

  // On Surface - Siyah/Koyu Gri
  onSurface: '#1a1a1a',
  onSurfaceVariant: '#666666',

  // Inverse
  inverseSurface: '#1a1a1a',
  inverseOnSurface: '#ffffff',
  inversePrimary: '#e0e0e0',

  // Outline
  outline: '#999999',
  outlineVariant: '#e0e0e0',

  // Error - Koyu Gri (uyarı için)
  error: '#333333',
  onError: '#ffffff',
  errorContainer: '#f0f0f0',
  onErrorContainer: '#1a1a1a',

  // Success - Siyah
  success: '#1a1a1a',
  onSuccess: '#ffffff',

  // Background - Beyaz
  background: '#ffffff',
  onBackground: '#1a1a1a',

  // Semantic (for finance) - Siyah-Gri tonları
  positive: '#1a1a1a',
  negative: '#4a4a4a',

  // Borders
  borderLight: '#e8e8e8',
  borderDark: '#1a1a1a',

  // Chart colors - Siyah-Gri tonları
  chart1: '#1a1a1a',
  chart2: '#4a4a4a',
  chart3: '#7a7a7a',
  chart4: '#9a9a9a',
  chart5: '#bababa',
  chart6: '#dadada',
} as const;

export type Colors = typeof colors;
