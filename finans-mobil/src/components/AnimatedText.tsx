import React from 'react';
import { Text, TextStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors } from '../theme';

interface AnimatedTextProps {
  children: string;
  style?: TextStyle;
  delay?: number;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  children,
  style,
  delay = 0,
}) => {
  return (
    <Animated.Text
      entering={FadeIn.delay(delay).duration(500)}
      style={[{ color: colors.onSurface }, style]}
    >
      {children}
    </Animated.Text>
  );
};
