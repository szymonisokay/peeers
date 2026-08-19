import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './Text';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

/** Pill-shaped tag. Seen on 01 (Dom / Praca / Wyjazd) and 15 (frequent items). */
export function Chip({ label, selected = false, onPress }: ChipProps) {
  const { colors, radius, spacing, scheme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
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
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text variant="bodySmall" style={selected ? { color: '#FFFFFF' } : undefined}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { borderWidth: StyleSheet.hairlineWidth, alignSelf: 'flex-start' },
});
