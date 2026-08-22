import { randomUUID } from 'expo-crypto'

import { avatarColors } from '@/theme'

import {
	addItem,
	addPerson,
	archiveList,
	checkItem,
	createList,
	createNote,
	createSpace,
	editNote,
	getSetting,
	pinList,
	setSetting,
} from './actions'
import type { ArchiveReason } from './events'

/**
 * Development seed: the Przestrzeń drawn in the mockups, written into the
 * database so that M4, M5 and M6 have something real to build against.
 *
 * Everything here goes through the actions, not through the tables, so the seed
 * produces a genuine event log — the feed M6 renders is the history of this
 * function running, not a separate fixture.
 *
 * Contents come from 03 (the Przestrzeń, the people, the feed), 07 (the list
 * and its eight items), 09 (the four notes), 35 (the other three active lists)
 * and 41 (the archive), with the body of "Kod do bramy i wifi" taken from 10.
 * Where 03 and 07 disagree — 03's feed card names three added items and 07
 * contains two of them, counting eight rows in total — 07 wins, because it is
 * the list's own screen and is internally consistent.
 *
 * The archive holds the five lists 41 names, not the eight its header counts,
 * and each of them a handful of items rather than the 9, 14 and 22 its
 * subtitles claim. Both counters are computed, so the screens stay internally
 * consistent; inventing three list names to match a number in a drawing would
 * not make anything truer.
 *
 * Not seeded: the third feed card in 03 ("Ty — Kto bierze prąd w tym
 * miesiącu? … 1 odpowiedź"). That is a message with a reply, which
 * docs/PROJECT.md puts out of scope.
 */
export function ensureSeed(): void {
	// Cheap and idempotent, so the caller can run it on every launch.
	if (getSetting('current_person_id')) return

	// "Ty" in 03 and 07 carries a blue A avatar, so the device owner is Ala.
	const alaId = randomUUID()

	// 45 days back rather than 30: the oldest list in the archive was closed 31
	// days ago, and a list cannot predate the Przestrzeń it belongs to.
	const spaceId = createSpace(
		{ name: 'Mieszkanie 14', type: 'home' },
		{ actorId: alaId, createdAt: at(45, 10, 0) },
	)

	addPerson(
		{ spaceId, personId: alaId, name: 'Ala', color: avatarColors[0], role: 'admin' },
		{ createdAt: at(45, 10, 0) },
	)
	const kubaId = addPerson(
		{ spaceId, name: 'Kuba', color: avatarColors[1] },
		{ createdAt: at(45, 10, 5) },
	)
	const ninaId = addPerson(
		{ spaceId, name: 'Nina', color: avatarColors[2] },
		{ createdAt: at(45, 10, 10) },
	)

	setSetting('current_person_id', alaId)
	setSetting('current_space_id', spaceId)

	const people = { spaceId, alaId, kubaId, ninaId }

	seedNotes(people)
	seedList(people)
	seedActiveLists(people)
	seedArchive(people)
}

type People = { spaceId: string; alaId: string; kubaId: string; ninaId: string }

/** The four notes of 09, in the order that screen lists them. */
function seedNotes({ spaceId, alaId, kubaId, ninaId }: People): void {
	const gateNoteId = createNote(
		{ spaceId, title: 'Kod do bramy i wifi', body: GATE_NOTE_BODY },
		{ actorId: ninaId, createdAt: at(20, 9, 30) },
	)

	createNote(
		{ spaceId, title: 'Pomysły na urodziny Ali' },
		{ actorId: ninaId, createdAt: at(3, 21, 15) },
	)
	createNote(
		{ spaceId, title: 'Rachunki i terminy' },
		{ actorId: alaId, createdAt: at(4, 8, 40) },
	)
	createNote(
		{ spaceId, title: 'Co zabrać w Bieszczady' },
		{ actorId: kubaId, createdAt: at(7, 19, 0) },
	)

	// The fourth feed card in 03: "Nina zmieniła notatkę … wczoraj 12:04".
	editNote(
		{ spaceId, noteId: gateNoteId, title: 'Kod do bramy i wifi', body: GATE_NOTE_BODY },
		{ actorId: ninaId, createdAt: at(1, 12, 4) },
	)
}

