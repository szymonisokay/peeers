import { useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutRectangle } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { useReducedMotion, useTheme } from '@/hooks';

import { Text } from './Text';

type SegmentedControlProps<T extends string> = {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
};

/**
 * Two-or-more choice, selected segment filled with the accent. Seen on 11.
 *
 * The filled pill is a single absolutely-positioned view that slides between
 * segments, rather than a background repainted on each option — that is what
 * makes switching read as one object moving instead of two things blinking.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const { colors, motion, radius, spacing, scheme } = useTheme();
  const reduced = useReducedMotion();
  const [layouts, setLayouts] = useState<Record<string, LayoutRectangle>>({});

  const target = layouts[value];

  const pillStyle = useAnimatedStyle(() => {
    if (!target) return { opacity: 0 };

    const duration = reduced ? motion.duration.instant : motion.duration.base;

    return {
      opacity: 1,
      width: withTiming(target.width, { duration }),
      transform: [{ translateX: withTiming(target.x, { duration }) }],
    };
  });

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: scheme === 'dark' ? colors.background : colors.border,
          borderRadius: radius.pill,
          padding: 2,
        },
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.pill,
          pillStyle,
          { backgroundColor: colors.accent, borderRadius: radius.pill },
        ]}
      />
      {options.map((option) => {
        const selected = option === value;

        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option)}
            onLayout={(event) => {
              // Read the layout synchronously: React recycles the event object,
              // so touching it inside the lazy state updater yields null.
              const { layout } = event.nativeEvent;
              setLayouts((current) => ({ ...current, [option]: layout }));
            }}
            style={{ paddingVertical: spacing.sm, paddingHorizontal: spacing.lg }}
          >
            <Text
              variant="bodySmall"
              tone={selected ? 'default' : 'muted'}
              style={selected ? { color: '#FFFFFF' } : undefined}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', alignSelf: 'flex-start' },
  pill: { position: 'absolute', top: 2, bottom: 2, left: 0 },
});
