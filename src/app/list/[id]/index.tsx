import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import Animated, {
	useAnimatedKeyboard,
	useAnimatedStyle,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Icon } from '@/components/Icon'
import { Illustration } from '@/components/Illustration'
import {
	Avatar,
	CheckboxRow,
	Chip,
	EmptyState,
	Screen,
	SectionLabel,
	SwipeRow,
	Text,
} from '@/components/ui'
import { AnimatedPressable } from '@/components/ui/AnimatedPressable'
import {
	addItem,
	allPeople,
	checkItem,
	currentPersonId,
	currentSpaceId,
	frequentItemNames,
	itemsInList,
	listById,
	listItems as listItemsTable,
	membersOfSpace,
	removeItem,
	uncheckItem,
} from '@/db'
import { usePressScale, useTheme } from '@/hooks'
import { joinNames } from '@/lib/eventText'
import { parseItem } from '@/lib/parseItem'
import { plural } from '@/lib/plural'

type Item = typeof listItemsTable.$inferSelect

/**
 * One shopping list. See 07, its dark counterpart 39, and 15 for the empty
 * case.
 *
 * A root-stack route, not a tab screen: 07 has no tab bar — an input bar sits
 * where it would be. "Udostępnij" is not in the header because link sharing is
 * out of the MVP — see docs/PROJECT.md — and a button that does nothing is
 * worse than no button.
 */
