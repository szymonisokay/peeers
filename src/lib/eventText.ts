import type { AppEvent, EventType } from '@/db'
import i18n from '@/i18n'

/**
 * Events, turned into the sentences that mockups 25 and 35 print.
 *
 * Two steps, kept apart on purpose. `groupEvents` folds a run of related
 * events into one line — three items added at 11:07 read as "dopisał(-a) 3
 * pozycje", not as three rows. `describe` then writes that line. M6's feed
 * needs exactly the same two steps over the same log, so neither of them knows
 * anything about a screen.
 *
 * The actor's name is returned separately from the rest of the sentence
 * because mockup 25 sets it in a heavier weight than what follows it.
 *
 * Only `describe` speaks a language. Everything above it — the grouping, the
 * window, the creation burst — is arithmetic on timestamps and stays the same
 * whichever language is active.
 */

/** A run of events shown as one row. */
export type ActivityGroup = {
	/** The newest event's id — a stable React key. */
	id: string
	type: EventType
	actorId: string
	/** The newest event in the group. */
	createdAt: string
	/** Newest first, like the query that produced them. */
	events: AppEvent[]
	/** Set when a `list.created` group swallowed the items added with it. */
	addedWithList?: AppEvent[]
}

/**
 * How far apart two events can be and still read as one action. Ten minutes is
 * long enough to cover somebody typing a shopping list in one sitting and
 * short enough that this morning and this afternoon stay separate rows.
 */
const GROUP_WINDOW_MS = 10 * 60 * 1000

/**
 * Folds a newest-first list of events into rows.
 *
 * Two events join when the same person did the same kind of thing within the
 * window. One special case follows: a list created and then filled in the same
 * sitting is one row — "Ty utworzył(-a) listę i dodał(-a) 8 pozycji" on
 * mockup 25 — because the creation is not interesting on its own.
 */
export function groupEvents(events: AppEvent[]): ActivityGroup[] {
	const groups: ActivityGroup[] = []

	for (const event of events) {
		const current = groups[groups.length - 1]

		if (current && joins(current, event)) {
			current.events.push(event)
			continue
		}

		groups.push({
			id: event.id,
			type: event.type,
			actorId: event.actorId,
			createdAt: event.createdAt,
			events: [event],
		})
	}

	return mergeCreationBursts(groups)
}

function joins(group: ActivityGroup, event: AppEvent): boolean {
	if (group.type !== event.type || group.actorId !== event.actorId) return false

	// The list is newest first, so the group's oldest event is its last one and
	// the candidate is older still.
	const oldest = group.events[group.events.length - 1]
	return within(oldest.createdAt, event.createdAt)
}

function mergeCreationBursts(groups: ActivityGroup[]): ActivityGroup[] {
	const merged: ActivityGroup[] = []

	for (let index = 0; index < groups.length; index += 1) {
		const group = groups[index]
		const older = groups[index + 1]

		const isBurst =
			group.type === 'item.added' &&
			older?.type === 'list.created' &&
			older.actorId === group.actorId &&
			within(older.createdAt, group.events[group.events.length - 1].createdAt)

		if (isBurst) {
			merged.push({ ...older, addedWithList: group.events })
			index += 1
			continue
		}

		merged.push(group)
	}

	return merged
}

function within(a: string, b: string): boolean {
	return Math.abs(Date.parse(a) - Date.parse(b)) <= GROUP_WINDOW_MS
}

export type DescribeContext = {
	/** Whoever is holding this phone: their own actions read "Ty". */
	currentPersonId: string
	personName: (id: string) => string
	/** Names are looked up rather than carried in the payload — see src/db/events.ts. */
	itemName: (id: string) => string
}

export type Described = {
	/** "Kuba", or "Ty" for the current person. Rendered in a heavier weight. */
	actor: string
	rest: string
	/** The names in the grey chip of mockup 25, for a run of added items. */
	items?: string[]
}

/**
 * The sentence for one group.
 *
 * The current person is written as "Ty" followed by the same verb form
 * everybody else gets — "Ty odhaczył(-a) chleb". Mockups 25 and 35 disagree
 * about this and 25 wins; see docs/DESIGN.md.
 *
 * Splitting the sentence into an actor and a rest survives translation because
 * both languages put the subject first: "Kuba" plus "dopisał(-a) 3 pozycje",
 * "Kuba" plus "added 3 items". A language that puts the verb first would need
 * this shape reconsidered rather than a longer message file.
 */
