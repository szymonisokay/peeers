import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { avatarColors, useTheme } from '@/theme';

/** Temporary token preview — to be replaced by the Przestrzeń feed. */
export default function Index() {
  const { colors, typography, spacing, radius, scheme } = useTheme();

  const swatches = [
    ['background', colors.background],
    ['surface', colors.surface],
    ['border', colors.border],
    ['accent', colors.accent],
    ['text', colors.text],
    ['textMuted', colors.textMuted],
    ['danger', colors.danger],
    ['success', colors.success],
    ['warning', colors.warning],
  ] as const;

  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }}>
        <View style={{ gap: spacing.sm }}>
          <Text style={[typography.label, { color: colors.textMuted }]}>
            Motyw · {scheme}
          </Text>
          <Text style={[typography.titleLarge, { color: colors.text }]}>Peeers</Text>
          <Text style={[typography.title, { color: colors.text }]}>Mieszkanie 14</Text>
          <Text style={[typography.body, { color: colors.text }]}>
            Wspólne listy zakupów i notatki dla osób, które mieszkają razem.
          </Text>
          <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
            12:41 · Biedronka, sobota
          </Text>
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text style={[typography.label, { color: colors.textMuted }]}>Kolory</Text>
          {swatches.map(([name, value]) => (
            <View
              key={name}
              style={[
                styles.row,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                  padding: spacing.md,
                  gap: spacing.md,
                },
              ]}
            >
              <View
                style={[
                  styles.chip,
                  { backgroundColor: value, borderColor: colors.border, borderRadius: radius.sm },
                ]}
              />
              <Text style={[typography.bodyMedium, { color: colors.text, flex: 1 }]}>{name}</Text>
              <Text style={[typography.bodySmall, { color: colors.textMuted }]}>{value}</Text>
            </View>
          ))}
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text style={[typography.label, { color: colors.textMuted }]}>Kolory awatarów</Text>
          <View style={[styles.row, { gap: spacing.sm, flexWrap: 'wrap' }]}>
            {avatarColors.map((c) => (
              <View key={c} style={[styles.avatar, { backgroundColor: c }]} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth },
  chip: { width: 32, height: 32, borderWidth: StyleSheet.hairlineWidth },
  avatar: { width: 40, height: 40, borderRadius: 20 },
});
