import { Link } from 'expo-router';

import { Screen, Text } from '@/components/ui';
import { useTheme } from '@/hooks';

/** Your profile and app settings. Stub — M7 fills it. See 13. */
export default function Profile() {
  const { typography, colors, spacing } = useTheme();

  return (
    <Screen contentStyle={{ gap: spacing.md }}>
      <Text variant="title">Ty</Text>
      <Text variant="bodySmall" tone="muted">
        Profil i ustawienia — makieta 13
      </Text>
      <Link href="/gallery" style={[typography.bodyMedium, { color: colors.accent }]}>
        Galeria komponentów →
      </Link>
    </Screen>
  );
}
