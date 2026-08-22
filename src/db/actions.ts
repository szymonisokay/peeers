import { randomUUID } from 'expo-crypto'
import { and, eq, isNull, max } from 'drizzle-orm'

import { applyEvent } from './apply'
import { db } from './client'
import type {
	AppEvent,
	ArchiveReason,
	EventPayloads,
	EventType,
	Role,
	SpaceType,
} from './events'
import { listItems, lists, settings } from './schema'

/**
 * One function per thing a person can do.
 *
 * Each builds an event and hands it to `applyEvent`. None of them touches a
 * materialised table, which is what keeps the log complete: if an action wrote
 * a row directly, that change would exist on this phone and nowhere else once
 * M8 starts syncing.
 *
 * All synchronous — the Drizzle Expo driver is — so no screen ever awaits its
 * own data.
 */

/** Overrides for events the seed writes on someone else's behalf, in the past. */
type EventOptions = {
	actorId?: string
	/** ISO-8601 UTC. */
	createdAt?: string
}

/*
 * Device-local settings do not go through the event log. They are answers to
 * "who is holding this phone" and "what am I looking at" — true of the device,
 * not of the Przestrzeń, and meaningless to anyone else. M7's appearance
 * preferences belong here for the same reason.
 */

export function setSetting(key: string, value: string): void {
	db.insert(settings)
		.values({ key, value })
		.onConflictDoUpdate({ target: settings.key, set: { value } })
		.run()
}

export function getSetting(key: string): string | undefined {
	return db.select().from(settings).where(eq(settings.key, key)).get()?.value
}

/** The person holding this phone. Written by the seed now, by M7's onboarding later. */
export function currentPersonId(): string {
	const value = getSetting('current_person_id')
	if (!value) throw new Error('No current person — has the seed run?')
	return value
}

/** The Przestrzeń on screen. M6 changes it when the switcher on 04 is used. */
export function currentSpaceId(): string {
	const value = getSetting('current_space_id')
	if (!value) throw new Error('No current Przestrzeń — has the seed run?')
	return value
}

function newEvent<T extends EventType>(
	spaceId: string,
	type: T,
	payload: EventPayloads[T],
	options?: EventOptions,
): AppEvent {
	return {
		id: randomUUID(),
		spaceId,
		actorId: options?.actorId ?? currentPersonId(),
		type,
		payload,
		createdAt: options?.createdAt ?? new Date().toISOString(),
		// TypeScript cannot see that `type` and `payload` were picked together
		// from the same key of EventPayloads; the signature above guarantees it.
	} as AppEvent
}

/**
 * Creates a Przestrzeń. `actorId` has to be passed explicitly: the founder
 * joins in the next event, so there is no current person yet.
 */
export function createSpace(
	input: { name: string; type: SpaceType },
	options: EventOptions & { actorId: string },
): string {
	const spaceId = randomUUID()
	applyEvent(newEvent(spaceId, 'space.created', input, options))
	return spaceId
}

/**
 * Adds a person to a Przestrzeń. `personId` can be supplied because the founder
 * is the author of `space.created`, which happens before they can join it — so
 * their id has to exist before this call.
 */
export function addPerson(
	input: {
		spaceId: string
		name: string
		color: string
		role?: Role
		personId?: string
	},
	options?: EventOptions,
): string {
	const personId = input.personId ?? randomUUID()

	applyEvent(
		newEvent(
			input.spaceId,
			'person.joined',
			{
				personId,
				name: input.name,
				color: input.color,
				role: input.role ?? 'member',
			},
			{ actorId: personId, ...options },
		),
	)

	return personId
}

export function createList(
	input: { spaceId: string; title: string },
	options?: EventOptions,
): string {
	const listId = randomUUID()
	applyEvent(newEvent(input.spaceId, 'list.created', { listId, title: input.title }, options))
	return listId
}

export function renameList(
	input: { spaceId: string; listId: string; title: string },
	options?: EventOptions,
): void {
	applyEvent(
		newEvent(input.spaceId, 'list.renamed', { listId: input.listId, title: input.title }, options),
	)
}

export function pinList(
	input: { spaceId: string; listId: string },
	options?: EventOptions,
): void {
	applyEvent(newEvent(input.spaceId, 'list.pinned', { listId: input.listId }, options))
}

export function unpinList(
	input: { spaceId: string; listId: string },
	options?: EventOptions,
): void {
	applyEvent(newEvent(input.spaceId, 'list.unpinned', { listId: input.listId }, options))
}

/**
 * Puts a list in the archive. `reason` is what mockup 41 prints under the
 * title: 'completed' reads "zamknięta", 'manual' reads "schowana ręcznie".
 */
export function archiveList(
	input: { spaceId: string; listId: string; reason: ArchiveReason },
	options?: EventOptions,
): void {
	applyEvent(
		newEvent(
			input.spaceId,
			'list.archived',
			{ listId: input.listId, reason: input.reason },
			options,
		),
	)
}

export function unarchiveList(
	input: { spaceId: string; listId: string },
	options?: EventOptions,
): void {
	applyEvent(newEvent(input.spaceId, 'list.unarchived', { listId: input.listId }, options))
}

/**
 * "Usuń na zawsze" on mockup 41. Soft, like every delete here: the row keeps
 * its `deleted_at` and stops being read, and the events that made it stay in
 * the log, because the log is append-only.
 */
export function deleteList(
	input: { spaceId: string; listId: string },
	options?: EventOptions,
): void {
	applyEvent(newEvent(input.spaceId, 'list.deleted', { listId: input.listId }, options))
}

