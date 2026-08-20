import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import type { ArchiveReason, EventPayload, EventType, Role, SpaceType } from './events'

/**
 * The on-device schema.
 *
 * `events` is the truth: append-only, never updated, never deleted. Every other
 * table is materialised from it by ./apply.ts so that reading is a plain SELECT
 * instead of a replay of history — reads outnumber writes heavily here, the
 * reactive read primitive needs a real table to subscribe to, and M11's
 * full-text index will need real rows to index.
 *
 * State lives in nullable timestamps rather than status columns: a list is
 * pinned when `pinned_at` is set, an item is checked off when `checked_at` is
 * set. Deletes are soft from the start, because mockup 25 offers "Przywróć"
 * for both checked-off and deleted items.
 *
 * Keep this file free of `@/` imports. drizzle-kit loads it through its own
 * bundler, outside Metro, and does not read the path aliases in tsconfig.json.
 */

/**
 * Device-local key/value settings. Holds `current_person_id` and
 * `current_space_id` — the answers to "who am I" and "which Przestrzeń am I
 * looking at", both of which have to survive a restart. M7 adds the appearance
 * preferences from mockup 22 here.
 */
export const settings = sqliteTable('settings', {
	key: text('key').primaryKey(),
	value: text('value').notNull(),
})

export const spaces = sqliteTable('spaces', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	type: text('type').$type<SpaceType>().notNull(),
	createdAt: text('created_at').notNull(),
	/*
	 * No foreign key on purpose: the founder joins the Przestrzeń immediately
	 * after it exists, so at the moment this row is written that person has no
	 * row yet. In M8 events can also arrive in an order this device did not
	 * choose.
	 */
	createdBy: text('created_by').notNull(),
})

/**
 * A person is global, not per-Przestrzeń — docs/PROJECT.md fixes the name and
 * the avatar colour as global per person, and one person can belong to several
 * Przestrzenie.
 */
export const people = sqliteTable('people', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	/** One of `avatarColors` in src/theme/tokens.ts. */
	color: text('color').notNull(),
	createdAt: text('created_at').notNull(),
})

export const spaceMembers = sqliteTable(
	'space_members',
	{
		spaceId: text('space_id')
			.notNull()
			.references(() => spaces.id),
		personId: text('person_id')
			.notNull()
			.references(() => people.id),
		role: text('role').$type<Role>().notNull().default('member'),
		joinedAt: text('joined_at').notNull(),
	},
	(table) => [primaryKey({ columns: [table.spaceId, table.personId] })],
)

export const lists = sqliteTable(
	'lists',
	{
		id: text('id').primaryKey(),
		spaceId: text('space_id')
			.notNull()
			.references(() => spaces.id),
		title: text('title').notNull(),
		createdAt: text('created_at').notNull(),
		createdBy: text('created_by')
			.notNull()
			.references(() => people.id),
		/** Touched by every change to the list or its items. M4 sorts on it. */
		updatedAt: text('updated_at').notNull(),
		pinnedAt: text('pinned_at'),
		archivedAt: text('archived_at'),
		/*
		 * Why a list was archived, which mockup 41 puts on screen: a completed
		 * list reads "zamknięta 12 sierpnia", one hidden by hand reads "schowana
		 * ręcznie 3 sierpnia". It also decides what unchecking an item does —
		 * only a list that closed itself reopens itself.
		 */
		archivedReason: text('archived_reason').$type<ArchiveReason>(),
		deletedAt: text('deleted_at'),
	},
	(table) => [index('lists_space_idx').on(table.spaceId)],
)

export const listItems = sqliteTable(
	'list_items',
	{
		id: text('id').primaryKey(),
		listId: text('list_id')
			.notNull()
			.references(() => lists.id),
		name: text('name').notNull(),
		/** Rendered as "×2" on mockup 07; 1 means no multiplier is shown. */
		quantity: integer('quantity').notNull().default(1),
		/** The free-text half of quick-add, "duża paczka" on mockup 07. */
		note: text('note'),
		position: integer('position').notNull(),
		createdAt: text('created_at').notNull(),
		createdBy: text('created_by')
			.notNull()
			.references(() => people.id),
		checkedAt: text('checked_at'),
		checkedBy: text('checked_by').references(() => people.id),
		deletedAt: text('deleted_at'),
	},
	(table) => [index('list_items_list_idx').on(table.listId)],
)

export const notes = sqliteTable(
	'notes',
	{
		id: text('id').primaryKey(),
		spaceId: text('space_id')
			.notNull()
			.references(() => spaces.id),
		title: text('title').notNull(),
		body: text('body').notNull().default(''),
		createdAt: text('created_at').notNull(),
		createdBy: text('created_by')
			.notNull()
			.references(() => people.id),
		updatedAt: text('updated_at').notNull(),
		updatedBy: text('updated_by')
			.notNull()
			.references(() => people.id),
		deletedAt: text('deleted_at'),
	},
	(table) => [index('notes_space_idx').on(table.spaceId)],
)

/**
 * The append-only log.
 *
 * The first six columns are exactly the Postgres table M8 specifies, so pushing
 * is a projection rather than a translation. `synced_at` is the one local-only
 * column and stays null until M8 pushes the row.
 *
 * No foreign keys here, unlike every table above: in M8 an event may refer to a
 * person this device has not pulled yet, and a constraint would reject it and
 * force the sync loop to order its inserts by dependency.
 *
 * `list_id` is derived, not authored: `listIdOf` in ./apply.ts digs it out of
 * the payload as the event is written. It exists because two screens need the
 * events of one list — mockup 25 in full, mockup 35 only the newest — and the
 * id itself lives inside `payload`, which is JSON. Reaching into it would mean
 * `json_extract`, and `useLiveQuery` refuses raw SQL outright. Local-only in
 * the same way `synced_at` is: M8 pushes the six columns above it and
 * recomputes this one when it applies a pulled event, because `applyEvent` is
 * the only writer either way.
 */
export const events = sqliteTable(
	'events',
	{
		id: text('id').primaryKey(),
		spaceId: text('space_id').notNull(),
		actorId: text('actor_id').notNull(),
		type: text('type').$type<EventType>().notNull(),
		payload: text('payload', { mode: 'json' }).$type<EventPayload>().notNull(),
		createdAt: text('created_at').notNull(),
		listId: text('list_id'),
		syncedAt: text('synced_at'),
	},
	(table) => [
		index('events_space_created_idx').on(table.spaceId, table.createdAt),
		index('events_list_created_idx').on(table.listId, table.createdAt),
	],
)
