import { TextStyle } from 'react-native';

export const typography = {
  displayLg: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 48,
    lineHeight: 56,
    letterSpacing: -0.5,
  } as TextStyle,

  headlineLg: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.2,
  } as TextStyle,

  headlineMd: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 24,
    lineHeight: 32,
  } as TextStyle,

  headlineSm: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
    lineHeight: 28,
  } as TextStyle,

  bodyLg: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 18,
    lineHeight: 28,
  } as TextStyle,

  bodyMd: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,

  bodySm: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,

  labelCaps: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  } as TextStyle,

  labelMd: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,

  labelSm: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    lineHeight: 16,
  } as TextStyle,
} as const;

export type Typography = typeof typography;
