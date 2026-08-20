/**
 * One line of typed or pasted text, turned into an item.
 *
 * The rules are not invented here — both screens that use this print them on
 * themselves. Mockup 08, under the quick-add bar: „x2" czytamy jako ilość,
 * tekst po przecinku jako dopisek — „papier, duża paczka". Mockup 19, under the
 * recognised lines: Jedna linia to jedna pozycja. Ilości typu „x2" albo „10"
 * wpisujemy w osobne pole.
 *
 * Pure: no React, no database. What it returns goes straight into `addItem` or
 * `addItems` in src/db/actions.ts.
 */

export type ParsedItem = {
	name: string
	quantity: number
	note: string | null
}

/** Highest quantity a shopping list has any business holding. */
const MAX_QUANTITY = 99

/** "x2", "X2", "×2" — the form 08 and 19 both spell out. */
const MULTIPLIER = /^[xX×](\d{1,3})$/

/** A bare number, which is how 19 reads "jajka 10". */
const BARE_NUMBER = /^(\d{1,3})$/

/**
 * Returns `null` for anything with no name left in it, so every caller has one
 * thing to check before writing an event.
 */
export function parseItem(input: string): ParsedItem | null {
	const [head, ...rest] = input.trim().split(',')

	// Everything after the first comma is the note, commas included: "papier,
	// duża paczka, ta w zielonym" is one note, not two.
	const note = rest.join(',').trim()

	const words = head.trim().split(/\s+/).filter(Boolean)
	if (words.length === 0) return null

	const quantity = quantityOf(words)
	if (quantity) words.pop()

	if (words.length === 0) return null

	const name = words.join(' ')

	return {
		// 08 shows "kawa ziarnista" being typed and 07 shows "Kawa ziarnista" on
		// the list; 19 does the same to every pasted line.
		name: name.charAt(0).toLocaleUpperCase('pl') + name.slice(1),
		quantity: quantity ?? 1,
		note: note.length > 0 ? note : null,
	}
}

/**
 * The quantity hiding in the last word, if there is one.
 *
 * A trailing number only counts when something non-numeric is left to call the
 * item — "Ziemniaki 2 kg" keeps its 2, because the last word is "kg", and "10"
 * on its own is a name, not a quantity without an item.
 */
function quantityOf(words: string[]): number | null {
	if (words.length < 2) return null

	const last = words[words.length - 1]
	const match = MULTIPLIER.exec(last) ?? BARE_NUMBER.exec(last)
	if (!match) return null

	const value = Number(match[1])
	if (value < 1) return null

	return Math.min(value, MAX_QUANTITY)
}
