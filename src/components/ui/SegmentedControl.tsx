import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './Text';

type SegmentedControlProps<T extends string> = {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
};

/** Two-or-more choice, selected segment filled with the accent. Seen on 11. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const { colors, radius, spacing, scheme } = useTheme();

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
      {options.map((option) => {
        const selected = option === value;

        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option)}
            style={{
              backgroundColor: selected ? colors.accent : 'transparent',
              borderRadius: radius.pill,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.lg,
            }}
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
});
