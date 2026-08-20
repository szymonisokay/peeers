import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { router } from 'expo-router'
import { StyleSheet, View } from 'react-native'

import { Icon } from '@/components/Icon'
import { Avatar, Card, EmptyState, ProgressBar, Screen, SectionLabel, Text } from '@/components/ui'
import { AnimatedPressable } from '@/components/ui/AnimatedPressable'
import {
	allPeople,
	asAppEvent,
	currentPersonId,
	currentSpaceId,
	itemCountsByList,
	itemNames,
	listActivity,
	lists as listsTable,
	listsInSpace,
	spaceById,
} from '@/db'
import { usePressScale, useTheme } from '@/hooks'
import { describe, groupEvents, type Described } from '@/lib/eventText'
import { plural } from '@/lib/plural'
import { shortWhen } from '@/lib/time'

type ListRow = typeof listsTable.$inferSelect

/**
 * The Zakupy tab — every list in the Przestrzeń. See 35.
 *
 * Five live queries, joined here in JavaScript rather than in SQL: `useLiveQuery`
 * only re-runs when the one table a query selects *from* reports a change, so a
 * join would go stale the moment somebody renamed themselves. See the header of
 * src/db/queries.ts.
 */
export default function Lists() {
	const { colors, radius, spacing } = useTheme()

	const spaceId = currentSpaceId()
	const personId = currentPersonId()

	const { data: space } = useLiveQuery(spaceById(spaceId), [spaceId])
	const { data: rows } = useLiveQuery(listsInSpace(spaceId), [spaceId])
	const { data: counts } = useLiveQuery(itemCountsByList())
	const { data: persons } = useLiveQuery(allPeople())
	const { data: names } = useLiveQuery(itemNames())
	const { data: activity } = useLiveQuery(listActivity(spaceId, 200), [spaceId])

	const pinned = rows.filter((row) => row.pinnedAt && !row.archivedAt)
	const active = rows.filter((row) => !row.pinnedAt && !row.archivedAt)
	const archived = rows.filter((row) => row.archivedAt)

	const person = (id: string) => persons.find((row) => row.id === id)
	const summarise = (list: ListRow) =>
		summary(list, activity.filter((event) => event.listId === list.id), {
			currentPersonId: personId,
			personName: (id) => person(id)?.name ?? '—',
			itemName: (id) => names.find((row) => row.id === id)?.name ?? '',
		})

	const card = (list: ListRow) => {
		const count = counts.find((row) => row.listId === list.id)

		return (
			<ListCard
				key={list.id}
				list={list}
				checked={count?.checked ?? 0}
				total={count?.total ?? 0}
				said={summarise(list)}
				actorColor={person(actorOf(list, activity))?.color ?? colors.textMuted}
				actorName={person(actorOf(list, activity))?.name ?? '—'}
			/>
		)
	}

	return (
		<Screen scroll contentStyle={{ gap: spacing.md, paddingVertical: spacing.md }}>
			<View>
				<SectionLabel>{(space[0]?.name ?? '').toLocaleUpperCase('pl')}</SectionLabel>
				<Text variant='titleLarge'>Listy</Text>
			</View>

			{rows.length === 0 ? <EmptyState title='Nie ma jeszcze żadnej listy' /> : null}

			{pinned.length > 0 ? (
				<>
					<SectionLabel icon='pin'>PRZYPIĘTA</SectionLabel>
					{pinned.map(card)}
				</>
			) : null}

			{active.length > 0 ? (
				<>
					<SectionLabel>{`AKTYWNE · ${active.length}`}</SectionLabel>
					{active.map(card)}
				</>
			) : null}

			{archived.length > 0 ? (
				<>
					{/* "Pokaż ›" arrives with the archive screen in Milestone 8. */}
					<SectionLabel>{`ARCHIWUM · ${archived.length}`}</SectionLabel>
					<View
						style={[
							styles.strip,
							{
								backgroundColor: colors.tileFill,
								borderRadius: radius.md,
								padding: spacing.md,
								gap: spacing.md,
							},
						]}
					>
						<Icon name='check' size={20} color={colors.success} />
						<Text variant='bodySmall' tone='muted' style={styles.grow}>
							Zamknięte listy schodzą tu po odhaczeniu wszystkiego
						</Text>
					</View>
				</>
			) : null}
		</Screen>
	)
}

