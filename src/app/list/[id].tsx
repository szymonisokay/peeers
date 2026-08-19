import { useLocalSearchParams } from 'expo-router';

import { Screen, Text } from '@/components/ui';
import { useTheme } from '@/hooks';

/**
 * Shopping list detail. Stub — M4 fills it. See 07.
 *
 * A root-stack route, not a tab screen: 07 has no tab bar.
 */
export default function ListDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { spacing } = useTheme();

  return (
    <Screen contentStyle={{ gap: spacing.md }}>
      <Text variant="title">Lista {id}</Text>
      <Text variant="bodySmall" tone="muted">
        Szczegóły listy — makieta 07. Pasek zakładek jest tu ukryty.
      </Text>
    </Screen>
  );
}
