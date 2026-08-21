import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen, Text } from '@/components/ui';
import { useTheme } from '@/hooks';

/** Your profile and app settings. Stub — M7 fills it. See 13. */
export default function Profile() {
  const { typography, colors, spacing } = useTheme();
  const { t } = useTranslation();

  return (
    <Screen contentStyle={{ gap: spacing.md }}>
      <Text variant="title">{t('tabs.you')}</Text>
      <Text variant="bodySmall" tone="muted">
        {t('stubs.profile')}
      </Text>
      {/*
        The two links below stay untranslated on purpose: /gallery and /db are
        development tools, not screens a user reaches. See the Decision Log in
        docs/exec-plans/active/20260820-2147-m4b-bilingual-ui.md.
      */}
      <Link href="/gallery" style={[typography.bodyMedium, { color: colors.accent }]}>
        Galeria komponentów →
      </Link>
      {/* Development tool, like the gallery above. M3 checks the data layer here. */}
      <Link href="/db" style={[typography.bodyMedium, { color: colors.accent }]}>
        Database check →
      </Link>
    </Screen>
  );
}
