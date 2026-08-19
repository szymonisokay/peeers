import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { useReducedMotion, useTheme } from '@/hooks';

/** Thin accent-filled track. `value` is 0..1. Seen on 35. */
export function ProgressBar({ value }: { value: number }) {
  const { colors, motion, radius } = useTheme();
  const reduced = useReducedMotion();
  const clamped = Math.min(1, Math.max(0, value));

  const fillStyle = useAnimatedStyle(() => ({
    width: reduced
      ? `${clamped * 100}%`
      : withTiming(`${clamped * 100}%`, { duration: motion.duration.base }),
  }));

  return (
    <View
      accessibilityRole="progressbar"
      style={[styles.track, { backgroundColor: colors.border, borderRadius: radius.pill }]}
    >
      <Animated.View
        style={[
          styles.fill,
          fillStyle,
          { backgroundColor: colors.accent, borderRadius: radius.pill },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 6, overflow: 'hidden' },
  fill: { height: '100%' },
});
