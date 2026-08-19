import {
  PublicSans_400Regular,
  PublicSans_500Medium,
  PublicSans_600SemiBold,
  PublicSans_700Bold,
  useFonts,
} from '@expo-google-fonts/public-sans';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useTheme } from '@/hooks';

export default function RootLayout() {
  const { scheme, colors } = useTheme();
  const [fontsLoaded] = useFonts({
    PublicSans_400Regular,
    PublicSans_500Medium,
    PublicSans_600SemiBold,
    PublicSans_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}
