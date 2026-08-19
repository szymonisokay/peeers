import { StyleSheet, type ViewStyle } from 'react-native';

import { usePressScale, useTheme } from '@/hooks';

import { Text } from './Text';
import { AnimatedPressable } from './AnimatedPressable';

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
  const press = usePressScale();

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
    <AnimatedPressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      // Scaling bare text reads as a wobble, so `plain` gets no press response.
      onPressIn={variant === 'plain' ? undefined : press.onPressIn}
      onPressOut={variant === 'plain' ? undefined : press.onPressOut}
      android_ripple={null}
      style={[
        styles.base,
        {
          borderRadius: radius.pill,
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.xl,
          opacity: disabled ? 0.4 : 1,
        },
        surface[variant],
        variant === 'plain' ? undefined : press.style,
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
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
