/**
 * Dates and times, in the app's active language, on this device's clock.
 *
 * Everything here takes an ISO-8601 **UTC** string — what the database stores —
 * and goes through `new Date()` and the local getters. Never slice the string:
 * `createdAt.slice(11, 16)` shows UTC, which reads two hours early in Poland.
 *
 * Every function takes an optional `now` so that the boundaries can be checked
 * without waiting for midnight.
 *
 * These are not React components, so they reach the translator through the
 * i18next instance rather than through `useTranslation()`. A screen that
 * renders what they return calls `useTranslation()` itself, so that it
 * re-renders when the language changes — see rule 3 in AGENTS.md.
 */
import i18n from '@/i18n'

/**
 * The calendar's words, from the message files.
 *
 * They live there rather than coming out of `Intl.DateTimeFormat` because the
 * Polish weekdays carry their preposition and it is not always the same word —
 * "we wtorek", not "w wtorek" — and no date formatter produces that. Having
 * half the calendar come from the engine and half from a message file would be
 * worse than either.
 */
function table(key: 'time.monthsOf' | 'time.months' | 'time.weekdays'): string[] {
	return i18n.t(key, { returnObjects: true })
}

/** "12:41" — local, never sliced out of the UTC string. */
export function clockTime(iso: string): string {
	const date = new Date(iso)
	const hours = String(date.getHours()).padStart(2, '0')
	const minutes = String(date.getMinutes()).padStart(2, '0')

	return `${hours}:${minutes}`
}

/** "12 sierpnia", "12 August". */
export function dayMonth(iso: string): string {
	const date = new Date(iso)

	return i18n.t('time.dayMonth', {
		day: date.getDate(),
		month: table('time.monthsOf')[date.getMonth()],
	})
}

/** "SIERPIEŃ" — the month headings of mockup 41. */
export function monthHeading(iso: string): string {
	return table('time.months')[new Date(iso).getMonth()]
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
	if (days === 1) return i18n.t('time.yesterday')
	// Only 2 ever reaches this, but a counted key costs nothing and stays right
	// if the boundary below ever moves.
	if (days === 2) return i18n.t('time.daysAgo', { count: days })
	if (days < 7) return table('time.weekdays')[new Date(iso).getDay()]

	return dayMonth(iso)
}

/** "dziś 11:07" — the footer of mockup 28. */
export function whenLong(iso: string, now: Date = new Date()): string {
	const days = daysAgo(iso, now)
	const time = clockTime(iso)

	if (days <= 0) return i18n.t('time.todayAt', { time })
	if (days === 1) return i18n.t('time.yesterdayAt', { time })

	return i18n.t('time.dateAt', { date: dayMonth(iso), time })
}

/** "DZIŚ", "WCZORAJ", "12 SIERPNIA" — the day groups of mockup 25. */
export function dayHeading(iso: string, now: Date = new Date()): string {
	const days = daysAgo(iso, now)

	if (days <= 0) return i18n.t('time.headingToday')
	if (days === 1) return i18n.t('time.headingYesterday')

	return dayMonth(iso).toLocaleUpperCase(i18n.language)
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
