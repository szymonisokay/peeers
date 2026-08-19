import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

/** Thin accent-filled track. `value` is 0..1. Seen on 35. */
export function ProgressBar({ value }: { value: number }) {
  const { colors, radius } = useTheme();
  const clamped = Math.min(1, Math.max(0, value));

  return (
    <View
      accessibilityRole="progressbar"
      style={[styles.track, { backgroundColor: colors.border, borderRadius: radius.pill }]}
    >
      <View
        style={[
          styles.fill,
          {
            backgroundColor: colors.accent,
            borderRadius: radius.pill,
            width: `${clamped * 100}%`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 6, overflow: 'hidden' },
  fill: { height: '100%' },
});
