import { eq } from 'drizzle-orm'

import { db } from './client'
import type { AppEvent } from './events'
import { events, lists, listItems, notes, people, spaceMembers, spaces } from './schema'

/**
 * The transaction handle Drizzle hands to `db.transaction`. Derived rather than
 * imported so it cannot drift from the driver.
 */
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

/**
 * The only function in this app that writes to the materialised tables.
 *
 * It records the event and applies its effect in one transaction, so the log
 * and the state can never disagree. Screens never call it directly — they call
 * an action from ./actions.ts, which builds the event first.
 *
 * This is the seam M8 is built on. When sync arrives, a pulled event from
 * another device goes through this same function with the same argument, and
 * nothing else in the app has to learn about it.
 *
 * Synchronous on purpose. The Drizzle Expo driver runs BEGIN, the callback,
 * then COMMIT without awaiting, so an `async` callback would return a promise
 * and the commit would race the work inside it. Every statement below ends in
 * `.run()`, which executes immediately.
 */
export function applyEvent(event: AppEvent): void {
	db.transaction((tx) => {
		tx.insert(events)
			.values({
				id: event.id,
				spaceId: event.spaceId,
				actorId: event.actorId,
				type: event.type,
				payload: event.payload,
				createdAt: event.createdAt,
				listId: listIdOf(event),
				syncedAt: null,
			})
			.run()

		materialise(tx, event)
	})
}

/** Applies an event's effect. One branch per event type, no exceptions. */
function materialise(tx: Tx, event: AppEvent): void {
	switch (event.type) {
		case 'space.created': {
			tx.insert(spaces)
				.values({
					id: event.spaceId,
					name: event.payload.name,
					type: event.payload.type,
					createdAt: event.createdAt,
					createdBy: event.actorId,
				})
				.run()
			return
		}

		case 'person.joined': {
			// A person can already exist: identity is global, so joining a second
			// Przestrzeń must not overwrite their name or colour.
			tx.insert(people)
				.values({
					id: event.payload.personId,
					name: event.payload.name,
					color: event.payload.color,
					createdAt: event.createdAt,
				})
				.onConflictDoNothing()
				.run()

			tx.insert(spaceMembers)
				.values({
					spaceId: event.spaceId,
					personId: event.payload.personId,
					role: event.payload.role,
					joinedAt: event.createdAt,
				})
				.onConflictDoNothing()
				.run()
			return
		}

		case 'list.created': {
			tx.insert(lists)
				.values({
					id: event.payload.listId,
					spaceId: event.spaceId,
					title: event.payload.title,
					createdAt: event.createdAt,
					createdBy: event.actorId,
					updatedAt: event.createdAt,
				})
				.run()
			return
		}

		case 'item.added': {
			tx.insert(listItems)
				.values({
					id: event.payload.itemId,
					listId: event.payload.listId,
					name: event.payload.name,
					quantity: event.payload.quantity,
					note: event.payload.note,
					position: event.payload.position,
					createdAt: event.createdAt,
					createdBy: event.actorId,
				})
				.run()

			touchList(tx, event.payload.listId, event.createdAt)
			return
		}

		case 'item.checked': {
			tx.update(listItems)
				.set({ checkedAt: event.createdAt, checkedBy: event.actorId })
				.where(eq(listItems.id, event.payload.itemId))
				.run()

			touchList(tx, event.payload.listId, event.createdAt)
			return
		}

		case 'item.unchecked': {
			tx.update(listItems)
				.set({ checkedAt: null, checkedBy: null })
				.where(eq(listItems.id, event.payload.itemId))
				.run()

			touchList(tx, event.payload.listId, event.createdAt)
			return
		}

		case 'item.edited': {
			tx.update(listItems)
				.set({
					name: event.payload.name,
					quantity: event.payload.quantity,
					note: event.payload.note,
				})
				.where(eq(listItems.id, event.payload.itemId))
				.run()

			touchList(tx, event.payload.listId, event.createdAt)
			return
		}

		case 'item.removed': {
			tx.update(listItems)
				.set({ deletedAt: event.createdAt })
				.where(eq(listItems.id, event.payload.itemId))
				.run()

			touchList(tx, event.payload.listId, event.createdAt)
			return
		}

		case 'item.restored': {
			tx.update(listItems)
				.set({ deletedAt: null })
				.where(eq(listItems.id, event.payload.itemId))
				.run()

			touchList(tx, event.payload.listId, event.createdAt)
			return
		}

		case 'list.renamed': {
			tx.update(lists)
				.set({ title: event.payload.title, updatedAt: event.createdAt })
				.where(eq(lists.id, event.payload.listId))
				.run()
			return
		}

		case 'list.pinned': {
			tx.update(lists)
				.set({ pinnedAt: event.createdAt })
				.where(eq(lists.id, event.payload.listId))
				.run()

			touchList(tx, event.payload.listId, event.createdAt)
			return
		}

		case 'list.unpinned': {
			tx.update(lists)
				.set({ pinnedAt: null })
				.where(eq(lists.id, event.payload.listId))
				.run()

			touchList(tx, event.payload.listId, event.createdAt)
			return
		}

		case 'list.archived': {
			tx.update(lists)
				.set({
					archivedAt: event.createdAt,
					archivedReason: event.payload.reason,
					// A list in the archive is not also pinned to the top of the
					// active section; 35 draws PRZYPIĘTA above AKTYWNE, and 41 has
					// no pinned row.
					pinnedAt: null,
				})
				.where(eq(lists.id, event.payload.listId))
				.run()

			touchList(tx, event.payload.listId, event.createdAt)
			return
		}

		case 'list.unarchived': {
			tx.update(lists)
				.set({ archivedAt: null, archivedReason: null })
				.where(eq(lists.id, event.payload.listId))
				.run()

			touchList(tx, event.payload.listId, event.createdAt)
			return
		}

		case 'list.deleted': {
			tx.update(lists)
				.set({ deletedAt: event.createdAt })
				.where(eq(lists.id, event.payload.listId))
				.run()
			return
		}

		case 'note.created': {
			tx.insert(notes)
				.values({
					id: event.payload.noteId,
					spaceId: event.spaceId,
					title: event.payload.title,
					body: event.payload.body,
					createdAt: event.createdAt,
					createdBy: event.actorId,
					updatedAt: event.createdAt,
					updatedBy: event.actorId,
				})
				.run()
			return
		}

		case 'note.edited': {
			tx.update(notes)
				.set({
					title: event.payload.title,
					body: event.payload.body,
					updatedAt: event.createdAt,
					updatedBy: event.actorId,
				})
				.where(eq(notes.id, event.payload.noteId))
				.run()
			return
		}

		/*
		 * Load-bearing. Add a type to EventPayloads without adding a branch above
		 * and this assignment stops compiling, so `npx tsc --noEmit` catches a
		 * half-added event before it can silently do nothing at runtime.
		 */
		default: {
			const unhandled: never = event
			throw new Error(`Unhandled event type: ${JSON.stringify(unhandled)}`)
		}
	}
}

