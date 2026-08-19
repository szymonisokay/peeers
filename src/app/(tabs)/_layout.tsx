import { Tabs } from 'expo-router';

import { TabBar } from '@/components/TabBar';

/**
 * The tab shell. Screens pushed on the root stack render over this and hide the
 * bar — see 07, which has an input bar where the tab bar would be.
 */
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Przestrzeń' }} />
      <Tabs.Screen name="lists" options={{ title: 'Zakupy' }} />
      <Tabs.Screen name="notes" options={{ title: 'Notatki' }} />
      <Tabs.Screen name="profile" options={{ title: 'Ty' }} />
    </Tabs>
  );
}
