import { useTranslation } from 'react-i18next';

import { Screen, Text } from '@/components/ui';

/** Przestrzeń feed. Stub — M6 fills it. See 03. */
export default function Feed() {
  const { t } = useTranslation();

  return (
    <Screen>
      <Text variant="title">{t('tabs.space')}</Text>
      <Text variant="bodySmall" tone="muted">
        {t('stubs.feed')}
      </Text>
    </Screen>
  );
}
