import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Icon } from '@/components/Icon';
import { usePressScale, useReducedMotion, useTheme } from '@/hooks';

import { Text } from './Text';

type CheckboxRowProps = {
  title: string;
  subtitle?: string;
  checked?: boolean;
  onToggle?: () => void;
  onPress?: () => void;
  last?: boolean;
  /** Rendered on the right: the author's avatar on 07, a checker's name below it. */
  right?: ReactNode;
  /**
   * Horizontal padding inside the row. The separator is drawn on the row's own
   * edge, so it still runs the full width of the screen — which is how 07 draws
   * it, unlike a row that has been inset by its container.
   */
  paddingX?: number;
};

/**
 * Shopping-list item — the most repeated interaction in the app.
 *
 * The row itself carries the layout animation, so when checking an item moves
 * it into the "odhaczone" group it travels there instead of teleporting.
 * See 07 and its dark counterpart 39.
 *
 * A checked row dims as a whole rather than only in its title: on 07 the filled
 * circle is visibly lighter than the accent used elsewhere on the same screen,
 * which is what the accent looks like at this opacity.
 */
export function CheckboxRow({
  title,
  subtitle,
  checked = false,
  onToggle,
  onPress,
  last = false,
  right,
  paddingX = 0,
}: CheckboxRowProps) {
  const { colors, motion, spacing } = useTheme();
  const reduced = useReducedMotion();
  const press = usePressScale();
  const box = 26;

  const progress = useDerivedValue(() =>
    reduced
      ? Number(checked)
      : withSpring(Number(checked), motion.spring)
  );

  const boxStyle = useAnimatedStyle(() => ({
    backgroundColor: progress.value > 0.5 ? colors.accent : 'transparent',
    borderColor: progress.value > 0.5 ? colors.accent : colors.border,
    transform: [{ scale: 0.9 + progress.value * 0.1 }],
  }));

  const tickStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.6 + progress.value * 0.4 }],
  }));

  const dimStyle = useAnimatedStyle(() => ({
    opacity: reduced
      ? checked
        ? 0.55
        : 1
      : withTiming(checked ? 0.55 : 1, { duration: motion.duration.fast }),
  }));

  return (
    <Animated.View
      layout={reduced ? undefined : LinearTransition.duration(motion.duration.base)}
      entering={reduced ? undefined : FadeIn.duration(motion.duration.base)}
      exiting={reduced ? undefined : FadeOut.duration(motion.duration.fast)}
    >
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={onPress ?? onToggle}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
      >
        <Animated.View
          style={[
            styles.row,
            press.style,
            dimStyle,
            {
              paddingVertical: spacing.md,
              paddingHorizontal: paddingX,
              gap: spacing.md,
              borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Pressable onPress={onToggle} hitSlop={spacing.sm}>
            <Animated.View
              style={[
                styles.box,
                boxStyle,
                { width: box, height: box, borderRadius: box / 2 },
              ]}
            >
              <Animated.View style={tickStyle}>
                <Icon name="check-bold" size={16} color="#FFFFFF" />
              </Animated.View>
            </Animated.View>
          </Pressable>

          <View style={styles.grow}>
            <Text
              variant="bodyMedium"
              tone={checked ? 'muted' : 'default'}
              style={checked ? styles.struck : undefined}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text variant="bodySmall" tone="muted">
                {subtitle}
              </Text>
            ) : null}
          </View>

          {right}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  grow: { flex: 1 },
  box: { borderWidth: 1.9, alignItems: 'center', justifyContent: 'center' },
  struck: { textDecorationLine: 'line-through' },
});
