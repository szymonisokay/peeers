import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'

import { Button, CheckboxRow, Screen, SectionLabel, Text } from '@/components/ui'
import { addItems, currentSpaceId } from '@/db'
import { useTheme } from '@/hooks'
import { parseItem } from '@/lib/parseItem'

/** How many parsed rows 19 lists before it stops and counts the rest. */
const SHOWN = 4

/**
 * Turning a block of text into items. See 19.
 *
 * The screen does not read the clipboard. It opens with an empty, focused
 * field and the person pastes into it with the system menu — which needs no
 * native module, no rebuild, and no "Allow Paste?" prompt on iOS 16 and later.
 * The field stays editable afterwards, so a bad paste is fixed in place rather
 * than started again.
 *
 * Parsing is `parseItem` from Milestone 3, the same rules the quick-add bar
 * uses, applied to every non-blank line. The rules are printed on the screen
 * because 19 prints them.
 */
export default function Paste() {
	const { t } = useTranslation()
	const { colors, fontFamily, radius, spacing, typography } = useTheme()
	const { id } = useLocalSearchParams<{ id: string }>()
	const spaceId = currentSpaceId()

	const [text, setText] = useState('')
	/*
	 * Which lines are staying out, by their line number in the text rather than
	 * their position among the parsed rows.
	 *
	 * The line number is what survives editing. Fixing a typo on line 2 leaves
	 * line 5 alone, and leaves line 2's own tick alone as well, which is the
	 * whole point: an earlier version keyed this by position and cleared it on
	 * every keystroke, so one character undid all the unticking. The remaining
	 * gap is inserting a line in the middle, which shifts the numbering below it
	 * — rare next to fixing a word, and cheaper than tracking identity through
	 * arbitrary edits.
	 */
	const [dropped, setDropped] = useState<number[]>([])
	/*
	 * 19 draws four rows and counts the rest, which is right for reading and
	 * wrong for choosing: everything past the fourth would go in with no way to
	 * say otherwise. The count opens the rest instead of only reporting it, and
	 * stays open through edits — collapsing the list under someone fixing a typo
	 * would be the same rudeness as clearing their ticks.
	 */
	const [expanded, setExpanded] = useState(false)

	/*
	 * Each parsed row remembers which line of the text it came from. Blank and
	 * unparseable lines drop out here, so the numbering has gaps — that is fine,
	 * because nothing counts on it being dense, only on it being stable.
	 */
	const parsed = text.split('\n').flatMap((raw, line) => {
		const item = parseItem(raw)
		return item ? [{ line, item }] : []
	})

	const chosen = parsed.filter((row) => !dropped.includes(row.line)).map((row) => row.item)
	const noneChosen = chosen.length === 0

	const toggle = (line: number) =>
		setDropped((current) =>
			current.includes(line) ? current.filter((n) => n !== line) : [...current, line],
		)

	const add = () => {
		if (noneChosen) return

		addItems({ spaceId, listId: id, items: chosen })
		router.back()
	}

	return (
		<>
			<Stack.Screen
				options={{
					title: t('paste.title'),
					// 19 centres the title between "Anuluj" and "Dodaj". iOS does that
					// on its own; Android's native header left-aligns, which parks the
					// title against "Anuluj" with no gap between them.
					headerTitleAlign: 'center',
					headerLeft: () => (
						<Pressable onPress={() => router.back()} hitSlop={spacing.sm}>
							<Text variant='bodyMedium' tone='accent'>
								{t('app.cancel')}
							</Text>
						</Pressable>
					),
					headerRight: () => (
						<Pressable onPress={add} disabled={noneChosen} hitSlop={spacing.sm}>
							<Text
								variant='bodyMedium'
								tone='accent'
								style={{ opacity: noneChosen ? 0.4 : 1 }}
							>
								{t('paste.add')}
							</Text>
						</Pressable>
					),
				}}
			/>

			<Screen
				scroll
				surface
				contentStyle={{ padding: spacing.lg, gap: spacing.lg }}
				footer={
					<View
						style={{
							padding: spacing.lg,
							borderTopWidth: StyleSheet.hairlineWidth,
							borderTopColor: colors.border,
							backgroundColor: colors.surface,
						}}
					>
						<Button
							label={t('paste.submit', { count: chosen.length })}
							onPress={add}
							disabled={noneChosen}
						/>
					</View>
				}
			>
				<View style={{ gap: spacing.xs }}>
					<SectionLabel>{t('paste.pastedLabel')}</SectionLabel>
					{/*
					 * A field of its own rather than `TextField`, for the monospace —
					 * see D-Q4. `AddBar` on the list screen does the same for the same
					 * reason: one screen's field, styled from tokens, is better than a
					 * prop on the primitive that only one caller would ever pass.
					 *
					 * The height holds the six lines 19 draws, derived from the type
					 * scale rather than measured off the drawing.
					 */}
					<TextInput
						value={text}
						onChangeText={setText}
						placeholder={t('paste.placeholder')}
						placeholderTextColor={colors.textMuted}
						multiline
						autoFocus
						textAlignVertical='top'
						style={[
							typography.body,
							{
								fontFamily: fontFamily.mono,
								color: colors.text,
								backgroundColor: colors.tileFill,
								borderRadius: radius.md,
								padding: spacing.md,
								minHeight: typography.body.lineHeight * 6 + spacing.md * 2,
							},
						]}
					/>
				</View>

				{parsed.length > 0 ? (
					<View>
						<SectionLabel
							right={
								<Pressable
									onPress={() =>
										setDropped(
											noneChosen ? [] : parsed.map((row) => row.line),
										)
									}
									hitSlop={spacing.sm}
								>
									<Text variant='bodySmall' tone='accent'>
										{noneChosen ? t('paste.selectAll') : t('paste.deselectAll')}
									</Text>
								</Pressable>
							}
						>
							{t('paste.recognised', { count: parsed.length })}
						</SectionLabel>

						{(expanded ? parsed : parsed.slice(0, SHOWN)).map(({ line, item }, index) => (
							<CheckboxRow
								// The line it came from, not its name: a name changes with
								// every keystroke, and a changed key remounts the row, which
								// replays its entrance and blinks the checkbox.
								key={line}
								title={item.name}
								subtitle={item.note ?? undefined}
								variant='select'
								checked={!dropped.includes(line)}
								onToggle={() => toggle(line)}
								last={
									index ===
									(expanded ? parsed.length : Math.min(parsed.length, SHOWN)) - 1
								}
								right={
									item.quantity > 1 ? (
										<View
											style={{
												backgroundColor: colors.selectedSurface,
												borderRadius: radius.sm,
												paddingHorizontal: spacing.sm,
												paddingVertical: 2,
											}}
										>
											<Text variant='bodySmall' tone='muted'>
												{`×${item.quantity}`}
											</Text>
										</View>
									) : null
								}
							/>
						))}

						{parsed.length > SHOWN && !expanded ? (
							/*
							 * Accent rather than the muted grey 19 draws. The drawing
							 * has this line doing nothing, and a line that opens the
							 * rest of the list has to say so — accent is how every
							 * other tappable label in this app reads.
							 */
							<Pressable
								onPress={() => setExpanded(true)}
								hitSlop={spacing.sm}
								style={{ paddingTop: spacing.md }}
							>
								<Text variant='bodySmall' tone='accent'>
									{t('paste.more', { count: parsed.length - SHOWN })}
								</Text>
							</Pressable>
						) : null}
					</View>
				) : null}

				<Text variant='bodySmall' tone='muted'>
					{t('paste.hint')}
				</Text>
			</Screen>
		</>
	)
}
