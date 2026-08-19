import { Link } from 'expo-router';

import { Screen, Text } from '@/components/ui';
import { useTheme } from '@/hooks';

/** Notes index. Stub — M5 fills it. See 09. */
export default function Notes() {
  const { typography, colors, spacing } = useTheme();

  return (
    <Screen contentStyle={{ gap: spacing.md }}>
      <Text variant="title">Notatki</Text>
      <Text variant="bodySmall" tone="muted">
        Lista notatek — makieta 09
      </Text>
      <Link href="/note/1" style={[typography.bodyMedium, { color: colors.accent }]}>
        Otwórz notatkę →
      </Link>
    </Screen>
  );
}