export default function ListDetail() {
	const { colors, spacing } = useTheme()

	const { id } = useLocalSearchParams<{ id: string }>()
	const spaceId = currentSpaceId()
	const personId = currentPersonId()

	const insets = useSafeAreaInsets()
	const keyboard = useAnimatedKeyboard()

	/*
	 * Lifting the screen off the keyboard, without KeyboardAvoidingView.
	 *
	 * `behavior='padding'` and `behavior={undefined}` both left the bar behind
	 * the keyboard on Android, measured on API 37: this app draws edge to edge,
	 * so the window no longer resizes itself for the keyboard the way
	 * `adjustResize` used to. Reanimated reports the keyboard's height directly
	 * and works the same on both platforms, so there is one code path instead of
	 * a per-platform guess. The safe-area inset comes off the top because the
	 * keyboard already covers the home indicator.
	 */
	const lift = useAnimatedStyle(() => ({
		paddingBottom: Math.max(0, keyboard.height.value - insets.bottom),
	}))

	const input = useRef<TextInput>(null)
	const [draft, setDraft] = useState('')
	const [typing, setTyping] = useState(false)
	const [suggestions, setSuggestions] = useState<string[]>([])

	const { data: found } = useLiveQuery(listById(id), [id])
	const { data: items } = useLiveQuery(itemsInList(id), [id])
	const { data: persons } = useLiveQuery(allPeople())
	const { data: members } = useLiveQuery(membersOfSpace(spaceId), [spaceId])

	const list = found[0]
	const toBuy = items.filter((item) => !item.checkedAt)
	const done = items
		.filter((item) => item.checkedAt)
		.sort((a, b) => (b.checkedAt ?? '').localeCompare(a.checkedAt ?? ''))

	const person = (id: string | null) => persons.find((row) => row.id === id)
	const who = (id: string | null) =>
		id === personId ? 'Ty' : (person(id)?.name ?? '—')

	const others = members
		.filter((member) => member.personId !== personId)
		.map((member) => person(member.personId)?.name)
		.filter((name): name is string => Boolean(name))

	/*
	 * A snapshot, not a live query: "most used in this Przestrzeń" spans two
	 * tables, and `useLiveQuery` only re-runs on changes to the one table a query
	 * selects from. Nobody needs these to change under their thumb mid-word.
	 */
	useEffect(() => {
		setSuggestions(frequentItemNames(spaceId, id, 4))
	}, [spaceId, id, items.length, typing])

	const add = (text: string) => {
		const parsed = parseItem(text)
		if (!parsed) return

		addItem({ spaceId, listId: id, ...parsed })
		setDraft('')
	}

	if (!list) return <Screen>{null}</Screen>

	return (
		<Animated.View style={[styles.fill, lift]}>
			<Stack.Screen
				options={{
					// 07 puts "Udostępnij" here and 08 puts "Gotowe". The first is not
					// being built, so the slot is free for the second.
					headerRight: typing
						? () => (
								<Pressable
									onPress={() => input.current?.blur()}
									hitSlop={spacing.sm}
								>
									<Text variant='bodyMedium' tone='accent'>
										Gotowe
									</Text>
								</Pressable>
							)
						: undefined,
				}}
			/>

			<Screen
				scroll
				bleed
				surface
				contentStyle={{ paddingBottom: spacing.xl }}
				footer={
					<AddBar
						value={draft}
						onChange={setDraft}
						onSubmit={() => add(draft)}
						onFocus={() => setTyping(true)}
						onBlur={() => setTyping(false)}
						empty={items.length === 0}
						inputRef={input}
					/>
				}
			>
				<View
					style={[
						styles.header,
						{
							padding: spacing.lg,
							gap: spacing.md,
							// 07 parts the title block from the list with a hairline.
							borderBottomWidth: StyleSheet.hairlineWidth,
							borderBottomColor: colors.border,
						},
					]}
				>
					<Text variant='titleLarge' style={styles.grow}>
						{list.title}
					</Text>
					<View style={styles.counter}>
						<Text variant='bodySmall' tone='muted'>
							{items.length === 0
								? `0 ${plural(0, 'pozycja', 'pozycje', 'pozycji')}`
								: `${done.length} z ${items.length}`}
						</Text>
						<Text variant='bodySmall' tone='muted'>
							{items.length === 0
								? `${members.length} ${plural(members.length, 'osoba', 'osoby', 'osób')}`
								: 'odhaczone'}
						</Text>
					</View>
				</View>

				{items.length === 0 ? (
					<EmptyState
						illustration={
							<Illustration name='empty-list' scale={1.4} />
						}
						title='Lista jest jeszcze pusta'
						body={
							others.length > 0
								? `Dopisz pierwszą rzecz albo wklej całą listę z notatki. ${joinNames(others)} zobaczą ją od razu.`
								: 'Dopisz pierwszą rzecz albo wklej całą listę z notatki.'
						}
						footer={
							suggestions.length > 0 ? (
								<View
									style={{
										gap: spacing.md,
										alignItems: 'center',
									}}
								>
									<SectionLabel>CZĘSTE U WAS</SectionLabel>
									<View
										style={[
											styles.chips,
											{ gap: spacing.sm },
										]}
									>
										{suggestions.map((name) => (
											<Chip
												key={name}
												label={`+ ${name}`}
												onPress={() => add(name)}
											/>
										))}
									</View>
								</View>
							) : undefined
						}
					/>
				) : null}

				{toBuy.length > 0 ? (
					<View
						style={{
							paddingHorizontal: spacing.lg,
							paddingTop: spacing.lg,
							paddingBottom: spacing.sm,
						}}
					>
						<SectionLabel>DO KUPIENIA</SectionLabel>
					</View>
				) : null}

				{toBuy.map((item, index) => (
					<SwipeRow
						key={item.id}
						right={{
							onTrigger: () =>
								checkItem({
									spaceId,
									listId: id,
									itemId: item.id,
								}),
							icon: 'check',
							color: colors.success,
						}}
						left={{
							onTrigger: () =>
								removeItem({
									spaceId,
									listId: id,
									itemId: item.id,
								}),
							icon: 'trash',
							color: colors.danger,
						}}
					>
						<CheckboxRow
							title={item.name}
							subtitle={subtitle(item, who(item.createdBy))}
							paddingX={spacing.lg}
							last={index === toBuy.length - 1}
							// A tap is the thing you do a hundred times; the sheet is the
							// thing you do rarely, so it takes the deliberate gesture.
							onToggle={() =>
								checkItem({
									spaceId,
									listId: id,
									itemId: item.id,
								})
							}
							onLongPress={() => router.push(`/item/${item.id}`)}
							right={
								<Avatar
									name={person(item.createdBy)?.name ?? '?'}
									color={
										person(item.createdBy)?.color ??
										colors.textMuted
									}
									size={28}
								/>
							}
						/>
					</SwipeRow>
				))}

				{draft.trim().length > 0 ? (
					<Draft
						text={draft}
						onAdd={() => add(draft)}
						suggestions={suggestions}
						onPick={setDraft}
					/>
				) : null}

				{done.length > 0 ? (
					<View
						style={{
							paddingHorizontal: spacing.lg,
							paddingTop: spacing.lg,
							paddingBottom: spacing.sm,
						}}
					>
						<SectionLabel>{`ODHACZONE · ${done.length}`}</SectionLabel>
					</View>
				) : null}

				{done.map((item, index) => (
					<SwipeRow
						key={item.id}
						// The same drag as on an unchecked row, doing the same thing
						// in reverse: rightwards puts a checked item back.
						right={{
							onTrigger: () =>
								uncheckItem({
									spaceId,
									listId: id,
									itemId: item.id,
								}),
							icon: 'arrow-counterclockwise',
							color: colors.accent,
						}}
						left={{
							onTrigger: () =>
								removeItem({
									spaceId,
									listId: id,
									itemId: item.id,
								}),
							icon: 'trash',
							color: colors.danger,
						}}
					>
						<CheckboxRow
							title={item.name}
							checked
							paddingX={spacing.lg}
							last={index === done.length - 1}
							onToggle={() =>
								uncheckItem({
									spaceId,
									listId: id,
									itemId: item.id,
								})
							}
							onLongPress={() => router.push(`/item/${item.id}`)}
							right={
								<Text variant='bodySmall' tone='muted'>
									{who(item.checkedBy)}
								</Text>
							}
						/>
					</SwipeRow>
				))}
			</Screen>
		</Animated.View>
	)
}

