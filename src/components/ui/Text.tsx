import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { type TypographyVariant } from '@/theme';
import { useTheme } from '@/hooks';

export type TextVariant = TypographyVariant;
export type TextTone = 'default' | 'muted' | 'accent' | 'danger';

type TextProps = RNTextProps & {
  variant?: TextVariant;
  tone?: TextTone;
};

/**
 * Every piece of text in the app goes through here.
 *
 * Screens pick a named variant instead of reaching into the tokens, which is
 * what keeps type sizes consistent once there are many screens.
 */
export function Text({ variant = 'body', tone = 'default', style, ...rest }: TextProps) {
  const { colors, typography } = useTheme();

  const color = {
    default: colors.text,
    muted: colors.textMuted,
    accent: colors.accent,
    danger: colors.danger,
  }[tone];

  return <RNText style={[typography[variant], { color }, style]} {...rest} />;
}
