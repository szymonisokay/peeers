import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks';

/** Placeholder home screen. M2 replaces this with the Przestrzeń feed. */
export default function Index() {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={[styles.center, { backgroundColor: colors.background, gap: spacing.md }]}>
      <Text style={[typography.title, { color: colors.text }]}>Peeers</Text>
      <Link href="/gallery" style={[typography.bodyMedium, { color: colors.accent }]}>
        Galeria komponentów
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
