import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen, Text } from '@/components/ui';
import { useTheme } from '@/hooks';

/** Notes index. Stub — M5 fills it. See 09. */
export default function Notes() {
  const { typography, colors, spacing } = useTheme();
  const { t } = useTranslation();

  return (
    <Screen contentStyle={{ gap: spacing.md }}>
      <Text variant="title">{t('tabs.notes')}</Text>
      <Text variant="bodySmall" tone="muted">
        {t('stubs.notes')}
      </Text>
      <Link href="/note/1" style={[typography.bodyMedium, { color: colors.accent }]}>
        {t('stubs.openNote')}
      </Link>
    </Screen>
  );
}
