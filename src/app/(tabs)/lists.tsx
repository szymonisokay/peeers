import { Link } from 'expo-router';

import { Screen, Text } from '@/components/ui';
import { useTheme } from '@/hooks';

/** Shopping lists index. Stub — M4 fills it. See 35. */
export default function Lists() {
  const { typography, colors, spacing } = useTheme();

  return (
    <Screen contentStyle={{ gap: spacing.md }}>
      <Text variant="title">Zakupy</Text>
      <Text variant="bodySmall" tone="muted">
        Spis list — makieta 35
      </Text>
      <Link href="/list/1" style={[typography.bodyMedium, { color: colors.accent }]}>
        Otwórz listę →
      </Link>
    </Screen>
  );
}
