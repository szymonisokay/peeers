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
	addItems,
	addPerson,
	archiveList,
	checkItem,
	createList,
	createNote,
	createSpace,
	currentPersonId,
	currentSpaceId,
	deleteList,
	editItem,
	editNote,
	getSetting,
	pinList,
	removeItem,
	renameList,
	restoreItem,
	setSetting,
	unarchiveList,
	uncheckItem,
	unpinList,
} from './actions'
export { applyEvent } from './apply'
export {
	allItemsInList,
	allPeople,
	eventsForList,
	frequentItemNames,
	frequentNotesFor,
	itemById,
	itemCountsByList,
	itemNames,
	itemsInList,
	listActivity,
	listById,
	listsInSpace,
	listToCopy,
	membersOfSpace,
	notesInSpace,
	recentEvents,
	spaceById,
} from './queries'
export { ensureSeed } from './seed'
export { asAppEvent } from './events'
export type {
	AppEvent,
	ArchiveReason,
	EventPayloads,
	EventRow,
	EventType,
	Role,
	SpaceType,
} from './events'
export * from './schema'
