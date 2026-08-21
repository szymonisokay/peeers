/**
 * The app's two languages.
 *
 * Which one is active is decided once, here, at startup: the phone's own
 * ordered language list is scanned and the first supported entry wins.
 * Anything that is neither Polish nor English gets English. Nothing lets the
 * user choose yet — that is M7's settings screen, which will call
 * `setLanguage` and persist the answer.
 *
 * Hermes, the JavaScript engine both platforms run, does not implement
 * `Intl.PluralRules`, and i18next has needed it since v24 for anything beyond
 * English's one/other split. Without the import below, Polish silently loses
 * its `_few` and `_many` forms and "5 pozycji" renders as "5 pozycja" — wrong
 * text, not an error.
 *
 * The import has no bindings; it is here for its side effect. It carries every
 * CLDR locale, so adding a third language needs nothing here, and it steps
 * aside only for an engine that already has a complete implementation —
 * `Intl.PluralRules` with a `selectRange` method and more than one locale.
 * `Intl.PluralRules.polyfill` is `true` when it loaded.
 */
import 'intl-pluralrules'

import { getLocales } from 'expo-localization'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '@/messages/en.json'
import pl from '@/messages/pl.json'

/*
 * English is the type source — see ./messages.d.ts — so `t('does.not.exist')`
 * fails `npx tsc --noEmit`. This assignment covers the other direction: it
 * stops compiling when pl.json is missing a key en.json has. Polish-only keys,
 * the `_few` and `_many` plural forms English has no use for, are fine, because
 * assigning from a variable does not check for excess properties.
 */
const plCoversEn: typeof en = pl
void plCoversEn

export const languages = ['pl', 'en'] as const
export type Language = (typeof languages)[number]

/** English for every phone that did not ask for Polish. */
export const fallbackLanguage: Language = 'en'

/**
 * The phone's first supported language.
 *
 * `getLocales()` returns the whole preference list, not one entry, so a phone
 * set to German first and Polish second gets Polish rather than the fallback.
 */
export function deviceLanguage(): Language {
	for (const locale of getLocales()) {
		const code = locale.languageCode

		if (code && (languages as readonly string[]).includes(code)) {
			return code as Language
		}
	}

	return fallbackLanguage
}

i18n.use(initReactI18next).init({
	resources: { en: { translation: en }, pl: { translation: pl } },
	lng: deviceLanguage(),
	fallbackLng: fallbackLanguage,
	// React escapes what it renders; i18next escaping on top of it would turn a
	// name containing an apostrophe into "Ola&#39;s".
	interpolation: { escapeValue: false },
	returnNull: false,
})

/** M7's settings screen calls this. Nothing else should. */
export function setLanguage(language: Language): Promise<unknown> {
	return i18n.changeLanguage(language)
}

export default i18n
