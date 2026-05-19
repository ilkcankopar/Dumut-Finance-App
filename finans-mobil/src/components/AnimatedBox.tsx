import React, { ReactNode } from 'react';
import { StyleSheet, ViewStyle, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, spacing } from '../theme';

interface AnimatedBoxProps {
  children: ReactNode;
  variant?: 'default' | 'outlined' | 'elevated' | 'featured';
  style?: ViewStyle;
  delay?: number;
  onPress?: () => void;
  selected?: boolean;
}

export const AnimatedBox: React.FC<AnimatedBoxProps> = ({
  children,
  variant = 'default',
  style,
  delay = 0,
  onPress,
  selected = false,
}) => {
  const boxStyle = [
    styles.base,
    styles[variant],
    selected && styles.selected,
    style,
  ];

  const content = (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      style={boxStyle}
    >
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  base: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  default: {
    backgroundColor: colors.surfaceContainerLowest,
  },
  outlined: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  elevated: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  featured: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 2,
    borderColor: colors.borderDark,
  },
  selected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
});
