import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { useTheme } from '@/hooks';

import { Text } from './Text';

type SectionLabelProps = {
  children: string;
  /** Drawn before the label, as the pin over "PRZYPIĘTA" on 35. */
  icon?: IconName;
  /** Drawn at the far right of the row, as "Pokaż ›" on 35. */
  right?: ReactNode;
};

/**
 * Uppercase grey heading above a group, e.g. "DZIŚ W PRZESTRZENI" on 03.
 *
 * With neither `icon` nor `right` it renders exactly the bare text it always
 * did, so the callers written before those props existed are unaffected.
 */
export function SectionLabel({ children, icon, right }: SectionLabelProps) {
  const { colors, spacing } = useTheme();

  const label = (
    <Text variant="label" tone="muted">
      {children}
    </Text>
  );

  if (!icon && !right) return label;

  return (
    <View style={[styles.row, { gap: spacing.xs }]}>
      {icon ? <Icon name={icon} size={15} color={colors.textMuted} /> : null}
      {label}
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  right: { marginLeft: 'auto' },
});
