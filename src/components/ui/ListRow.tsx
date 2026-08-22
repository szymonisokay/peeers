import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { usePressScale, useTheme } from '@/hooks';

import { AnimatedPressable } from './AnimatedPressable';
import { Text, type TextTone } from './Text';

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
  /** Colours the title. `danger` is the destructive row of a menu. */
  tone?: TextTone;
};

/**
 * The workhorse row behind most screens. See 07, 11 and 41.
 *
 * Press feedback appears only when `onPress` is given — a row that shrinks
 * under the finger but does nothing promises an action it does not have.
 */
export function ListRow({
  title,
  subtitle,
  right,
  left,
  onPress,
  last = false,
  tone = 'default',
}: ListRowProps) {
  const { colors, spacing } = useTheme();
  const press = usePressScale();

  const rowStyle = [
    styles.row,
    {
      paddingVertical: spacing.md,
      gap: spacing.md,
      borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
  ];

  const content = (
    <>
      {left}
      <View style={styles.grow}>
        <Text variant="bodyMedium" tone={tone}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodySmall" tone="muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </>
  );

  if (!onPress) return <View style={rowStyle}>{content}</View>;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[rowStyle, press.style]}
    >
      {content}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  grow: { flex: 1 },
});