/** "Biedronka, sobota" and its eight items, in the order 07 draws them. */
function seedList({ spaceId, alaId, kubaId, ninaId }: People): string {
	const listId = createList(
		{ spaceId, title: 'Biedronka, sobota' },
		{ actorId: alaId, createdAt: at(1, 18, 0) },
	)

	const add = (
		name: string,
		actorId: string,
		createdAt: string,
		extra?: { quantity?: number; note?: string },
	) => addItem({ spaceId, listId, name, ...extra }, { actorId, createdAt })

	add('Mleko owsiane', kubaId, at(1, 18, 2), { quantity: 2 })
	add('Serek wiejski', alaId, at(1, 18, 4))
	add('Pomidory malinowe', alaId, at(1, 18, 5))
	// Ziemniaki and kawa are the two items 03 shows Nina adding at 11:07 today.
	add('Ziemniaki 2 kg', ninaId, at(0, 11, 7))
	add('Papier toaletowy', ninaId, at(1, 18, 8), { note: 'duża paczka' })
	add('Kawa ziarnista', ninaId, at(0, 11, 7))

	const butterId = add('Masło', kubaId, at(1, 18, 9))
	const breadId = add('Chleb', kubaId, at(1, 18, 10))

	// "Kuba odhaczył(-a) chleb i masło · 12:41" — the ODHACZONE · 2 section of 07.
	checkItem({ spaceId, listId, itemId: butterId }, { actorId: kubaId, createdAt: at(0, 12, 41) })
	checkItem({ spaceId, listId, itemId: breadId }, { actorId: kubaId, createdAt: at(0, 12, 41) })

	// The PRZYPIĘTA section of 35 holds exactly this list.
	pinList({ spaceId, listId }, { actorId: alaId, createdAt: at(1, 18, 15) })

	return listId
}

/** The three lists under "AKTYWNE · 3" on 35, with the activity each one shows. */
function seedActiveLists({ spaceId, alaId, kubaId, ninaId }: People): void {
	// "Nina utworzył(-a) · wczoraj" — created and filled in one sitting, which
	// the history formatter folds into a single line.
	const drogeria = createList(
		{ spaceId, title: 'Drogeria' },
		{ actorId: ninaId, createdAt: at(1, 9, 20) },
	)
	for (const name of ['Szampon', 'Pasta do zębów', 'Chusteczki', 'Płyn do naczyń']) {
		addItem({ spaceId, listId: drogeria, name }, { actorId: ninaId, createdAt: at(1, 9, 21) })
	}

	// "Ty odhaczył(-a) Buty · 2 dni temu" — seven of twelve packed, boots last.
	const wyjazd = createList(
		{ spaceId, title: 'Pakowanie na wyjazd' },
		{ actorId: alaId, createdAt: at(4, 20, 10) },
	)
	const packing = [
		'Kurtka',
		'Śpiwór',
		'Ładowarka',
		'Ręcznik',
		'Skarpety',
		'Czapka',
		'Okulary',
		'Apteczka',
		'Powerbank',
		'Bidon',
		'Latarka',
		'Buty',
	].map((name) =>
		addItem({ spaceId, listId: wyjazd, name }, { actorId: alaId, createdAt: at(4, 20, 12) }),
	)

	packing.slice(0, 6).forEach((itemId, index) => {
		checkItem(
			{ spaceId, listId: wyjazd, itemId },
			{ actorId: alaId, createdAt: at(3, 19, index) },
		)
	})
	checkItem(
		{ spaceId, listId: wyjazd, itemId: packing[packing.length - 1] },
		{ actorId: alaId, createdAt: at(2, 18, 40) },
	)

	// "Kuba dopisał(-a) · w piątek" — the newest thing here is an addition on
	// its own, hours after the list was made, so it does not fold into the
	// creation.
	const kawa = createList(
		{ spaceId, title: 'Kawa i herbata' },
		{ actorId: kubaId, createdAt: at(5, 18, 0) },
	)
	const beans = addItem(
		{ spaceId, listId: kawa, name: 'Kawa ziarnista', quantity: 2 },
		{ actorId: kubaId, createdAt: at(5, 18, 1) },
	)
	addItem(
		{ spaceId, listId: kawa, name: 'Herbata zielona' },
		{ actorId: kubaId, createdAt: at(5, 18, 2) },
	)
	addItem(
		{ spaceId, listId: kawa, name: 'Mleko do kawy' },
		{ actorId: kubaId, createdAt: at(5, 20, 30) },
	)
	checkItem({ spaceId, listId: kawa, itemId: beans }, { actorId: kubaId, createdAt: at(5, 19, 0) })
}