export function describe(group: ActivityGroup, ctx: DescribeContext): Described {
	const actor =
		group.actorId === ctx.currentPersonId ? i18n.t('app.you') : ctx.personName(group.actorId)
	const [first] = group.events
	const count = group.events.length

	switch (first.type) {
		case 'space.created':
			return { actor, rest: i18n.t('activity.spaceCreated') }

		case 'person.joined':
			return { actor, rest: i18n.t('activity.personJoined') }

		case 'list.created': {
			const added = group.addedWithList
			if (!added) return { actor, rest: i18n.t('activity.listCreated') }

			return {
				actor,
				rest: i18n.t('activity.listCreatedWithItems', { items: items(added.length) }),
			}
		}

		case 'item.added':
			return {
				actor,
				rest:
					count === 1
						? i18n.t('activity.itemAdded', { name: name(first, ctx) })
						: i18n.t('activity.itemAddedMany', { items: items(count) }),
				items: count === 1 ? undefined : group.events.map((event) => name(event, ctx)),
			}

		case 'item.checked':
			return {
				actor,
				rest:
					count === 1
						? i18n.t('activity.itemChecked', { name: name(first, ctx) })
						: i18n.t('activity.itemCheckedMany', { items: items(count) }),
			}

		case 'item.unchecked':
			return {
				actor,
				rest:
					count === 1
						? i18n.t('activity.itemUnchecked', { name: name(first, ctx) })
						: i18n.t('activity.itemUncheckedMany', { items: items(count) }),
			}

		case 'item.edited':
			return {
				actor,
				rest:
					count === 1
						? i18n.t('activity.itemEdited', { name: name(first, ctx) })
						: i18n.t('activity.itemEditedMany', { items: items(count) }),
			}

		case 'item.removed':
			return {
				actor,
				rest:
					count === 1
						? i18n.t('activity.itemRemoved', { name: name(first, ctx) })
						: i18n.t('activity.itemRemovedMany', { items: items(count) }),
			}

		case 'item.restored':
			return {
				actor,
				rest:
					count === 1
						? i18n.t('activity.itemRestored', { name: name(first, ctx) })
						: i18n.t('activity.itemRestoredMany', { items: items(count) }),
			}

		case 'list.renamed':
			return { actor, rest: i18n.t('activity.listRenamed', { title: first.payload.title }) }

		case 'list.pinned':
			return { actor, rest: i18n.t('activity.listPinned') }

		case 'list.unpinned':
			return { actor, rest: i18n.t('activity.listUnpinned') }

		case 'list.archived':
			return {
				actor,
				rest:
					first.payload.reason === 'completed'
						? i18n.t('activity.listClosed')
						: i18n.t('activity.listArchived'),
			}

		case 'list.unarchived':
			return { actor, rest: i18n.t('activity.listUnarchived') }

		case 'list.deleted':
			return { actor, rest: i18n.t('activity.listDeleted') }

		case 'note.created':
			return { actor, rest: i18n.t('activity.noteCreated', { title: first.payload.title }) }

		case 'note.edited':
			return { actor, rest: i18n.t('activity.noteEdited', { title: first.payload.title }) }

		/*
		 * Load-bearing, like the one in src/db/apply.ts: an event type added
		 * without a sentence here stops compiling instead of reaching a screen
		 * as a blank row.
		 */
		default: {
			const unhandled: never = first
			throw new Error(`Undescribed event: ${JSON.stringify(unhandled)}`)
		}
	}
}

/**
 * "3 pozycje", "8 pozycji", "3 items".
 *
 * The Polish forms here are **accusative**, which is what every verb in this
 * file takes — "dopisał(-a) 3 pozycje". The nominative ones a list header needs
 * are a separate key, `list.itemCount`. Two keys, because Polish needs two;
 * English fills both with the same words.
 */
function items(count: number): string {
	return i18n.t('activity.items', { count })
}

function name(event: AppEvent, ctx: DescribeContext): string {
	const fallback = i18n.t('activity.itemFallback')

	if (!('itemId' in event.payload)) return fallback
	return ctx.itemName(event.payload.itemId) || fallback
}

/** "Kuba", "Kuba i Nina", "Kuba, Nina i Ola" — the empty list of mockup 15. */
export function joinNames(names: string[]): string {
	if (names.length === 0) return ''
	if (names.length === 1) return names[0]

	return i18n.t('activity.namesJoin', {
		names: names.slice(0, -1).join(', '),
		last: names[names.length - 1],
	})
}
