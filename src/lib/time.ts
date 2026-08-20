/**
 * Dates and times, in Polish, on this device's clock.
 *
 * Everything here takes an ISO-8601 **UTC** string — what the database stores —
 * and goes through `new Date()` and the local getters. Never slice the string:
 * `createdAt.slice(11, 16)` shows UTC, which reads two hours early in Poland.
 *
 * Every function takes an optional `now` so that the boundaries can be checked
 * without waiting for midnight.
 */

/** Genitive, for a date read as "12 sierpnia". */
const MONTHS_OF = [
	'stycznia',
	'lutego',
	'marca',
	'kwietnia',
	'maja',
	'czerwca',
	'lipca',
	'sierpnia',
	'września',
	'października',
	'listopada',
	'grudnia',
] as const

/** Nominative, for the month headings of mockup 41. */
const MONTHS = [
	'STYCZEŃ',
	'LUTY',
	'MARZEC',
	'KWIECIEŃ',
	'MAJ',
	'CZERWIEC',
	'LIPIEC',
	'SIERPIEŃ',
	'WRZESIEŃ',
	'PAŹDZIERNIK',
	'LISTOPAD',
	'GRUDZIEŃ',
] as const

/**
 * Indexed by `Date#getDay()`, so Sunday first, and carrying the preposition —
 * which is not always the same word. "We wtorek", not "w wtorek".
 */
const WEEKDAYS = [
	'w niedzielę',
	'w poniedziałek',
	'we wtorek',
	'w środę',
	'w czwartek',
	'w piątek',
	'w sobotę',
] as const

/** "12:41" — local, never sliced out of the UTC string. */
export function clockTime(iso: string): string {
	const date = new Date(iso)
	const hours = String(date.getHours()).padStart(2, '0')
	const minutes = String(date.getMinutes()).padStart(2, '0')

	return `${hours}:${minutes}`
}

/** "12 sierpnia". */
export function dayMonth(iso: string): string {
	const date = new Date(iso)
	return `${date.getDate()} ${MONTHS_OF[date.getMonth()]}`
}

/** "SIERPIEŃ" — the month headings of mockup 41. */
export function monthHeading(iso: string): string {
	return MONTHS[new Date(iso).getMonth()]
}

/**
 * The one-word "when" on the cards of mockup 35: "17:05", "wczoraj", "2 dni
 * temu", "w piątek", "12 sierpnia".
 *
 * One rule produces every one of those, which is why the boundaries fall where
 * they do — 35 shows both "2 dni temu" and "w piątek", so two days keeps the
 * counted form and three days switches to the weekday.
 */
export function shortWhen(iso: string, now: Date = new Date()): string {
	const days = daysAgo(iso, now)

	if (days <= 0) return clockTime(iso)
	if (days === 1) return 'wczoraj'
	if (days === 2) return '2 dni temu'
	if (days < 7) return WEEKDAYS[new Date(iso).getDay()]

	return dayMonth(iso)
}

/** "dziś 11:07" — the footer of mockup 28. */
export function whenLong(iso: string, now: Date = new Date()): string {
	const days = daysAgo(iso, now)

	if (days <= 0) return `dziś ${clockTime(iso)}`
	if (days === 1) return `wczoraj ${clockTime(iso)}`

	return `${dayMonth(iso)} ${clockTime(iso)}`
}

/** "DZIŚ", "WCZORAJ", "12 SIERPNIA" — the day groups of mockup 25. */
export function dayHeading(iso: string, now: Date = new Date()): string {
	const days = daysAgo(iso, now)

	if (days <= 0) return 'DZIŚ'
	if (days === 1) return 'WCZORAJ'

	return dayMonth(iso).toLocaleUpperCase('pl')
}

/**
 * Whole calendar days between two moments, so that 23:50 and 00:10 are a day
 * apart rather than twenty minutes. Comparing midnights also sidesteps the two
 * days a year that are not 24 hours long.
 */
function daysAgo(iso: string, now: Date): number {
	const then = midnight(new Date(iso))
	const today = midnight(now)

	return Math.round((today - then) / 86_400_000)
}

function midnight(date: Date): number {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}