/**
 * The archive of 41: four lists that closed themselves once everything on them
 * was checked off, and one that somebody put away unfinished — "Chemia do
 * łazienki", which is why that row reads "2 z 6 · schowana ręcznie".
 *
 * The day offsets reproduce the dates 41 draws when the seed is run in August.
 */
function seedArchive({ spaceId, alaId, kubaId, ninaId }: People): void {
	seedArchived({
		spaceId,
		actorId: alaId,
		title: 'Lidl, czwartek',
		daysAgo: 8,
		items: ['Mleko', 'Chleb', 'Masło', 'Jajka', 'Ser żółty'],
		checked: 5,
		reason: 'completed',
		closedDaysAgo: 7,
	})

	seedArchived({
		spaceId,
		actorId: ninaId,
		title: 'Urodziny Oli',
		daysAgo: 16,
		items: ['Tort', 'Świeczki', 'Balony', 'Prezent', 'Sok'],
		checked: 5,
		reason: 'completed',
		closedDaysAgo: 14,
	})

	seedArchived({
		spaceId,
		actorId: kubaId,
		title: 'Chemia do łazienki',
		daysAgo: 18,
		items: [
			'Płyn do WC',
			'Mydło w płynie',
			'Gąbki',
			'Odświeżacz',
			'Papier toaletowy',
			'Płyn do prania',
		],
		checked: 2,
		reason: 'manual',
		closedDaysAgo: 16,
	})

	seedArchived({
		spaceId,
		actorId: alaId,
		title: 'Bieszczady, maj',
		daysAgo: 25,
		items: ['Śpiwór', 'Kuchenka turystyczna', 'Mapa', 'Latarka', 'Apteczka'],
		checked: 5,
		reason: 'completed',
		closedDaysAgo: 22,
	})

	seedArchived({
		spaceId,
		actorId: kubaId,
		title: 'Kajaki',
		daysAgo: 33,
		items: ['Kapoki', 'Worki wodoszczelne', 'Krem z filtrem', 'Woda'],
		checked: 4,
		reason: 'completed',
		closedDaysAgo: 31,
	})
}

function seedArchived(input: {
	spaceId: string
	actorId: string
	title: string
	daysAgo: number
	items: string[]
	checked: number
	reason: ArchiveReason
	closedDaysAgo: number
}): void {
	const { spaceId, actorId, title, daysAgo, items, checked, reason, closedDaysAgo } = input
	const options = { actorId, createdAt: at(daysAgo, 17, 0) }

	const listId = createList({ spaceId, title }, options)
	const itemIds = items.map((name, index) =>
		addItem({ spaceId, listId, name }, { actorId, createdAt: at(daysAgo, 17, index + 1) }),
	)

	itemIds.slice(0, checked).forEach((itemId, index) => {
		checkItem(
			{ spaceId, listId, itemId },
			{ actorId, createdAt: at(closedDaysAgo, 11, index) },
		)
	})

	/*
	 * A list whose every item is checked closes itself — `closeIfDone` in
	 * ./actions.ts appended that event as part of the last `checkItem` above.
	 * Saying it again here would put two archivals in the log and make the
	 * change history report the same thing twice.
	 */
	const closedItself = reason === 'completed' && checked === items.length && items.length > 0
	if (closedItself) return

	archiveList(
		{ spaceId, listId, reason },
		{ actorId, createdAt: at(closedDaysAgo, 11, items.length) },
	)
}

/**
 * Copied from 10. The markdown is the simplified subset docs/PROJECT.md allows
 * — bold, blockquote and inline code chips — which M5 will render.
 */
const GATE_NOTE_BODY = `Brama od podwórza: \`4417#\`

Wifi **Peeers_14** — hasło \`dwakoty2024\`

> Router stoi w przedpokoju na szafce. Jak nie ma neta, wyciągnąć wtyczkę na 30 sekund.

Śmieci: \`wtorek szkło\`, \`czwartek bio\``

/**
 * A timestamp relative to now, as ISO-8601 UTC.
 *
 * Relative on purpose: M6 groups the feed by day under "DZIŚ W PRZESTRZENI",
 * so a seed written with absolute dates would stop looking like 03 the day
 * after it was written.
 */
function at(daysAgo: number, hours: number, minutes: number): string {
	const date = new Date()
	date.setDate(date.getDate() - daysAgo)
	date.setHours(hours, minutes, 0, 0)
	return date.toISOString()
}
