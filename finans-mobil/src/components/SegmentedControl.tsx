import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';

interface SegmentOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  selectedValue,
  onValueChange,
}) => {
  return (
    <View style={styles.container}>
      {options.map((option, index) => {
        const isSelected = option.value === selectedValue;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;

        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.segment,
              isSelected && styles.segmentSelected,
              isFirst && styles.segmentFirst,
              isLast && styles.segmentLast,
            ]}
            onPress={() => onValueChange(option.value)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                isSelected && styles.segmentTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: borderRadius.default,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRightWidth: 1,
    borderRightColor: colors.borderDark,
  },
  segmentFirst: {
    borderTopLeftRadius: borderRadius.default - 1,
    borderBottomLeftRadius: borderRadius.default - 1,
  },
  segmentLast: {
    borderTopRightRadius: borderRadius.default - 1,
    borderBottomRightRadius: borderRadius.default - 1,
    borderRightWidth: 0,
  },
  segmentSelected: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    letterSpacing: 0.3,
    color: colors.onSurface,
  },
  segmentTextSelected: {
    color: colors.onPrimary,
  },
});
