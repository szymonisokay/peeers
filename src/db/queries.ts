import { and, desc, eq, isNull } from 'drizzle-orm'

import { db } from './client'
import { events, listItems, lists, notes, people, spaceMembers, spaces } from './schema'

/**
 * Reads, as unexecuted Drizzle queries for `useLiveQuery` to subscribe to:
 *
 *     const { data: items } = useLiveQuery(itemsInList(listId), [listId])
 *
 * **Every function here selects from exactly one table, and that is a
 * constraint rather than a style.** `useLiveQuery` re-runs a query only when
 * the table it selects *from* reports a change — it compares the changed
 * table's name against the query's own. A query joining `list_items` to
 * `people` would therefore keep showing an old name after someone renames
 * themselves. It also refuses raw SQL and subqueries outright, setting `error`
 * instead of returning rows.
 *
 * So when a screen needs data from two tables, run two live queries and join
 * them in JavaScript. A Przestrzeń holds a handful of people; the cost is
 * nothing and the result stays correct.
 */

export function spaceById(spaceId: string) {
	return db.select().from(spaces).where(eq(spaces.id, spaceId))
}

/**
 * The two halves of "who is in this Przestrzeń", deliberately kept apart.
 *
 * A join would go stale exactly where it matters: M7 lets the local person
 * rename themselves and change their avatar colour, and a query anchored on
 * `space_members` would not notice. Run both and join by id — a Przestrzeń
 * holds a handful of people.
 */
export function allPeople() {
	return db.select().from(people)
}

export function membersOfSpace(spaceId: string) {
	return db.select().from(spaceMembers).where(eq(spaceMembers.spaceId, spaceId))
}

export function listsInSpace(spaceId: string) {
	return db
		.select()
		.from(lists)
		.where(and(eq(lists.spaceId, spaceId), isNull(lists.deletedAt)))
		.orderBy(desc(lists.updatedAt))
}

export function itemsInList(listId: string) {
	return db
		.select()
		.from(listItems)
		.where(and(eq(listItems.listId, listId), isNull(listItems.deletedAt)))
		.orderBy(listItems.position)
}

export function notesInSpace(spaceId: string) {
	return db
		.select()
		.from(notes)
		.where(and(eq(notes.spaceId, spaceId), isNull(notes.deletedAt)))
		.orderBy(desc(notes.updatedAt))
}

/** The feed M6 renders. Newest first; ordering by text works because the
 * timestamps are ISO-8601 UTC. */
export function recentEvents(spaceId: string, limit: number) {
	return db
		.select()
		.from(events)
		.where(eq(events.spaceId, spaceId))
		.orderBy(desc(events.createdAt))
		.limit(limit)
}
