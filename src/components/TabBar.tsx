import { router } from 'expo-router'
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs/types'
import { Platform, Pressable, StyleSheet, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Icon, type IconName } from '@/components/Icon'
import { Text } from '@/components/ui'
import { usePressScale, useTheme } from '@/hooks'
import { tabBar as geometry } from '@/theme'

const ICON_FOR_ROUTE: Record<string, IconName> = {
	index: 'home',
	lists: 'basket',
	notes: 'note',
	profile: 'person',
}

/** Where the raised button sits: after Zakupy, before Notatki. See 13. */
const BUTTON_AFTER_INDEX = 1

/**
 * The five-slot bar from 13.
 *
 * The middle slot is a button, not a tab — it opens the "Co tworzymy" sheet.
 * A tab screen cannot be presented as a sheet, so the sheet is a root-stack
 * route and this button pushes to it.
 */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
	const { colors, shadow, spacing } = useTheme()
	const insets = useSafeAreaInsets()
	const press = usePressScale()

	/*
	 * 13 is an iOS mockup, where the home-indicator inset gives the bar its
	 * lower breathing room and the raised button's shadow somewhere to fall.
	 * Android differs twice over: the inset reads 0 wherever the system already
	 * inset the window, and where it does not, the navigation bar's contrast
	 * scrim paints over that region and erases the shadow. So floor the inset so
	 * the bar never sits flush, then on Android lift the content clear of the
	 * scrim — measured: the shadow reaches 26 dp below the button, and without
	 * this it had 2 dp before the scrim swallowed it.
	 */
	const bottomInset =
		Math.max(insets.bottom, spacing.sm) +
		(Platform.OS === 'android' ? spacing.lg : 0)

	const tabs = state.routes.map((route, index) => {
		const { options } = descriptors[route.key]
		const focused = state.index === index

		return (
			<Pressable
				key={route.key}
				accessibilityRole='tab'
				accessibilityState={{ selected: focused }}
				style={styles.slot}
				onPress={() => {
					const event = navigation.emit({
						type: 'tabPress',
						target: route.key,
						canPreventDefault: true,
					})
					if (!focused && !event.defaultPrevented)
						navigation.navigate(route.name)
				}}
			>
				<Icon
					name={ICON_FOR_ROUTE[route.name] ?? 'home'}
					size={24}
					color={focused ? colors.accent : colors.textMuted}
				/>
				<Text
					variant='bodySmall'
					tone={focused ? 'accent' : 'muted'}
					style={styles.label}
				>
					{options.title ?? route.name}
				</Text>
			</Pressable>
		)
	})

	const addButton = (
		<View key='add' style={[styles.slot, { height: geometry.height }]}>
			<Animated.View
				style={[
					styles.lift,
					press.style,
					{ bottom: geometry.buttonLift },
				]}
			>
				<Pressable
					accessibilityRole='button'
					accessibilityLabel='Utwórz'
					onPress={() => router.push('/new')}
					onPressIn={press.onPressIn}
					onPressOut={press.onPressOut}
					style={[
						styles.addButton,
						{
							width: geometry.buttonSize,
							height: geometry.buttonSize,
							borderRadius: geometry.buttonSize / 2,
							backgroundColor: colors.accent,
							boxShadow: shadow.raisedButton,
						},
					]}
				>
					<Icon name='plus' size={26} color='#FFFFFF' />
				</Pressable>
			</Animated.View>
		</View>
	)

	return (
		<View
			style={[
				styles.bar,
				{
					backgroundColor: colors.surface,
					borderTopColor: colors.border,
					paddingBottom: bottomInset,
					paddingTop: spacing.sm,
					height: geometry.height + bottomInset,
				},
			]}
		>
			{[
				...tabs.slice(0, BUTTON_AFTER_INDEX + 1),
				addButton,
				...tabs.slice(BUTTON_AFTER_INDEX + 1),
			]}
		</View>
	)
}

const styles = StyleSheet.create({
	bar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth },
	slot: { flex: 1, alignItems: 'center', justifyContent: 'flex-start' },
	label: { fontSize: 11 },
	lift: { position: 'absolute' },
	addButton: {
		alignItems: 'center',
		justifyContent: 'center',
	},
})
