import { useLocalSearchParams } from 'expo-router';

import { Screen, Text } from '@/components/ui';
import { useTheme } from '@/hooks';

/** Note detail. Stub — M5 fills it. See 10. Root-stack route, no tab bar. */
export default function NoteDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { spacing } = useTheme();

  return (
    <Screen contentStyle={{ gap: spacing.md }}>
      <Text variant="title">Notatka {id}</Text>
      <Text variant="bodySmall" tone="muted">
        Widok notatki — makieta 10
      </Text>
    </Screen>
  );
}
