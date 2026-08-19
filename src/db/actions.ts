import { randomUUID } from 'expo-crypto'
import { eq, max } from 'drizzle-orm'

import { applyEvent } from './apply'
import { db } from './client'
import type { EventPayloads, EventType, Role, SpaceType, AppEvent } from './events'
import { listItems, settings } from './schema'

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
