import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen, Text } from '@/components/ui';
import { useTheme } from '@/hooks';

/** Note detail. Stub — M5 fills it. See 10. Root-stack route, no tab bar. */
export default function NoteDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { spacing } = useTheme();
  const { t } = useTranslation();

  return (
    <Screen contentStyle={{ gap: spacing.md }}>
      <Text variant="title">{t('stubs.noteTitle', { id })}</Text>
      <Text variant="bodySmall" tone="muted">
        {t('stubs.note')}
      </Text>
    </Screen>
  );
}