/**
 * The item taking shape, drawn where it will land. See 08, which shows the text
 * exactly as typed — lower case and all — with "dodaj" beside it, then the rule
 * for "x2" and the comma, then the suggestions.
 */
function Draft({
	text,
	onAdd,
	suggestions,
	onPick,
}: {
	text: string
	onAdd: () => void
	suggestions: string[]
	onPick: (name: string) => void
}) {
	const { colors, spacing } = useTheme()

	return (
		<View style={{ backgroundColor: colors.selectedSurface }}>
			<CheckboxRow
				title={text}
				paddingX={spacing.lg}
				last
				onPress={onAdd}
				right={
					<Text variant='bodySmall' tone='accent'>
						dodaj
					</Text>
				}
			/>

			<View style={{ padding: spacing.lg, gap: spacing.md }}>
				<Text variant='bodySmall' tone='muted'>
					„x2" czytamy jako ilość, tekst po przecinku jako dopisek —
					„papier, duża paczka".
				</Text>

				{suggestions.length > 0 ? (
					<View
						style={[
							styles.chips,
							{ gap: spacing.sm, alignItems: 'center' },
						]}
					>
						{suggestions.map((name) => (
							<Chip
								key={name}
								label={name}
								onPress={() => onPick(name)}
							/>
						))}
						<Text variant='bodySmall' tone='muted'>
							częste u Was
						</Text>
					</View>
				) : null}
			</View>
		</View>
	)
}

/**
 * The bar 07 draws where the tab bar would be, and 08 draws again with the
 * keyboard up: a round accent "+" and a placeholder until you touch it, a plain
 * field and a round ↑ once you do.
 *
 * "Wklej listę" belongs on the right of it and arrives with Milestone 6.
 */
function AddBar({
	value,
	onChange,
	onSubmit,
	onFocus,
	onBlur,
	empty,
	inputRef,
}: {
	value: string
	onChange: (text: string) => void
	onSubmit: () => void
	onFocus: () => void
	onBlur: () => void
	empty: boolean
	inputRef: React.RefObject<TextInput | null>
}) {
	const { colors, radius, spacing, typography } = useTheme()
	const press = usePressScale()
	const button = 36
	const ready = value.trim().length > 0

	return (
		<View
			style={[
				styles.bar,
				{
					padding: spacing.md,
					gap: spacing.sm,
					borderTopWidth: StyleSheet.hairlineWidth,
					borderTopColor: colors.border,
					backgroundColor: colors.surface,
				},
			]}
		>
			<View
				style={[
					styles.field,
					{
						backgroundColor: colors.tileFill,
						borderRadius: radius.pill,
						paddingLeft: ready ? spacing.lg : spacing.xs,
						paddingRight: spacing.lg,
						gap: spacing.sm,
					},
				]}
			>
				{ready ? null : (
					<View
						style={[
							styles.plus,
							{
								width: button - 4,
								height: button - 4,
								borderRadius: (button - 4) / 2,
								backgroundColor: colors.accent,
							},
						]}
					>
						<Icon name='plus' size={18} color='#FFFFFF' />
					</View>
				)}

				<TextInput
					ref={inputRef}
					value={value}
					onChangeText={onChange}
					onFocus={onFocus}
					onBlur={onBlur}
					onSubmitEditing={onSubmit}
					// Several items in a row without reaching for the field again.
					submitBehavior='submit'
					returnKeyType='done'
					placeholder={
						empty ? 'Dodaj pierwszą pozycję…' : 'Dodaj pozycję…'
					}
					placeholderTextColor={colors.textMuted}
					style={[
						typography.body,
						styles.input,
						{ color: colors.text },
					]}
				/>
			</View>

			{ready ? (
				<AnimatedPressable
					accessibilityRole='button'
					onPress={onSubmit}
					onPressIn={press.onPressIn}
					onPressOut={press.onPressOut}
					style={[
						styles.plus,
						press.style,
						{
							width: button,
							height: button,
							borderRadius: button / 2,
							backgroundColor: colors.accent,
						},
					]}
				>
					<Icon name='arrow-up' size={20} color='#FFFFFF' />
				</AnimatedPressable>
			) : null}
		</View>
	)
}

/**
 * The grey line under an item's name: "×2 · Kuba", "duża paczka · Nina", "Ty".
 *
 * 07 and 39 order these differently — 39 puts the author first. 07 wins; see
 * the defects table in docs/DESIGN.md.
 */
function subtitle(item: Item, author: string): string {
	return [item.quantity > 1 ? `×${item.quantity}` : null, item.note, author]
		.filter(Boolean)
		.join(' · ')
}

const styles = StyleSheet.create({
	fill: { flex: 1 },
	header: { flexDirection: 'row', alignItems: 'flex-start' },
	counter: { alignItems: 'flex-end' },
	grow: { flex: 1 },
	chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
	bar: { flexDirection: 'row', alignItems: 'center' },
	field: { flex: 1, flexDirection: 'row', alignItems: 'center' },
	input: { flex: 1, paddingVertical: 10 },
	plus: { alignItems: 'center', justifyContent: 'center' },
})
