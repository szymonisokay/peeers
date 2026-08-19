import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'plain';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
};

/**
 * Pill button in three weights. See 32 for primary and secondary side by side.
 *
 * Height comes from the spacing scale rather than a fixed number, so the button
 * grows with the text-size setting from 22 once that is wired up.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: ButtonProps) {
  const { colors, radius, spacing } = useTheme();

  const surface: Record<ButtonVariant, ViewStyle> = {
    primary: { backgroundColor: colors.accent },
    secondary: {
      backgroundColor: 'transparent',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    plain: { backgroundColor: 'transparent' },
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          borderRadius: radius.pill,
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.xl,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
        surface[variant],
        style,
      ]}
    >
      <Text
        variant="bodyMedium"
        tone={variant === 'primary' ? 'default' : 'accent'}
        style={variant === 'primary' ? { color: '#FFFFFF' } : undefined}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
