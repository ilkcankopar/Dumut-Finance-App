import { View, Text, ScrollView, Image, FlatList } from 'react-native';
import React from 'react';

const createChainableAnimation = (): any => {
  const animation: any = {
    duration: () => animation,
    delay: () => animation,
    springify: () => animation,
    damping: () => animation,
    stiffness: () => animation,
    mass: () => animation,
    overshootClamping: () => animation,
    restDisplacementThreshold: () => animation,
    restSpeedThreshold: () => animation,
    withCallback: () => animation,
    withInitialValues: () => animation,
    randomDelay: () => animation,
    build: () => animation,
    easing: () => animation,
  };
  return animation;
};

export const FadeIn = createChainableAnimation();
export const FadeInDown = createChainableAnimation();
export const FadeInUp = createChainableAnimation();
export const FadeInLeft = createChainableAnimation();
export const FadeInRight = createChainableAnimation();
export const FadeOut = createChainableAnimation();
export const FadeOutDown = createChainableAnimation();
export const FadeOutUp = createChainableAnimation();
export const SlideInRight = createChainableAnimation();
export const SlideInLeft = createChainableAnimation();
export const SlideOutRight = createChainableAnimation();
export const SlideOutLeft = createChainableAnimation();
export const ZoomIn = createChainableAnimation();
export const ZoomOut = createChainableAnimation();
export const BounceIn = createChainableAnimation();
export const BounceOut = createChainableAnimation();
export const Layout = createChainableAnimation();
export const LinearTransition = createChainableAnimation();
export const SequencedTransition = createChainableAnimation();
export const FadingTransition = createChainableAnimation();
export const JumpingTransition = createChainableAnimation();
export const CurvedTransition = createChainableAnimation();
export const EntryExitTransition = createChainableAnimation();

export const useSharedValue = (init: any) => ({ value: init });
export const useAnimatedStyle = (fn: any) => ({});
export const useDerivedValue = (fn: any) => ({ value: fn() });
export const useAnimatedProps = (fn: any) => ({});
export const useAnimatedScrollHandler = (handlers: any) => () => {};
export const useAnimatedGestureHandler = (handlers: any) => () => {};
export const useAnimatedRef = () => ({ current: null });
export const useScrollViewOffset = () => ({ value: 0 });

export const withTiming = (val: any, config?: any, callback?: any) => val;
export const withSpring = (val: any, config?: any, callback?: any) => val;
export const withSequence = (...args: any[]) => args[0];
export const withRepeat = (val: any, count?: number, reverse?: boolean, callback?: any) => val;
export const withDelay = (delay: number, val: any) => val;
export const withDecay = (config?: any) => 0;
export const cancelAnimation = (sharedValue: any) => {};

export const interpolate = (val: any, inputRange?: any[], outputRange?: any[], extrapolate?: any) => val;
export const interpolateColor = (val: any, inputRange?: any[], outputRange?: any[]) => outputRange?.[0] || '#000';
export const Extrapolate = { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' };
export const Extrapolation = { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' };

export const runOnJS = (fn: any) => fn;
export const runOnUI = (fn: any) => fn;
export const measure = (ref: any) => null;
export const scrollTo = (ref: any, x: number, y: number, animated: boolean) => {};

export const Easing = {
  linear: (t: number) => t,
  ease: (t: number) => t,
  quad: (t: number) => t,
  cubic: (t: number) => t,
  poly: (n: number) => (t: number) => t,
  sin: (t: number) => t,
  circle: (t: number) => t,
  exp: (t: number) => t,
  elastic: (bounciness?: number) => (t: number) => t,
  back: (s?: number) => (t: number) => t,
  bounce: (t: number) => t,
  bezier: (x1: number, y1: number, x2: number, y2: number) => (t: number) => t,
  in: (easing: any) => easing,
  out: (easing: any) => easing,
  inOut: (easing: any) => easing,
};

const Animated = {
  View,
  Text,
  ScrollView,
  FlatList,
  Image,
  createAnimatedComponent: (comp: any) => comp,
};

export default Animated;
