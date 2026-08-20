import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { useTheme } from '@/hooks';

import type { TextVariant } from './Text';

type TextFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  /**
   * `underline` is the NAZWA field on 28 — a hairline under the text and
   * nothing else. `filled` is the DOPISEK beside it, and the pasted-text block
   * on 19.
   */
  variant?: 'underline' | 'filled';
  /** A step from the type scale, for a field that carries a title rather than a line. */
  textVariant?: TextVariant;
  multiline?: boolean;
  autoFocus?: boolean;
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
};

/**
 * A single field, in the two looks the mockups use.
 *
 * The label above it is the caller's business — "NAZWA" and "DOPISEK" on 28 are
 * ordinary `SectionLabel`s, and keeping them out here means a field can sit
 * without one.
 */
export function TextField({
  value,
  onChangeText,
  placeholder,
  variant = 'filled',
  textVariant = 'body',
  multiline = false,
  autoFocus = false,
  onSubmitEditing,
}: TextFieldProps) {
  const { colors, controlHeight, radius, spacing, typography } = useTheme();

  /*
   * A single line does not carry its line height into the input.
   *
   * Both platforms centre one line inside a fixed height on their own, but an
   * explicit `lineHeight` overrides that: iOS then lays the glyphs along the
   * bottom of the line box, which is what made the text sit low here while
   * Android looked right. Measured on the rendered screen — with it, the ink
   * sat 59 px from the top of the field and 32 from the bottom; without it,
   * evenly.
   */
  const { lineHeight, ...singleLine } = typography[textVariant];
  const type = multiline ? typography[textVariant] : singleLine;

  const skin =
    variant === 'filled'
      ? {
          backgroundColor: colors.tileFill,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          // A single-line filled field is a control, and 28 stands one beside
          // the stepper as one row, so it takes exactly `controlHeight`. A
          // multiline one is a block — the pasted text on 19 — and grows.
          ...(multiline
            ? { paddingVertical: spacing.md }
            : { height: controlHeight, paddingVertical: 0 }),
        }
      : {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
          paddingVertical: spacing.sm,
        };

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      multiline={multiline}
      autoFocus={autoFocus}
      onSubmitEditing={onSubmitEditing}
      textAlignVertical={multiline ? 'top' : 'center'}
      style={[
        type,
        skin,
        // Android adds room above and below the glyphs for accents that Public
        // Sans already carries, which would make the field taller than the
        // stepper beside it.
        { color: colors.text, includeFontPadding: false },
      ]}
    />
  );
}
