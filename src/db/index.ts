/**
 * The data layer's public surface. Screens import from `@/db`, never from the
 * files below it.
 *
 * The shape to hold on to: reads come from ./queries.ts through `useLiveQuery`,
 * writes go through ./actions.ts, and ./apply.ts is the only writer underneath
 * both. Nothing else may insert or update a materialised table.
 */

export { db, sqlite } from './client'
export {
	addItem,
	addPerson,
	checkItem,
	createList,
	createNote,
	createSpace,
	currentPersonId,
	currentSpaceId,
	editNote,
	getSetting,
	setSetting,
	uncheckItem,
} from './actions'
export { applyEvent } from './apply'
export {
	allPeople,
	itemsInList,
	listsInSpace,
	membersOfSpace,
	notesInSpace,
	recentEvents,
	spaceById,
} from './queries'
export { ensureSeed } from './seed'
export type { AppEvent, EventPayloads, EventType, Role, SpaceType } from './events'
export * from './schema'
