import { View, Text } from 'react-native';
import React from 'react';

export const MotiView = View;
export const MotiText = Text;
export const MotiImage = View;
export const AnimatePresence = ({ children }: any) => children;

export const useAnimationState = () => ({
  current: 'from',
  transitionTo: () => {},
});
