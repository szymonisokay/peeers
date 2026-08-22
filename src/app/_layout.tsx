import {
	PublicSans_400Regular,
	PublicSans_500Medium,
	PublicSans_600SemiBold,
	PublicSans_700Bold,
	useFonts,
} from '@expo-google-fonts/public-sans'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useTranslation } from 'react-i18next'
import { Platform, StyleSheet } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import { useDatabase, useTheme } from '@/hooks'
// Side-effect import: resolves the language and initialises i18next. It has to
// happen before any module calls `t`, and this is the first module expo-router
// evaluates.
import '@/i18n'

export default function RootLayout() {
	const { scheme, colors, radius } = useTheme()
	const { t } = useTranslation()
	const [fontsLoaded] = useFonts({
		PublicSans_400Regular,
		PublicSans_500Medium,
		PublicSans_600SemiBold,
		PublicSans_700Bold,
	})

	const { ready: dbReady, error: dbError } = useDatabase()

	/*
	 * Nothing renders until the database has migrated: a query against a table
	 * that does not exist yet throws, and on a fresh install none of them do.
	 * A failed migration shows nothing on purpose — there is no mockup for a
	 * broken database, and a development build already reports the error.
	 */
	if (dbError) {
		console.error('[db] migrations failed', dbError)
		return null
	}
	if (!fontsLoaded || !dbReady) return null

	return (
		/*
		 * Gestures need this at the root or they never receive touches on
		 * Android. Nothing in the app used one until the list rows could be
		 * dragged sideways.
		 */
		<GestureHandlerRootView style={styles.fill}>
			<StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
			<Stack
				screenOptions={{
					headerShown: false,
					contentStyle: { backgroundColor: colors.background },
					/*
					 * Without these the navigator uses React Navigation's own light
					 * theme, so the header of a pushed screen stays white in the dark
					 * theme while everything under it goes dark. 07 and 39 draw the
					 * header and the screen as one surface, with no divider between.
					 */
					headerStyle: { backgroundColor: colors.surface },
					headerTintColor: colors.accent,
					headerShadowVisible: false,
				}}
			>
				<Stack.Screen name='(tabs)' />

				{/*
          Detail screens push over the tab shell and hide the bar — 07 has an
          input bar where the tab bar would be.
        */}
				<Stack.Screen
					name='list/[id]/index'
					options={{
						headerShown: true,
						headerTitle: '',
						// The back title is the Przestrzeń this list belongs to, so
						// the screen itself sets it — see src/app/list/[id]/index.tsx.
					}}
				/>
				<Stack.Screen
					name='note/[id]'
					options={{
						headerShown: true,
						headerTitle: '',
						headerBackTitle: t('tabs.notes'),
					}}
				/>

				{/*
          The item sheet of 28, opened by holding a row on a list. Same
          arrangement as `new` below: `fitToContents` measures correctly on
          iOS and comes back as 0 on Android, so Android gets a fraction.
          28's own proportion is 388 pt of the 874 pt screen — 0.44 — but a
          fixed fraction has to hold the tallest version of this sheet, and
          measured on API 37 that one clipped its footer: Android's text runs
          taller, the note chips add a row, and the navigation bar takes a
          slice off the bottom. 0.56 clears all three.
        */}
				<Stack.Screen
					name='item/[id]'
					options={{
						presentation: 'formSheet',
						sheetAllowedDetents:
							Platform.OS === 'android' ? [0.56] : 'fitToContents',
						sheetGrabberVisible: true,
						sheetCornerRadius:
							Platform.OS === 'android' ? radius.xl : undefined,
						contentStyle: { backgroundColor: colors.surface },
					}}
				/>

				{/*
          "Wklej listę" of 19 — a full modal rather than a sheet, because it
          carries a header with three actions and a block of text that can be
          six lines or twenty. `headerShown` is on for that header; the rest of
          the app's pushed screens draw their own.
        */}
				<Stack.Screen
					name='list/[id]/paste'
					options={{ presentation: 'modal', headerShown: true }}
				/>

				{/*
          The three sheets of Milestone 5: naming a new list, renaming one, and
          the "..." menu behind the list header. All three follow the same
          arrangement as the item sheet above — `fitToContents` measures on iOS
          and comes back 0 on Android, so Android gets a fraction.

          The two naming sheets open with the keyboard up, which Android does
          not lift a `formSheet` for, so their detent has to hold the sheet
          clear of it rather than merely fit the content.
        */}
				<Stack.Screen
					name='new-list'
					options={{
						presentation: 'formSheet',
						sheetAllowedDetents:
							Platform.OS === 'android' ? [0.42] : 'fitToContents',
						sheetGrabberVisible: true,
						sheetCornerRadius:
							Platform.OS === 'android' ? radius.xl : undefined,
						contentStyle: { backgroundColor: colors.surface },
					}}
				/>
				<Stack.Screen
					name='list/[id]/rename'
					options={{
						presentation: 'formSheet',
						sheetAllowedDetents:
							Platform.OS === 'android' ? [0.42] : 'fitToContents',
						sheetGrabberVisible: true,
						sheetCornerRadius:
							Platform.OS === 'android' ? radius.xl : undefined,
						contentStyle: { backgroundColor: colors.surface },
					}}
				/>
				<Stack.Screen
					name='list/[id]/menu'
					options={{
						presentation: 'formSheet',
						sheetAllowedDetents:
							Platform.OS === 'android' ? [0.52] : 'fitToContents',
						sheetGrabberVisible: true,
						sheetCornerRadius:
							Platform.OS === 'android' ? radius.xl : undefined,
						contentStyle: { backgroundColor: colors.surface },
					}}
				/>

				{/*
          A tab screen cannot be a sheet — `presentation` is a native-stack
          option — so the "Co tworzymy" sheet lives here and the raised + in the
          tab bar pushes to it. `sheetGrabberVisible` is iOS-only by design.
        */}
				<Stack.Screen
					name='new'
					options={{
						presentation: 'formSheet',
						/*
						 * `fitToContents` derives the sheet height from the laid-out
						 * content wrapper. On Android that measurement comes back as 0
						 * and the sheet collapses to a bare strip of the dialog's own
						 * background — no content, and no dimming either, since Android
						 * fades the dimming view in proportion to how far the sheet has
						 * opened. A fraction detent skips that measurement path: 0.36 is
						 * the sheet's 309 pt in 05 over the 874 pt screen, rounded up so
						 * Android's taller text metrics cannot clip "Anuluj".
						 */
						sheetAllowedDetents:
							Platform.OS === 'android'
								? [0.36]
								: 'fitToContents',
						sheetGrabberVisible: true,
						/*
						 * Measured from 05: 22 pt. Without it Android draws square
						 * corners, because the content wrapper fills the sheet and
						 * paints over whatever rounding the dialog had.
						 */
						sheetCornerRadius:
							Platform.OS === 'android' ? radius.xl : undefined,
						contentStyle: {
							backgroundColor: colors.surface,
						},
					}}
				/>
			</Stack>
		</GestureHandlerRootView>
	)
}

const styles = StyleSheet.create({ fill: { flex: 1 } })
