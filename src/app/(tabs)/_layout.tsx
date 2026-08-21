import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { TabBar } from '@/components/TabBar';

/**
 * The tab shell. Screens pushed on the root stack render over this and hide the
 * bar — see 07, which has an input bar where the tab bar would be.
 */
export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: t('tabs.space') }} />
      <Tabs.Screen name="lists" options={{ title: t('tabs.lists') }} />
      <Tabs.Screen name="notes" options={{ title: t('tabs.notes') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.you') }} />
    </Tabs>
  );
}
