import { StyleSheet } from 'react-native';

import { usePressScale, useTheme } from '@/hooks';

import { Text } from './Text';
import { AnimatedPressable } from './AnimatedPressable';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

/** Pill-shaped tag. Seen on 01 (Dom / Praca / Wyjazd) and 15 (frequent items). */
export function Chip({ label, selected = false, onPress }: ChipProps) {
  const { colors, radius, spacing, scheme } = useTheme();
  const press = usePressScale();

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[
        styles.chip,
        {
          backgroundColor: selected
            ? colors.accent
            : scheme === 'dark'
              ? colors.surface
              : colors.background,
          borderColor: selected ? colors.accent : colors.border,
          borderRadius: radius.pill,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
        },
        press.style,
      ]}
    >
      <Text variant="bodySmall" style={selected ? { color: '#FFFFFF' } : undefined}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: { borderWidth: StyleSheet.hairlineWidth, alignSelf: 'flex-start' },
});
