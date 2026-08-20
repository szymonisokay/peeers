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
import { avatarColors } from '@/theme';
import { useReducedMotion, useTheme } from '@/hooks';

const PEOPLE = [
  { name: 'Ala', color: avatarColors[0] },
  { name: 'Kuba', color: avatarColors[1] },
  { name: 'Nina', color: avatarColors[2] },
];

const RULES = ['Każdy', 'Admin'] as const;

const INITIAL_ITEMS = [
  { id: 'mleko', title: 'Mleko owsiane', subtitle: '×2 · Kuba' },
  { id: 'serek', title: 'Serek wiejski', subtitle: 'Ty' },
  { id: 'pomidory', title: 'Pomidory malinowe', subtitle: 'Ty' },
  { id: 'ziemniaki', title: 'Ziemniaki 2 kg', subtitle: 'Nina' },
];

/**
 * Visual reference for every primitive in the design system.
 *
 * Kept as its own route so it survives M2 replacing the home screen, and stays
 * available for checking components against the mockups in assets/design/.
 */
export default function Gallery() {
  const { colors, spacing, radius, scheme } = useTheme();
  const reducedMotion = useReducedMotion();
  const [rule, setRule] = useState<(typeof RULES)[number]>('Każdy');
  const [notify, setNotify] = useState(true);
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [done, setDone] = useState<string[]>([]);

  const toggle = (id: string) =>
    setDone((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
    );

  const open = items.filter((item) => !done.includes(item.id));
  const closed = items.filter((item) => done.includes(item.id));

  return (
    <Screen scroll contentStyle={{ paddingVertical: spacing.lg, gap: spacing.xl }}>
      <View style={{ gap: spacing.xs }}>
        <SectionLabel>{`Motyw · ${scheme} · ruch: ${reducedMotion ? 'ograniczony' : 'pełny'}`}</SectionLabel>
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
        <SectionLabel icon="pin">Nagłówek z ikoną i akcją</SectionLabel>
        <SectionLabel right={<Text variant="bodySmall" tone="accent">Pokaż ›</Text>}>
          ARCHIWUM · 5
        </SectionLabel>
      </View>

      <View style={{ gap: spacing.md }}>
        <SectionLabel>Lista — odhacz i zobacz, jak wiersz wędruje</SectionLabel>
        <Card>
          <View style={{ gap: spacing.sm }}>
            <Text variant="bodyMedium">Biedronka, sobota</Text>
            <ProgressBar value={items.length ? closed.length / items.length : 0} />
            <Text variant="bodySmall" tone="muted">
              {`${closed.length} z ${items.length} odhaczone`}
            </Text>
          </View>
        </Card>
        <Card flush>
          <View style={{ paddingHorizontal: spacing.md }}>
            {open.map((item, index) => (
              <CheckboxRow
                key={item.id}
                title={item.title}
                subtitle={item.subtitle}
                onToggle={() => toggle(item.id)}
                last={index === open.length - 1 && closed.length === 0}
                right={<Avatar name="Kuba" color={avatarColors[1]} size={28} />}
              />
            ))}
            {closed.map((item, index) => (
              <CheckboxRow
                key={item.id}
                title={item.title}
                subtitle={item.subtitle}
                checked
                onToggle={() => toggle(item.id)}
                last={index === closed.length - 1}
                right={
                  <Text variant="bodySmall" tone="muted">
                    Kuba
                  </Text>
                }
              />
            ))}
          </View>
        </Card>
        <View style={[styles.row, { gap: spacing.sm }]}>
          <Chip
            label="+ dodaj pozycję"
            onPress={() =>
              setItems((current) => [
                ...current,
                { id: `nowa-${current.length}`, title: 'Kawa ziarnista', subtitle: 'Ty' },
              ])
            }
          />
          <Chip
            label="− usuń ostatnią"
            onPress={() => setItems((current) => current.slice(0, -1))}
          />
        </View>
      </View>

      <View style={{ gap: spacing.md }}>
        <SectionLabel>Wiersze</SectionLabel>
        <Card flush>
          <View style={{ paddingHorizontal: spacing.md }}>
            <ListRow
              title="Kuba"
              subtitle="2 listy · bez 1 notatki"
              left={<Avatar name="Kuba" color={avatarColors[1]} size={36} />}
              right={<Icon name="more" size={20} color={colors.accent} />}
            />
            <ListRow
              title="Powiadomienia"
              subtitle="klikalny — reaguje na dotyk"
              onPress={() => setNotify((value) => !value)}
              right={<Icon name="chevron-right" size={20} color={colors.textMuted} />}
            />
            <ListRow
              title="Wersja aplikacji"
              subtitle="bez onPress — nie reaguje"
              right={
                <Text variant="bodySmall" tone="muted">
                  1.0.0
                </Text>
              }
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
            illustration={<Illustration name="empty-list" />}
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
