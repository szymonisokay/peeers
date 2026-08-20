import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useReducedMotion, useTheme } from '@/hooks';

import { AnimatedPressable } from './AnimatedPressable';
import { Text } from './Text';

type StepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

/**
 * The − 1 + control from 28.
 *
 * The signs are text rather than icons on purpose: 28 draws bare glyphs, and
 * the icon set has no plain minus — only `minus-circle`, which is a different
 * drawing. See docs/DESIGN.md on naming icons by shape.
 */
export function Stepper({ value, onChange, min = 1, max = 99 }: StepperProps) {
  const { colors, controlHeight, radius, spacing } = useTheme();

  // The same height as a filled TextField, because 28 stands the two side by
  // side as one row. The buttons fill what the padding leaves.
  const step = controlHeight - spacing.xs * 2;

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.tileFill,
          borderRadius: radius.md,
          height: controlHeight,
          padding: spacing.xs,
          gap: spacing.sm,
        },
      ]}
    >
      <Step label="−" size={step} disabled={value <= min} onPress={() => onChange(value - 1)} />
      <Text variant="bodyMedium" style={styles.value}>
        {String(value)}
      </Text>
      <Step
        label="+"
        size={step}
        accent
        disabled={value >= max}
        onPress={() => onChange(value + 1)}
      />
    </View>
  );
}

type StepProps = {
  label: string;
  onPress: () => void;
  disabled: boolean;
  size: number;
  /** 28 draws the plus in the accent colour and the minus in the text colour. */
  accent?: boolean;
};

/**
 * One sign.
 *
 * 28 draws a standing light tile behind the plus. Here that tile is the press
 * feedback instead: nothing until the finger lands, then a tile under it, on
 * whichever sign was pressed. A deliberate departure from the drawing, decided
 * by the repo owner — a control this small needs to say it was hit more than it
 * needs to say which half is the plus.
 */
function Step({ label, onPress, disabled, size, accent = false }: StepProps) {
  const { colors, motion, radius } = useTheme();
  const reduced = useReducedMotion();
  const pressed = useSharedValue(0);

  const tile = useAnimatedStyle(() => ({ opacity: pressed.value }));

  const press = (down: boolean) => {
    const next = Number(down);
    // Reduced motion silences the fade, not the feedback: the tile still has to
    // appear, or the press has nothing to show for itself.
    pressed.value = reduced ? next : withTiming(next, { duration: motion.duration.fast });
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => press(true)}
      onPressOut={() => press(false)}
      style={[
        styles.step,
        { width: size, height: size, opacity: disabled ? 0.35 : 1 },
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          tile,
          { backgroundColor: colors.surface, borderRadius: radius.sm },
        ]}
      />
      <Text variant="bodyMedium" style={{ color: accent ? colors.accent : colors.text }}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  step: { alignItems: 'center', justifyContent: 'center' },
  value: { minWidth: 24, textAlign: 'center' },
});
