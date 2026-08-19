import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { useTheme } from '@/theme';

import { Text } from './Text';

type CheckboxRowProps = {
  title: string;
  subtitle?: string;
  checked?: boolean;
  onToggle?: () => void;
  onPress?: () => void;
  last?: boolean;
};

/**
 * Shopping-list item. Unchecked is an empty ring; checked fills with the accent
 * and strikes the title through. See 07 and its dark counterpart 39.
 */
export function CheckboxRow({
  title,
  subtitle,
  checked = false,
  onToggle,
  onPress,
  last = false,
}: CheckboxRowProps) {
  const { colors, spacing } = useTheme();
  const box = 26;

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onPress ?? onToggle}
      style={({ pressed }) => [
        styles.row,
        {
          paddingVertical: spacing.md,
          gap: spacing.md,
          borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
          opacity: pressed ? 0.6 : 1,
        },
      ]}
    >
      <Pressable onPress={onToggle} hitSlop={spacing.sm}>
        <View
          style={[
            styles.box,
            {
              width: box,
              height: box,
              borderRadius: box / 2,
              backgroundColor: checked ? colors.accent : 'transparent',
              borderColor: checked ? colors.accent : colors.border,
            },
          ]}
        >
          {checked ? <Icon name="odhaczone-grube" size={16} color="#FFFFFF" /> : null}
        </View>
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  grow: { flex: 1 },
  box: { borderWidth: 1.9, alignItems: 'center', justifyContent: 'center' },
  struck: { textDecorationLine: 'line-through' },
});
