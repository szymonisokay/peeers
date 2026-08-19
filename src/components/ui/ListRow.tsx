import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './Text';

type ListRowProps = {
  title: string;
  subtitle?: string;
  /** Rendered on the right: an avatar, a chevron, a badge. */
  right?: ReactNode;
  /** Rendered on the left: a checkbox, an icon. */
  left?: ReactNode;
  onPress?: () => void;
  /** Hide the separator on the last row of a group. */
  last?: boolean;
};

/** The workhorse row behind most screens. See 07, 11 and 41. */
export function ListRow({ title, subtitle, right, left, onPress, last = false }: ListRowProps) {
  const { colors, spacing } = useTheme();

  const content = (
    <View
      style={[
        styles.row,
        {
          paddingVertical: spacing.md,
          gap: spacing.md,
          borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
      ]}
    >
      {left}
      <View style={styles.grow}>
        <Text variant="bodyMedium">{title}</Text>
        {subtitle ? (
          <Text variant="bodySmall" tone="muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  grow: { flex: 1 },
});
