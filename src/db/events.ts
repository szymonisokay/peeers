/**
 * The event vocabulary.
 *
 * Every change to a Przestrzeń is an event: a statement that someone did
 * something at a point in time. Events are appended to the `events` table and
 * never updated or deleted. The current state of lists and notes is derived
 * from them by `materialise()` in ./apply.ts.
 *
 * This exists now, while the app is still single-device, because M8 turns the
 * same events into the sync protocol: pushing is `SELECT * FROM events WHERE
 * synced_at IS NULL`, and pulling calls the same `applyEvent()` with someone
 * else's event. Nothing about a screen has to know which of the two happened.
 *
 * Two rules for payloads:
 *
 * 1. A payload carries everything the reducer needs to apply it, so applying an
 *    event never requires reading the database first. That is what lets a
 *    remote event apply on a device that has not caught up yet.
 * 2. Ids are generated on the device that creates the row, never by SQLite.
 *
 * Keep this file free of `@/` imports — ./schema.ts imports these types, and
 * drizzle-kit loads that file outside Metro, where path aliases do not resolve.
 */

/**
 * Przestrzeń type. The choice on mockup 01 reads Dom / Praca / Wyjazd; those
 * are labels, and M7 maps them. Stored values are English like every other
 * identifier in the codebase.
 */
export type SpaceType = 'home' | 'work' | 'trip'

/** Członek or Admin. Roles are not enforced until M9; the column exists now. */
export type Role = 'member' | 'admin'

/**
 * Why a list ended up in the archive. Mockup 41 shows both: "zamknięta 12
 * sierpnia" for a list that closed itself once everything on it was checked
 * off, "schowana ręcznie 3 sierpnia" for one somebody put away unfinished.
 *
 * The distinction is not decoration. Unchecking an item reopens a list that
 * closed itself and leaves a manually hidden one where it is.
 */
export type ArchiveReason = 'completed' | 'manual'

/**
 * Every event type the app can record, with its payload.
 *
 * M5 extends this as the note screens need it. Adding an entry here without
 * adding a matching branch to `materialise()` fails `npx tsc --noEmit`, so an
 * event type cannot be half-added.
 *
 * Note what the removal and restoration payloads do *not* carry: the item's
 * name, even though mockup 25 renders "usunął(-ęła) pozycję „chipsy"". Rule 1
 * above is about what the reducer needs, and the reducer needs an id. The
 * history screen looks the name up in `list_items`, where the row still is —
 * deletes are soft. `item.checked` has always worked this way.
 */
export type EventPayloads = {
	'space.created': { name: string; type: SpaceType }
	'person.joined': {
		personId: string
		name: string
		color: string
		role: Role
	}
	'list.created': { listId: string; title: string }
	'item.added': {
		itemId: string
		listId: string
		name: string
		quantity: number
		note: string | null
		position: number
	}
	'item.checked': { itemId: string; listId: string }
	'item.unchecked': { itemId: string; listId: string }
	'item.edited': {
		itemId: string
		listId: string
		name: string
		quantity: number
		note: string | null
	}
	'item.removed': { itemId: string; listId: string }
	'item.restored': { itemId: string; listId: string }
	'list.renamed': { listId: string; title: string }
	'list.pinned': { listId: string }
	'list.unpinned': { listId: string }
	'list.archived': { listId: string; reason: ArchiveReason }
	'list.unarchived': { listId: string }
	'list.deleted': { listId: string }
	'note.created': { noteId: string; title: string; body: string }
	'note.edited': { noteId: string; title: string; body: string }
}

export type EventType = keyof EventPayloads

/** Any payload, for the column type on `events.payload`. */
export type EventPayload = EventPayloads[EventType]

/**
 * One event.
 *
 * Written as a distributed union rather than one object with a wide payload
 * type, so that `switch (event.type)` narrows `event.payload` to the matching
 * shape inside the reducer.
 */
export type AppEvent = {
	[T in EventType]: {
		id: string
		spaceId: string
		actorId: string
		type: T
		payload: EventPayloads[T]
		/**
		 * ISO-8601 **UTC**. Sorts correctly as text and maps onto Postgres in M8.
		 *
		 * Render it through `new Date(...)` and the local getters — never slice
		 * the string. `createdAt.slice(11, 16)` shows UTC, which reads two hours
		 * early in Poland.
		 */
		createdAt: string
	}
}[EventType]

/**
 * A row as it comes back out of the `events` table.
 *
 * The column types cannot express that `type` and `payload` were chosen
 * together, so a row reads as "some type and some payload" rather than as one
 * of the pairs in `EventPayloads`. `asAppEvent` restores the pairing for code
 * that switches on the type — the change history of mockup 25, and M6's feed.
 * It is safe because every row was written by `newEvent`, which took both from
 * the same key.
 */
export type EventRow = {
	id: string
	spaceId: string
	actorId: string
	type: EventType
	payload: EventPayload
	createdAt: string
}

export function asAppEvent(row: EventRow): AppEvent {
	return row as AppEvent
}