/**
 * Which list an event is about, or null when it is about none.
 *
 * The answer already sits in the payload; this copies it into a column of its
 * own so that the two screens which read events per list — the change history
 * of mockup 25 and the activity line of mockup 35 — can do it with a plain
 * WHERE. See the comment on `events` in ./schema.ts for why that matters.
 *
 * Written as an exhaustive switch rather than a `'listId' in payload` test on
 * purpose: the `never` guard at the bottom means a new event type has to state
 * its answer instead of quietly getting null.
 */
function listIdOf(event: AppEvent): string | null {
	switch (event.type) {
		case 'space.created':
		case 'person.joined':
		case 'note.created':
		case 'note.edited':
			return null

		case 'list.created':
		case 'list.renamed':
		case 'list.pinned':
		case 'list.unpinned':
		case 'list.archived':
		case 'list.unarchived':
		case 'list.deleted':
		case 'item.added':
		case 'item.checked':
		case 'item.unchecked':
		case 'item.edited':
		case 'item.removed':
		case 'item.restored':
			return event.payload.listId

		default: {
			const unhandled: never = event
			throw new Error(`Unhandled event type: ${JSON.stringify(unhandled)}`)
		}
	}
}

/** Keeps `lists.updated_at` in step with its items, which M4 sorts on. */
function touchList(tx: Tx, listId: string, at: string): void {
	tx.update(lists).set({ updatedAt: at }).where(eq(lists.id, listId)).run()
}
