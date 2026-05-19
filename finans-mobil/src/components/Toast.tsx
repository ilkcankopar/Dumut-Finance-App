import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ToastConfig } from 'react-native-toast-message';
import { colors, spacing } from '../theme';
import { Icon } from './Icon';

const CustomToast = ({
  type,
  text1,
  text2,
  onPress,
}: {
  type: 'success' | 'error' | 'info';
  text1?: string;
  text2?: string;
  onPress?: () => void;
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'check';
      case 'error':
        return 'times';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return colors.primary;
      case 'error':
        return colors.error;
      case 'info':
        return colors.outline;
      default:
        return colors.primary;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, { borderLeftColor: getBorderColor() }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={[styles.iconWrapper, { backgroundColor: getBorderColor() }]}>
        <Icon name={getIcon()} size={14} color={colors.onPrimary} />
      </View>
      <View style={styles.content}>
        {text1 && <Text style={styles.title}>{text1}</Text>}
        {text2 && <Text style={styles.message}>{text2}</Text>}
      </View>
    </TouchableOpacity>
  );
};

export const toastConfig: ToastConfig = {
  success: (props) => (
    <CustomToast type="success" text1={props.text1} text2={props.text2} onPress={props.onPress} />
  ),
  error: (props) => (
    <CustomToast type="error" text1={props.text1} text2={props.text2} onPress={props.onPress} />
  ),
  info: (props) => (
    <CustomToast type="info" text1={props.text1} text2={props.text2} onPress={props.onPress} />
  ),
};

const styles = StyleSheet.create({
  container: {
    width: '90%',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderLeftWidth: 4,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.onSurface,
    marginBottom: 2,
  },
  message: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
  },
});
