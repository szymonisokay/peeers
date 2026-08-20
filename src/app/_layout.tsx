import {
	PublicSans_400Regular,
	PublicSans_500Medium,
	PublicSans_600SemiBold,
	PublicSans_700Bold,
	useFonts,
} from '@expo-google-fonts/public-sans'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Platform } from 'react-native'

import { useDatabase, useTheme } from '@/hooks'

export default function RootLayout() {
	const { scheme, colors, radius } = useTheme()
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
		<>
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
						headerBackTitle: 'Mieszkanie 14',
					}}
				/>
				<Stack.Screen
					name='note/[id]'
					options={{
						headerShown: true,
						headerTitle: '',
						headerBackTitle: 'Notatki',
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
		</>
	)
}
