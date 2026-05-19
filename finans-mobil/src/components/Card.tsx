import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'outlined' | 'featured';
  style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  style,
}) => {
  return (
    <View style={[styles.base, styles[variant], style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
  },
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.surfaceContainerHighest,
  },
  featured: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primaryContainer,
  },
});