type ListCardProps = {
	list: ListRow
	checked: number
	total: number
	/** The newest thing that happened, plus when — the card's bottom line. */
	said: Described & { at: string }
	actorName: string
	actorColor: string
}

function ListCard({ list, checked, total, said, actorName, actorColor }: ListCardProps) {
	const { colors, radius, spacing } = useTheme()
	const press = usePressScale()
	const isPinned = Boolean(list.pinnedAt)

	return (
		<AnimatedPressable
			accessibilityRole='button'
			onPress={() => router.push(`/list/${list.id}`)}
			onPressIn={press.onPressIn}
			onPressOut={press.onPressOut}
			style={press.style}
		>
			<Card style={isPinned ? { borderColor: colors.selectedBorder } : undefined}>
				<View style={{ gap: spacing.sm }}>
					<View style={[styles.row, { gap: spacing.sm }]}>
						<Text variant='bodyMedium' style={styles.grow} numberOfLines={1}>
							{list.title}
						</Text>
						<Text
							variant='bodySmall'
							tone='muted'
							style={
								isPinned
									? {
											backgroundColor: colors.selectedSurface,
											borderRadius: radius.sm,
											paddingHorizontal: spacing.sm,
											paddingVertical: 2,
										}
									: undefined
							}
						>
							{`${checked} z ${total}`}
						</Text>
					</View>

					<ProgressBar value={total === 0 ? 0 : checked / total} />

					<View style={[styles.row, { gap: spacing.sm }]}>
						<Avatar name={actorName} color={actorColor} size={24} />
						{/*
						 * The sentence truncates, the time never does: a card that
						 * reads "Nina utworzył(-a) listę i dodał(-a) 4 pozy…" with no
						 * "wczoraj" after it has lost the more useful half.
						 */}
						<Text variant='bodySmall' tone='muted' style={styles.shrink} numberOfLines={1}>
							{`${said.actor} ${said.rest}`}
						</Text>
						<Text variant='bodySmall' tone='muted'>
							{`· ${shortWhen(said.at)}`}
						</Text>
					</View>
				</View>
			</Card>
		</AnimatedPressable>
	)
}

/** The events of one list, newest first, folded into the line 35 prints. */
function summary(
	list: ListRow,
	events: { listId: string | null }[],
	ctx: Parameters<typeof describe>[1],
): Described & { at: string } {
	const groups = groupEvents(events.map((event) => asAppEvent(event as never)))
	const newest = groups[0]

	// A list whose events have fallen out of the window still has its own row,
	// and that row always knows who made it and when.
	if (!newest) {
		return {
			actor: list.createdBy === ctx.currentPersonId ? 'Ty' : ctx.personName(list.createdBy),
			rest: 'utworzył(-a) listę',
			at: list.createdAt,
		}
	}

	return { ...describe(newest, ctx), at: newest.createdAt }
}

function actorOf(list: ListRow, activity: { listId: string | null; actorId: string }[]): string {
	const newest = activity.find((event) => event.listId === list.id)
	return newest?.actorId ?? list.createdBy
}

const styles = StyleSheet.create({
	row: { flexDirection: 'row', alignItems: 'center' },
	strip: { flexDirection: 'row', alignItems: 'center' },
	grow: { flex: 1 },
	// Shrinks but does not grow, so the sentence and its time stay next to each
	// other the way 35 draws them instead of being pushed apart.
	shrink: { flexShrink: 1 },
})
