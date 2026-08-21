import { router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

import { Icon, type IconName } from '@/components/Icon'
import { Button, SectionLabel, Text } from '@/components/ui'
import { AnimatedPressable } from '@/components/ui/AnimatedPressable'
import { usePressScale, useTheme } from '@/hooks'

/**
 * "Co tworzymy" — the sheet behind the raised +. See 05.
 *
 * Targets are stubs: M4 and M5 wire them to real creation flows.
 *
 * The array holds keys rather than words because it is evaluated once, at
 * module scope, where there is no component to call `useTranslation()` in — and
 * a sentence resolved at import time would keep the language the app started
 * with. `OptionCard` translates as it renders.
 */
const OPTIONS = [
	{
		icon: 'checklist' as IconName,
		titleKey: 'new.listTitle',
		subtitleKey: 'new.listSubtitle',
		highlighted: true,
	},
	{
		icon: 'note' as IconName,
		titleKey: 'new.noteTitle',
		subtitleKey: 'new.noteSubtitle',
		highlighted: false,
	},
] as const

export default function New() {
	const { colors, spacing } = useTheme()
	const { t } = useTranslation()

	return (
		// Not `Screen`: a sheet sits on the surface colour, and 05 shows the sheet
		// background and the neutral card as the same white, parted by a hairline.
		<View
			style={{
				backgroundColor: colors.surface,
				paddingHorizontal: spacing.lg,
				paddingTop: spacing.xxxl,
				gap: spacing.md,
				paddingBottom: spacing.lg,
			}}
		>
			<SectionLabel>{t('new.heading')}</SectionLabel>

			<View style={{ gap: spacing.sm }}>
				{OPTIONS.map((option) => (
					<OptionCard
						key={option.titleKey}
						{...option}
						onPress={() => router.back()}
					/>
				))}
			</View>

			<Button
				label={t('app.cancel')}
				variant='plain'
				onPress={() => router.back()}
			/>
		</View>
	)
}

type OptionCardProps = {
	icon: IconName
	titleKey: (typeof OPTIONS)[number]['titleKey']
	subtitleKey: (typeof OPTIONS)[number]['subtitleKey']
	/** The first option is tinted in 05, drawing the eye to the common choice. */
	highlighted: boolean
	onPress: () => void
}

function OptionCard({
	icon,
	titleKey,
	subtitleKey,
	highlighted,
	onPress,
}: OptionCardProps) {
	const { colors, radius, spacing } = useTheme()
	const { t } = useTranslation()
	const press = usePressScale()
	const tile = 38

	return (
		<AnimatedPressable
			accessibilityRole='button'
			onPress={onPress}
			onPressIn={press.onPressIn}
			onPressOut={press.onPressOut}
			style={[
				styles.card,
				press.style,
				{
					backgroundColor: highlighted
						? colors.selectedSurface
						: colors.surface,
					borderColor: highlighted
						? colors.selectedBorder
						: colors.border,
					borderRadius: radius.lg,
					padding: spacing.md,
				},
			]}
		>
			<View
				style={[
					styles.tile,
					{
						width: tile,
						height: tile,
						borderRadius: radius.md,
						marginRight: spacing.md,
						backgroundColor: highlighted
							? colors.accent
							: colors.tileFill,
					},
				]}
			>
				<Icon
					name={icon}
					size={22}
					color={highlighted ? '#FFFFFF' : colors.text}
				/>
			</View>

			<View style={styles.grow}>
				<Text variant='bodyMedium'>{t(titleKey)}</Text>
				<Text variant='caption' tone='muted'>
					{t(subtitleKey)}
				</Text>
			</View>

			{/* Tight against the text: 05 leaves the subtitle a full single line. */}
			<Icon name='chevron-right' size={18} color={colors.textMuted} />
		</AnimatedPressable>
	)
}

const styles = StyleSheet.create({
	card: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: StyleSheet.hairlineWidth,
	},
	tile: { alignItems: 'center', justifyContent: 'center' },
	grow: { flex: 1 },
})
