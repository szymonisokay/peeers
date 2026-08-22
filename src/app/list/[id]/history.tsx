import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, View } from 'react-native'

import { Avatar, Screen, SectionLabel, Text } from '@/components/ui'
import {
	allItemsInList,
	allPeople,
	asAppEvent,
	currentPersonId,
	currentSpaceId,
	eventsForList,
	listById,
	restoreItem,
	uncheckItem,
} from '@/db'
import { useTheme } from '@/hooks'
import { describe, groupEvents, type ActivityGroup } from '@/lib/eventText'
import { clockTime, dayHeading } from '@/lib/time'

/** How far back 25 says it looks. */
const WINDOW_DAYS = 30

/**
 * The time gutter.
 *
 * The size comes from 25 and the width from the device, because the two do not
 * agree and only one of them is what actually renders.
 *
 * 25 sets the time smaller than the sentence beside it: the digits are 8 pt
 * tall against the sentence's 10 pt cap height, a ratio of 0.8, which matches
 * `caption` over `body` (12/16) and not `bodySmall` (15/16). In `bodySmall` the
 * clock overflows this column and breaks across two lines — "14:0" over "6".
 *
 * The width cannot come from the drawing. "12:41" is 30 pt of ink there, in a
 * monospace-looking face; Public Sans with `tabular-nums` measures 33.7 pt of
 * ink for the same string on the device, and needs a little more than that for
 * its side bearings — 36 still truncated. So 40, which puts the avatars 3.5 pt
 * further right than 25 draws them. Tabular figures are what make every row
 * measure the same, so "9:02" and "12:41" start and end together.
 */
const CLOCK_WIDTH = 40

/**
 * Everything that has happened to one list. See 25.
 *
 * This is the screen where the append-only log is visible as itself. Pressing
 * "Przywróć" does not edit the row you pressed — it appends the opposite event,
 * so the old row stays exactly where it was and a new one arrives at the top
 * saying what you just did. Nothing here rewrites history, which is the same
 * property M8 relies on when two phones disagree.
 *
 * Two sentences 25 draws are not built, per A1 in this plan: "dołączył(-a) do
 * listy" and "udostępnił(-a) listę całej Przestrzeni". No event in this app
 * produces either.
 */
export default function History() {
	const { t } = useTranslation()
	const { colors, radius, spacing } = useTheme()
	const { id } = useLocalSearchParams<{ id: string }>()
	const spaceId = currentSpaceId()
	const personId = currentPersonId()

	// Fixed at mount: a window that slid while you were reading would drop rows
	// out from under you.
	const [since] = useState(() =>
		new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString(),
	)

	const { data: rows } = useLiveQuery(eventsForList(id, since), [id, since])
	const { data: items } = useLiveQuery(allItemsInList(id), [id])
	const { data: persons } = useLiveQuery(allPeople())
	const { data: found } = useLiveQuery(listById(id), [id])

	const list = found[0]
	const person = (personId: string) => persons.find((row) => row.id === personId)

	const groups = groupEvents(rows.map((row) => asAppEvent(row)))

	const context = {
		currentPersonId: personId,
		personName: (who: string) => person(who)?.name ?? '—',
		itemName: (itemId: string) => items.find((row) => row.id === itemId)?.name ?? '',
	}

	/**
	 * The undo for a row, or `null` when there is nothing to undo.
	 *
	 * Only a single check or a single removal can be taken back, and only while
	 * it still stands: undoing something somebody has already undone would
	 * append an event that contradicts nothing.
	 */
	const undo = (group: ActivityGroup): (() => void) | null => {
		if (group.events.length !== 1) return null

		const [event] = group.events
		if (event.type !== 'item.checked' && event.type !== 'item.removed') return null

		const item = items.find((row) => row.id === event.payload.itemId)
		if (!item) return null

		const where = { spaceId, listId: id, itemId: item.id }

		if (event.type === 'item.checked') {
			return item.checkedAt ? () => uncheckItem(where) : null
		}

		return item.deletedAt ? () => restoreItem(where) : null
	}

	return (
		<Screen scroll bleed surface contentStyle={{ paddingBottom: spacing.xl }}>
			<Stack.Screen options={{ headerBackTitle: list?.title }} />

			<View style={{ padding: spacing.lg, gap: spacing.xs }}>
				<Text variant='titleLarge'>{t('history.title')}</Text>
				<Text variant='bodySmall' tone='muted'>
					{t('history.window')}
				</Text>
			</View>

			{groups.length === 0 ? (
				<View style={{ paddingHorizontal: spacing.lg }}>
					<Text variant='bodySmall' tone='muted'>
						{t('history.empty')}
					</Text>
				</View>
			) : null}

			{groups.map((group, index) => {
				const heading = dayHeading(group.createdAt)
				// 25 heads each day once. The groups are newest first and so are the
				// days, so a heading is needed exactly where the day changes.
				const opensDay = index === 0 || dayHeading(groups[index - 1].createdAt) !== heading

				const said = describe(group, context)
				const take = undo(group)
				const actor = person(group.actorId)

				return (
					<View key={group.id}>
						{opensDay ? (
							<View
								style={{
									backgroundColor: colors.background,
									paddingHorizontal: spacing.lg,
									paddingVertical: spacing.sm,
									borderTopWidth: StyleSheet.hairlineWidth,
									borderBottomWidth: StyleSheet.hairlineWidth,
									borderColor: colors.border,
								}}
							>
								<SectionLabel>{heading}</SectionLabel>
							</View>
						) : null}

						<View
							style={[
								styles.row,
								{
									paddingHorizontal: spacing.lg,
									paddingVertical: spacing.md,
									gap: spacing.md,
									borderBottomWidth: StyleSheet.hairlineWidth,
									borderBottomColor: colors.border,
								},
							]}
						>
							{/*
							 * The time column. Tabular figures keep the colons under each
							 * other where 25 draws them aligned — the mono face of 19 is
							 * not wanted here, per D-Q4.
							 */}
							<Text
								variant='caption'
								tone='muted'
								numberOfLines={1}
								style={[styles.clock, { width: CLOCK_WIDTH }]}
							>
								{clockTime(group.createdAt)}
							</Text>

							<Avatar
								name={actor?.name ?? '?'}
								color={actor?.color ?? colors.textMuted}
								size={28}
							/>

							<View style={[styles.grow, { gap: spacing.sm }]}>
								{/*
								 * One paragraph, two weights: 25 sets the name heavier than
								 * what follows it, and they wrap together as one sentence.
								 */}
								<Text variant='body'>
									<Text variant='bodyMedium'>{said.actor}</Text>
									{` ${said.rest}`}
								</Text>

								{said.items ? (
									<View
										style={{
											backgroundColor: colors.tileFill,
											borderRadius: radius.sm,
											paddingHorizontal: spacing.md,
											paddingVertical: spacing.sm,
										}}
									>
										<Text variant='bodySmall' tone='muted'>
											{said.items.join(' · ')}
										</Text>
									</View>
								) : null}
							</View>

							{take ? (
								<Pressable onPress={take} hitSlop={spacing.sm}>
									<Text variant='bodySmall' tone='accent'>
										{t('history.restore')}
									</Text>
								</Pressable>
							) : null}
						</View>
					</View>
				)
			})}
		</Screen>
	)
}

const styles = StyleSheet.create({
	row: { flexDirection: 'row', alignItems: 'flex-start' },
	grow: { flex: 1 },
	// Tabular figures so the colons stand under each other, which is how 25
	// draws them. The width is CLOCK_WIDTH, applied at the call site.
	clock: { fontVariant: ['tabular-nums'] },
})
