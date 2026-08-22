import { and, count, desc, eq, gte, isNotNull, isNull } from 'drizzle-orm'

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

export function listById(listId: string) {
	return db.select().from(lists).where(eq(lists.id, listId))
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

/**
 * Every item ever put on this list, deleted ones included.
 *
 * The change history of mockup 25 needs the deleted rows: it renders
 * "usunął(-ęła) pozycję „chipsy"" and offers "Przywróć", and both need the name
 * of something that `itemsInList` deliberately hides.
 */
export function allItemsInList(listId: string) {
	return db.select().from(listItems).where(eq(listItems.listId, listId)).orderBy(listItems.position)
}

/**
 * Every item's id and name, for the sentences that name one — "Ty odhaczył(-a)
 * Buty" on 35, the whole of 25. The names are not in the payloads on purpose
 * (see src/db/events.ts), so they are looked up and joined in JavaScript.
 */
export function itemNames() {
	return db.select({ id: listItems.id, name: listItems.name }).from(listItems)
}

export function itemById(itemId: string) {
	return db.select().from(listItems).where(eq(listItems.id, itemId))
}

/**
 * "2 z 8" for every list at once — the counters and progress bars of mockup 35.
 *
 * `count(column)` counts non-null values, so counting `checked_at` is exactly
 * "how many are checked off". This is still a select from one table, which is
 * what `useLiveQuery` needs; what it refuses is raw SQL and subqueries.
 */
export function itemCountsByList() {
	return db
		.select({
			listId: listItems.listId,
			total: count(),
			checked: count(listItems.checkedAt),
		})
		.from(listItems)
		.where(isNull(listItems.deletedAt))
		.groupBy(listItems.listId)
}

/**
 * The newest events of every list in a Przestrzeń, for the one-line summary
 * each card carries on mockup 35 ("Kuba dopisał(-a) 3 pozycje · 17:05").
 *
 * One query rather than one per list: the caller takes the newest group per
 * list out of the result in JavaScript. `limit` bounds it; a list with nothing
 * inside the window falls back to its own `created_by` and `created_at`, which
 * are always there.
 */
export function listActivity(spaceId: string, limit: number) {
	return db
		.select()
		.from(events)
		.where(and(eq(events.spaceId, spaceId), isNotNull(events.listId)))
		.orderBy(desc(events.createdAt))
		.limit(limit)
}

/**
 * One list's history, newest first — mockup 25, whose subtitle reads "Ostatnie
 * 30 dni". `sinceIso` is that window and is a real filter, not decoration.
 * Comparing ISO-8601 UTC strings as text sorts and ranges correctly.
 */
export function eventsForList(listId: string, sinceIso: string) {
	return db
		.select()
		.from(events)
		.where(and(eq(events.listId, listId), gte(events.createdAt, sinceIso)))
		.orderBy(desc(events.createdAt))
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

/*
 * One-shot reads.
 *
 * Everything above this line is an unexecuted query handed to `useLiveQuery`.
 * Everything below executes immediately and returns plain values, because
 * nobody needs it to change under their thumb: the suggestion chips of mockups
 * 08, 15 and 28 are a snapshot taken when a field is focused.
 *
 * Being executed also frees them from the one-table rule, so they can join.
 * The grouping is done in JavaScript rather than with SQL's `lower()`, which
 * folds ASCII only and would treat "Żółty" and "żółty" as two different things.
 *
 * The folding below is deliberately **locale-independent** — `toLowerCase()`,
 * not `toLocaleLowerCase(i18n.language)`. What is being folded is data: item
 * names people typed, shared with everybody in the Przestrzeń whatever language
 * each of their phones is set to. Tying it to the reader's UI language would
 * make two people disagree about whether "Mleko" and "mleko" are one item.
 * `toLowerCase()` is still Unicode-aware, so "Ż" folds to "ż" — the ASCII
 * problem above is SQL's, not JavaScript's — and it cannot be broken by a
 * language with its own casing rules: in Turkish, "INBOX" lowercases to
 * "ınbox", which would stop matching the very rows it is meant to find.
 */

/**
 * "CZĘSTE U WAS" — the names used most often in this Przestrzeń, minus the ones
 * already on the list in front of you.
 *
 * Archived lists count. Mockup 41 says so in its own info strip: "Z archiwum
 * bierzemy podpowiedzi przy dopisywaniu."
 */
export function frequentItemNames(
	spaceId: string,
	excludeListId: string,
	limit: number,
): string[] {
	const rows = db
		.select({
			name: listItems.name,
			listId: listItems.listId,
			createdAt: listItems.createdAt,
		})
		.from(listItems)
		.innerJoin(lists, eq(lists.id, listItems.listId))
		.where(and(eq(lists.spaceId, spaceId), isNull(lists.deletedAt), isNull(listItems.deletedAt)))
		.all()

	const onThisList = new Set<string>()
	const tally = new Map<string, { name: string; uses: number; lastUsed: string }>()

	for (const row of rows) {
		const key = row.name.toLowerCase()
		if (row.listId === excludeListId) onThisList.add(key)

		const entry = tally.get(key)
		if (!entry) {
			tally.set(key, { name: row.name, uses: 1, lastUsed: row.createdAt })
			continue
		}

		entry.uses += 1
		// Keep the most recent spelling: "mleko owsiane" typed today beats the
		// same thing typed three weeks ago.
		if (row.createdAt > entry.lastUsed) {
			entry.lastUsed = row.createdAt
			entry.name = row.name
		}
	}

	return [...tally.entries()]
		.filter(([key]) => !onThisList.has(key))
		.map(([, entry]) => entry)
		.sort((a, b) => b.uses - a.uses || b.lastUsed.localeCompare(a.lastUsed))
		.slice(0, limit)
		.map((entry) => entry.name)
}

/**
 * One list's title and items, for "Skopiuj pozycje na nową listę" on mockup 41.
 *
 * A snapshot, not a live query: the copy happens once, at the moment the new
 * list is created, and nothing about it should change under the person naming
 * it. Checked items come back unchecked — copying a shopping list means copying
 * what to buy, not what somebody already bought.
 */
export function listToCopy(
	listId: string,
): { title: string; items: { name: string; quantity: number; note: string | null }[] } | null {
	const [list] = db.select().from(lists).where(eq(lists.id, listId)).all()
	if (!list) return null

	const items = db
		.select({ name: listItems.name, quantity: listItems.quantity, note: listItems.note })
		.from(listItems)
		.where(and(eq(listItems.listId, listId), isNull(listItems.deletedAt)))
		.orderBy(listItems.position)
		.all()

	return { title: list.title, items }
}

/**
 * The note chips on mockup 28 — "duża paczka", "bezzapachowy", "jak zwykle" —
 * which are the notes this Przestrzeń has put on this item before, most recent
 * first. Returns an empty array when there are none, and the caller then draws
 * no chip row at all rather than an empty one.
 */
export function frequentNotesFor(spaceId: string, name: string, limit: number): string[] {
	const wanted = name.toLowerCase()

	const rows = db
		.select({
			name: listItems.name,
			note: listItems.note,
			createdAt: listItems.createdAt,
		})
		.from(listItems)
		.innerJoin(lists, eq(lists.id, listItems.listId))
		.where(and(eq(lists.spaceId, spaceId), isNull(lists.deletedAt), isNotNull(listItems.note)))
		.orderBy(desc(listItems.createdAt))
		.all()

	const notes: string[] = []

	for (const row of rows) {
		if (!row.note) continue
		if (row.name.toLowerCase() !== wanted) continue
		if (notes.some((note) => note.toLowerCase() === row.note?.toLowerCase())) {
			continue
		}

		notes.push(row.note)
		if (notes.length === limit) break
	}

	return notes
}
