import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon, iconNames } from '@/components/Icon';
import { Illustration } from '@/components/Illustration';
import {
  Avatar,
  AvatarStack,
  Button,
  Card,
  CheckboxRow,
  Chip,
  EmptyState,
  ListRow,
  ProgressBar,
  Screen,
  SectionLabel,
  SegmentedControl,
  Text,
  Toggle,
} from '@/components/ui';
import { avatarColors, useTheme } from '@/theme';

const PEOPLE = [
  { name: 'Ala', color: avatarColors[0] },
  { name: 'Kuba', color: avatarColors[1] },
  { name: 'Nina', color: avatarColors[2] },
];

const RULES = ['Każdy', 'Admin'] as const;

/**
 * Visual reference for every primitive in the design system.
 *
 * Kept as its own route so it survives M2 replacing the home screen, and stays
 * available for checking components against the mockups in assets/design/.
 */
export default function Gallery() {
  const { colors, spacing, radius, scheme } = useTheme();
  const [rule, setRule] = useState<(typeof RULES)[number]>('Każdy');
  const [notify, setNotify] = useState(true);
  const [checked, setChecked] = useState(false);

  return (
    <Screen scroll contentStyle={{ paddingVertical: spacing.lg, gap: spacing.xl }}>
      <View style={{ gap: spacing.xs }}>
        <SectionLabel>{`Motyw · ${scheme}`}</SectionLabel>
        <Text variant="title">Galeria</Text>
      </View>

      <View style={{ gap: spacing.md }}>
        <SectionLabel>{`Ikony · ${iconNames.length}`}</SectionLabel>
        <View style={[styles.grid, { gap: spacing.sm }]}>
          {iconNames.map((name) => (
            <View
              key={name}
              style={[
                styles.tile,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                  padding: spacing.sm,
                  gap: spacing.xs,
                },
              ]}
            >
              <Icon name={name} color={colors.text} />
              <Text variant="bodySmall" tone="muted" numberOfLines={1} style={styles.tiny}>
                {name}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ gap: spacing.md }}>
        <SectionLabel>Typografia</SectionLabel>
        <Card>
          <Text variant="titleLarge">titleLarge</Text>
          <Text variant="title">title</Text>
          <Text variant="body">body — Wspólne listy zakupów i notatki</Text>
          <Text variant="bodyMedium">bodyMedium</Text>
          <Text variant="bodySmall" tone="muted">
            bodySmall muted — 12:41 · Biedronka, sobota
          </Text>
          <Text variant="label" tone="muted">
            label
          </Text>
        </Card>
      </View>

      <View style={{ gap: spacing.md }}>
        <SectionLabel>Przyciski</SectionLabel>
        <Button label="Utwórz Przestrzeń" />
        <Button label="Mam kod zaproszenia" variant="secondary" />
        <Button label="Anuluj" variant="plain" />
        <Button label="Niedostępny" disabled />
      </View>

      <View style={{ gap: spacing.md }}>
        <SectionLabel>Chipy</SectionLabel>
        <View style={[styles.row, { gap: spacing.sm }]}>
          <Chip label="Dom" selected />
          <Chip label="Praca" />
          <Chip label="Wyjazd" />
          <Chip label="+ masło" />
        </View>
      </View>

      <View style={{ gap: spacing.md }}>
        <SectionLabel>Awatary</SectionLabel>
        <View style={[styles.row, { gap: spacing.lg }]}>
          <AvatarStack people={PEOPLE} />
          <Avatar name="Zosia" color={avatarColors[3]} size={48} />
          <Avatar name="Ola" color={avatarColors[4]} size={28} />
        </View>
      </View>

      <View style={{ gap: spacing.md }}>
        <SectionLabel>Postęp listy</SectionLabel>
        <Card>
          <View style={{ gap: spacing.sm }}>
            <Text variant="bodyMedium">Biedronka, sobota</Text>
            <ProgressBar value={2 / 8} />
            <Text variant="bodySmall" tone="muted">
              2 z 8 odhaczone
            </Text>
          </View>
        </Card>
      </View>

      <View style={{ gap: spacing.md }}>
        <SectionLabel>Wiersze</SectionLabel>
        <Card flush>
          <View style={{ paddingHorizontal: spacing.md }}>
            <CheckboxRow
              title="Mleko owsiane"
              subtitle="×2 · Kuba"
              checked={checked}
              onToggle={() => setChecked((value) => !value)}
            />
            <CheckboxRow title="Chleb" subtitle="Kuba" checked />
            <ListRow
              title="Kuba"
              subtitle="2 listy · bez 1 notatki"
              left={<Avatar name="Kuba" color={avatarColors[1]} size={36} />}
              right={<Icon name="wiecej" size={20} color={colors.accent} />}
            />
            <ListRow
              title="Powiadomienia"
              right={<Icon name="chevron-prawo" size={20} color={colors.textMuted} />}
              last
            />
          </View>
        </Card>
      </View>

      <View style={{ gap: spacing.md }}>
        <SectionLabel>Kontrolki</SectionLabel>
        <Card>
          <View style={{ gap: spacing.md }}>
            <View style={styles.between}>
              <Text variant="bodyMedium">Zapraszać może</Text>
              <SegmentedControl options={RULES} value={rule} onChange={setRule} />
            </View>
            <View style={styles.between}>
              <Text variant="bodyMedium">Powiadomienia o zmianach</Text>
              <Toggle value={notify} onValueChange={setNotify} />
            </View>
          </View>
        </Card>
      </View>

      <View style={{ gap: spacing.md }}>
        <SectionLabel>Stan pusty</SectionLabel>
        <Card>
          <EmptyState
            illustration={<Illustration name="pusta-lista" />}
            title="Lista jest jeszcze pusta"
            body="Dopisz pierwszą rzecz albo wklej całą listę z notatki."
            footer={
              <View style={[styles.row, { gap: spacing.sm, justifyContent: 'center' }]}>
                <Chip label="+ mleko owsiane" />
                <Chip label="+ masło" />
              </View>
            }
          />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tile: { width: 82, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  tiny: { fontSize: 10 },
});
