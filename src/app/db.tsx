import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { useRef } from 'react'
import { View } from 'react-native'

import { Avatar, Button, Card, CheckboxRow, Screen, SectionLabel, Text } from '@/components/ui'
import {
	addItem,
	allPeople,
	checkItem,
	currentPersonId,
	currentSpaceId,
	db,
	ensureSeed,
	events,
	itemsInList,
	listItems,
	lists,
	listsInSpace,
	notes,
	notesInSpace,
	people,
	recentEvents,
	spaceById,
	spaceMembers,
	spaces,
	settings,
	uncheckItem,
} from '@/db'
import { useTheme } from '@/hooks'

/**
 * Development-only check screen for the data layer, reached from the "Ty" tab.
 *
 * Labelled in English on purpose: it is a tool, not product UI, and AGENTS.md
 * only allows Polish copy taken verbatim from a mockup. No mockup covers this.
 * The data it shows is of course the Polish seed taken from 03, 07 and 09.
 *
 * Nothing on this screen is held in `useState` — every value comes from a live
 * query, which is the property M4 will depend on.
 */
export default function DatabaseCheck() {
	const { spacing, colors } = useTheme()

	// Counts renders, to measure what a burst of writes costs (see the M3 plan).
	const renders = useRef(0)
	renders.current += 1

	const spaceId = currentSpaceId()

	const { data: space } = useLiveQuery(spaceById(spaceId), [spaceId])
	const { data: persons } = useLiveQuery(allPeople())
	const { data: allLists } = useLiveQuery(listsInSpace(spaceId), [spaceId])
	const { data: allNotes } = useLiveQuery(notesInSpace(spaceId), [spaceId])
	const { data: log } = useLiveQuery(recentEvents(spaceId, 20), [spaceId])

	const list = allLists?.[0]

	return (
		<Screen scroll contentStyle={{ gap: spacing.md, paddingVertical: spacing.lg }}>
			<Text variant='title'>Database check</Text>
			<Text variant='bodySmall' tone='muted'>
				{space?.[0]?.name ?? '—'} · {space?.[0]?.type ?? '—'} · {renders.current} render(s)
			</Text>

			<SectionLabel>People</SectionLabel>
			<View style={{ flexDirection: 'row', gap: spacing.sm }}>
				{persons?.map((person) => (
					<View key={person.id} style={{ alignItems: 'center', gap: 4 }}>
						<Avatar name={person.name} color={person.color} size={36} />
						<Text variant='caption' tone='muted'>
							{person.name}
						</Text>
					</View>
				))}
			</View>

			{list ? <ListSection listId={list.id} spaceId={spaceId} title={list.title} /> : null}

			<SectionLabel>Notes</SectionLabel>
			{allNotes?.map((note) => (
				<Text key={note.id} variant='bodySmall'>
					{note.title}
				</Text>
			))}

			<SectionLabel>Event log</SectionLabel>
			<Text variant='caption' tone='muted'>
				newest first — the log only ever grows
			</Text>
			<Card>
				{log?.map((event) => (
					<Text key={event.id} variant='caption' tone='muted'>
						{localTime(event.createdAt)} · {event.type}
					</Text>
				))}
			</Card>

			<Button
				label='Add 20 items'
				variant='secondary'
				onPress={() => {
					if (!list) return
					for (let index = 0; index < 20; index += 1) {
						addItem({ spaceId, listId: list.id, name: `Probe ${index + 1}` })
					}
				}}
			/>

			<Button
				label='Reset and seed'
				variant='secondary'
				onPress={() => {
					wipe()
					ensureSeed()
				}}
			/>

			<Text variant='caption' tone='muted' style={{ color: colors.textMuted }}>
				actor: {safeActor()}
			</Text>
		</Screen>
	)
}

function ListSection({
	listId,
	spaceId,
	title,
}: {
	listId: string
	spaceId: string
	title: string
}) {
	const { data: items } = useLiveQuery(itemsInList(listId), [listId])

	const checked = items?.filter((item) => item.checkedAt !== null).length ?? 0
	const total = items?.length ?? 0

	return (
		<>
			<SectionLabel>List</SectionLabel>
			<Text variant='bodyMedium'>
				{title} — {checked} z {total}
			</Text>

			{items?.map((item, index) => (
				<CheckboxRow
					key={item.id}
					title={item.name}
					subtitle={item.quantity > 1 ? `×${item.quantity}` : (item.note ?? undefined)}
					checked={item.checkedAt !== null}
					last={index === (items?.length ?? 0) - 1}
					onToggle={() =>
						item.checkedAt === null
							? checkItem({ spaceId, listId, itemId: item.id })
							: uncheckItem({ spaceId, listId, itemId: item.id })
					}
				/>
			))}
		</>
	)
}

/**
 * Empties every table in one transaction. Deleting rows rather than the
 * database file keeps the open connection valid, so no reload is needed.
 */
function wipe(): void {
	db.transaction((tx) => {
		tx.delete(events).run()
		tx.delete(listItems).run()
		tx.delete(lists).run()
		tx.delete(notes).run()
		tx.delete(spaceMembers).run()
		tx.delete(people).run()
		tx.delete(spaces).run()
		tx.delete(settings).run()
	})
}

/**
 * An event's time on this device's clock.
 *
 * Timestamps are stored as ISO-8601 **UTC**, so slicing the string shows UTC
 * and reads two hours early in Poland. `getHours` and `getMinutes` are local by
 * definition, which is what a person looking at the screen expects. M6 owns
 * real feed formatting — "wczoraj 12:04", the "DZIŚ W PRZESTRZENI" grouping —
 * and will need the same conversion.
 */
function localTime(iso: string): string {
	const date = new Date(iso)
	const hours = String(date.getHours()).padStart(2, '0')
	const minutes = String(date.getMinutes()).padStart(2, '0')

	return `${hours}:${minutes}`
}

function safeActor(): string {
	try {
		return currentPersonId()
	} catch {
		return 'none'
	}
}
