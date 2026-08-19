import { randomUUID } from 'expo-crypto'

import { avatarColors } from '@/theme'

import {
	addItem,
	addPerson,
	checkItem,
	createList,
	createNote,
	createSpace,
	editNote,
	getSetting,
	setSetting,
} from './actions'

/**
 * Development seed: the Przestrzeń drawn in the mockups, written into the
 * database so that M4, M5 and M6 have something real to build against.
 *
 * Everything here goes through the actions, not through the tables, so the seed
 * produces a genuine event log — the feed M6 renders is the history of this
 * function running, not a separate fixture.
 *
 * Contents come from 03 (the Przestrzeń, the people, the feed), 07 (the list
 * and its eight items) and 09 (the four notes), with the body of "Kod do bramy
 * i wifi" taken from 10. Where 03 and 07 disagree — 03's feed card names three
 * added items and 07 contains two of them, counting eight rows in total — 07
 * wins, because it is the list's own screen and is internally consistent.
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

	const spaceId = createSpace(
		{ name: 'Mieszkanie 14', type: 'home' },
		{ actorId: alaId, createdAt: at(30, 10, 0) },
	)

	addPerson(
		{ spaceId, personId: alaId, name: 'Ala', color: avatarColors[0], role: 'admin' },
		{ createdAt: at(30, 10, 0) },
	)
	const kubaId = addPerson(
		{ spaceId, name: 'Kuba', color: avatarColors[1] },
		{ createdAt: at(30, 10, 5) },
	)
	const ninaId = addPerson(
		{ spaceId, name: 'Nina', color: avatarColors[2] },
		{ createdAt: at(30, 10, 10) },
	)

	setSetting('current_person_id', alaId)
	setSetting('current_space_id', spaceId)

	seedNotes({ spaceId, alaId, kubaId, ninaId })
	seedList({ spaceId, alaId, kubaId, ninaId })
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
function seedList({ spaceId, alaId, kubaId, ninaId }: People): void {
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
