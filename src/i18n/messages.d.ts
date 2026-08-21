/**
 * Teaches TypeScript the shape of the message files, so `t('tabs.lists')` is
 * checked at compile time and a typo fails `npx tsc --noEmit` — the only
 * automated gate this repo has.
 *
 * English is the source because it is the fallback language: a key that exists
 * only in Polish would otherwise type-check and then render in English on an
 * English phone. The opposite gap, a key Polish is missing, is caught by the
 * assignment in ./index.ts.
 */
import type en from '@/messages/en.json'

declare module 'i18next' {
	interface CustomTypeOptions {
		defaultNS: 'translation'
		resources: { translation: typeof en }
	}
}