export function addItem(
	input: {
		spaceId: string
		listId: string
		name: string
		quantity?: number
		note?: string | null
	},
	options?: EventOptions,
): string {
	const itemId = randomUUID()

	applyEvent(
		newEvent(
			input.spaceId,
			'item.added',
			{
				itemId,
				listId: input.listId,
				name: input.name,
				quantity: input.quantity ?? 1,
				note: input.note ?? null,
				position: nextPosition(input.listId),
			},
			options,
		),
	)

	return itemId
}

/**
 * Everything mockup 19 recognised in a pasted block, in the order it was
 * pasted.
 *
 * A plain loop, and deliberately so: one `item.added` event per item is what
 * lets the change history of mockup 25 say "dopisał(-a) 3 pozycje" and list
 * their names. Each call reads `max(position)` again, which is correct because
 * the driver is synchronous — the second call already sees the first row. The
 * writes cost one re-render between them, not one each, because expo-sqlite
 * delivers its change notifications asynchronously and React batches what
 * follows.
 */
export function addItems(
	input: {
		spaceId: string
		listId: string
		items: { name: string; quantity: number; note: string | null }[]
	},
	options?: EventOptions,
): void {
	for (const item of input.items) {
		addItem(
			{
				spaceId: input.spaceId,
				listId: input.listId,
				name: item.name,
				quantity: item.quantity,
				note: item.note,
			},
			options,
		)
	}
}

export function checkItem(
	input: { spaceId: string; listId: string; itemId: string },
	options?: EventOptions,
): void {
	applyEvent(
		newEvent(
			input.spaceId,
			'item.checked',
			{ itemId: input.itemId, listId: input.listId },
			options,
		),
	)

	closeIfDone(input, options)
}

export function uncheckItem(
	input: { spaceId: string; listId: string; itemId: string },
	options?: EventOptions,
): void {
	applyEvent(
		newEvent(
			input.spaceId,
			'item.unchecked',
			{ itemId: input.itemId, listId: input.listId },
			options,
		),
	)

	reopenIfClosed(input, options)
}

/**
 * A list closes itself once its last unchecked item is ticked. D-Q1.
 *
 * This is a **second event**, appended after the first, and it lives here in
 * the action layer rather than in the reducer. `applyEvent` must stay true to
 * the M3 rule that applying an event never depends on what this device already
 * knows — otherwise the same event would produce different results on two
 * phones depending on which one had caught up. Deciding is the writer's job;
 * the reducer only applies. M8 pushes both events in the order they were
 * appended, and every phone replays the same two.
 *
 * Two guards, both load-bearing. A list with nothing on it has not been
 * finished, so an empty list does not archive itself the moment it is made. And
 * a list already in the archive is left alone, so ticking something on an
 * archived list does not append a second archival.
 */
function closeIfDone(
	input: { spaceId: string; listId: string },
	options?: EventOptions,
): void {
	const [list] = db.select().from(lists).where(eq(lists.id, input.listId)).all()
	if (!list || list.archivedAt || list.deletedAt) return

	const alive = db
		.select({ checkedAt: listItems.checkedAt })
		.from(listItems)
		.where(and(eq(listItems.listId, input.listId), isNull(listItems.deletedAt)))
		.all()

	if (alive.length === 0) return
	if (alive.some((item) => item.checkedAt === null)) return

	archiveList({ ...input, reason: 'completed' }, options)
}

/**
 * The mirror image: unticking something reopens a list that had closed itself.
 *
 * Only that kind. A list somebody put away by hand stays away until somebody
 * takes it back out — that is the whole reason `archived_reason` exists.
 */
function reopenIfClosed(
	input: { spaceId: string; listId: string },
	options?: EventOptions,
): void {
	const [list] = db.select().from(lists).where(eq(lists.id, input.listId)).all()
	if (!list?.archivedAt || list.archivedReason !== 'completed') return

	unarchiveList(input, options)
}

export function editItem(
	input: {
		spaceId: string
		listId: string
		itemId: string
		name: string
		quantity: number
		note: string | null
	},
	options?: EventOptions,
): void {
	applyEvent(
		newEvent(
			input.spaceId,
			'item.edited',
			{
				itemId: input.itemId,
				listId: input.listId,
				name: input.name,
				quantity: input.quantity,
				note: input.note,
			},
			options,
		),
	)
}

export function removeItem(
	input: { spaceId: string; listId: string; itemId: string },
	options?: EventOptions,
): void {
	applyEvent(
		newEvent(
			input.spaceId,
			'item.removed',
			{ itemId: input.itemId, listId: input.listId },
			options,
		),
	)
}

/** "Przywróć" next to a removal on mockup 25. */
export function restoreItem(
	input: { spaceId: string; listId: string; itemId: string },
	options?: EventOptions,
): void {
	applyEvent(
		newEvent(
			input.spaceId,
			'item.restored',
			{ itemId: input.itemId, listId: input.listId },
			options,
		),
	)
}

export function createNote(
	input: { spaceId: string; title: string; body?: string },
	options?: EventOptions,
): string {
	const noteId = randomUUID()

	applyEvent(
		newEvent(
			input.spaceId,
			'note.created',
			{ noteId, title: input.title, body: input.body ?? '' },
			options,
		),
	)

	return noteId
}

export function editNote(
	input: { spaceId: string; noteId: string; title: string; body: string },
	options?: EventOptions,
): void {
	applyEvent(
		newEvent(
			input.spaceId,
			'note.edited',
			{ noteId: input.noteId, title: input.title, body: input.body },
			options,
		),
	)
}

/**
 * Where a new item lands. Read here rather than in the reducer: applying an
 * event must never depend on what this device already knows, or a pulled event
 * from M8 would land differently than it did on the phone that created it.
 */
function nextPosition(listId: string): number {
	const row = db
		.select({ value: max(listItems.position) })
		.from(listItems)
		.where(eq(listItems.listId, listId))
		.get()

	return (row?.value ?? -1) + 1
}
