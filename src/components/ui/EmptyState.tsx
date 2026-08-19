import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useReducedMotion, useTheme } from '@/hooks';

import { Text } from './Text';

type EmptyStateProps = {
  /**
   * Illustration to show above the copy. Taken as a prop because only
   * `pusta-lista` exists so far — see docs/DESIGN.md.
   */
  illustration?: ReactNode;
  title: string;
  body?: string;
  /** Suggestion chips or an action, rendered under the copy. */
  footer?: ReactNode;
};

/** Centred empty placeholder. Matches 15. */
export function EmptyState({ illustration, title, body, footer }: EmptyStateProps) {
  const { motion, spacing } = useTheme();
  const reduced = useReducedMotion();

  return (
    // The one decorative animation in the set: an empty screen appearing
    // instantly reads as a loading failure rather than as "there is nothing".
    <Animated.View
      entering={reduced ? undefined : FadeIn.duration(motion.duration.slow)}
      style={[styles.wrap, { gap: spacing.md, padding: spacing.xl }]}
    >
      {illustration}
      <Text variant="bodyMedium" style={styles.center}>
        {title}
      </Text>
      {body ? (
        <Text variant="bodySmall" tone="muted" style={styles.center}>
          {body}
        </Text>
      ) : null}
      {footer}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
});
