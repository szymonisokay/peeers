/**
 * Polish plural forms.
 *
 * Polish picks between three forms, not two. The caller passes all three
 * because the case changes with the sentence: mockup 41 counts in the
 * nominative ("9 pozycji", "22 pozycje") and mockup 19 asks in the accusative
 * ("Dodaj 5 pozycji do listy", "Dodaj 2 pozycje do listy").
 *
 *     `${n} ${plural(n, 'lista', 'listy', 'list')}`        →  8 list
 *     `Dodaj ${n} ${plural(n, 'pozycję', 'pozycje', 'pozycji')} do listy`
 */
export function plural(n: number, one: string, few: string, many: string): string {
	const abs = Math.abs(Math.trunc(n))

	if (abs === 1) return one

	// The teens are the exception that makes this more than "2, 3, 4": 12, 13
	// and 14 take the same form as 15, not the same form as 2, 3 and 4.
	const lastTwo = abs % 100
	if (lastTwo >= 12 && lastTwo <= 14) return many

	const last = abs % 10
	return last >= 2 && last <= 4 ? few : many
}
