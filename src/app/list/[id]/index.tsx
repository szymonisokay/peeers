import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { useLocalSearchParams } from 'expo-router'
import { StyleSheet, View } from 'react-native'

import { Illustration } from '@/components/Illustration'
import { Avatar, CheckboxRow, EmptyState, Screen, SectionLabel, Text } from '@/components/ui'
import {
	allPeople,
	checkItem,
	currentPersonId,
	currentSpaceId,
	itemsInList,
	listById,
	listItems as listItemsTable,
	membersOfSpace,
	uncheckItem,
} from '@/db'
import { useTheme } from '@/hooks'
import { joinNames } from '@/lib/eventText'
import { plural } from '@/lib/plural'

type Item = typeof listItemsTable.$inferSelect

/**
 * One shopping list. See 07, its dark counterpart 39, and 15 for the empty
 * case.
 *
 * A root-stack route, not a tab screen: 07 has no tab bar. "Udostępnij" is not
 * in the header because link sharing is out of the MVP — see docs/PROJECT.md —
 * and a button that does nothing is worse than no button.
 */
export default function ListDetail() {
	const { colors, spacing } = useTheme()

	const { id } = useLocalSearchParams<{ id: string }>()
	const spaceId = currentSpaceId()
	const personId = currentPersonId()

	const { data: found } = useLiveQuery(listById(id), [id])
	const { data: items } = useLiveQuery(itemsInList(id), [id])
	const { data: persons } = useLiveQuery(allPeople())
	const { data: members } = useLiveQuery(membersOfSpace(spaceId), [spaceId])

	const list = found[0]
	const toBuy = items.filter((item) => !item.checkedAt)
	const done = items
		.filter((item) => item.checkedAt)
		.sort((a, b) => (b.checkedAt ?? '').localeCompare(a.checkedAt ?? ''))

	const person = (id: string | null) => persons.find((row) => row.id === id)
	const who = (id: string | null) => (id === personId ? 'Ty' : (person(id)?.name ?? '—'))

	const others = members
		.filter((member) => member.personId !== personId)
		.map((member) => person(member.personId)?.name)
		.filter((name): name is string => Boolean(name))

	if (!list) return <Screen>{null}</Screen>

	return (
		<Screen scroll bleed surface contentStyle={{ paddingBottom: spacing.xl }}>
			<View
				style={[
					styles.header,
					{
						padding: spacing.lg,
						gap: spacing.md,
						// 07 parts the title block from the list with a hairline.
						borderBottomWidth: StyleSheet.hairlineWidth,
						borderBottomColor: colors.border,
					},
				]}
			>
				<Text variant='titleLarge' style={styles.grow}>
					{list.title}
				</Text>
				<View style={styles.counter}>
					<Text variant='bodySmall' tone='muted'>
						{items.length === 0
							? `0 ${plural(0, 'pozycja', 'pozycje', 'pozycji')}`
							: `${done.length} z ${items.length}`}
					</Text>
					<Text variant='bodySmall' tone='muted'>
						{items.length === 0
							? `${members.length} ${plural(members.length, 'osoba', 'osoby', 'osób')}`
							: 'odhaczone'}
					</Text>
				</View>
			</View>

			{items.length === 0 ? (
				<EmptyState
					illustration={<Illustration name='empty-list' scale={1.4} />}
					title='Lista jest jeszcze pusta'
					body={
						others.length > 0
							? `Dopisz pierwszą rzecz albo wklej całą listę z notatki. ${joinNames(others)} zobaczą ją od razu.`
							: 'Dopisz pierwszą rzecz albo wklej całą listę z notatki.'
					}
				/>
			) : null}

			{toBuy.length > 0 ? (
				<View
					style={{
						paddingHorizontal: spacing.lg,
						paddingTop: spacing.lg,
						paddingBottom: spacing.sm,
					}}
				>
					<SectionLabel>DO KUPIENIA</SectionLabel>
				</View>
			) : null}

			{toBuy.map((item, index) => (
				<CheckboxRow
					key={item.id}
					title={item.name}
					subtitle={subtitle(item, who(item.createdBy))}
					paddingX={spacing.lg}
					last={index === toBuy.length - 1}
					onToggle={() => checkItem({ spaceId, listId: id, itemId: item.id })}
					right={
						<Avatar
							name={person(item.createdBy)?.name ?? '?'}
							color={person(item.createdBy)?.color ?? colors.textMuted}
							size={28}
						/>
					}
				/>
			))}

			{done.length > 0 ? (
				<View
					style={{
						paddingHorizontal: spacing.lg,
						paddingTop: spacing.lg,
						paddingBottom: spacing.sm,
					}}
				>
					<SectionLabel>{`ODHACZONE · ${done.length}`}</SectionLabel>
				</View>
			) : null}

			{done.map((item, index) => (
				<CheckboxRow
					key={item.id}
					title={item.name}
					checked
					paddingX={spacing.lg}
					last={index === done.length - 1}
					onToggle={() => uncheckItem({ spaceId, listId: id, itemId: item.id })}
					right={
						<Text variant='bodySmall' tone='muted'>
							{who(item.checkedBy)}
						</Text>
					}
				/>
			))}
		</Screen>
	)
}

/**
 * The grey line under an item's name: "×2 · Kuba", "duża paczka · Nina", "Ty".
 *
 * 07 and 39 order these differently — 39 puts the author first. 07 wins; see
 * the defects table in docs/DESIGN.md.
 */
function subtitle(item: Item, author: string): string {
	return [item.quantity > 1 ? `×${item.quantity}` : null, item.note, author]
		.filter(Boolean)
		.join(' · ')
}

const styles = StyleSheet.create({
	header: { flexDirection: 'row', alignItems: 'flex-start' },
	counter: { alignItems: 'flex-end' },
	grow: { flex: 1 },
})
