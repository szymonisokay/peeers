import { router } from 'expo-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button, SectionLabel, TextField } from '@/components/ui'
import { useTheme } from '@/hooks'

type TitleSheetProps = {
	/** The uppercase heading above the field: "NOWA LISTA", "ZMIEŃ NAZWĘ". */
	label: string
	submitLabel: string
	placeholder?: string
	initialValue?: string
	/** Given the trimmed title. Never called with an empty one. */
	onSubmit: (title: string) => void
}

/**
 * One field, one heading, one primary action — the sheet D-Q3 in the M4 exec
 * plan settles on for naming a list, and the same shape for renaming one. See
 * src/app/new-list.tsx and src/app/list/[id]/rename.tsx.
 *
 * Not in `components/ui/`: that directory holds the design system, and this is
 * a composition of three of its primitives for one product decision. It sits
 * beside `TabBar`, which is app-specific for the same reason. Not in `src/app/`
 * either, where every file is a route.
 *
 * The field is seeded once, from `initialValue`, so a caller reading its value
 * from the database must not render this until the row has arrived — otherwise
 * the sheet mounts empty and stays that way.
 */
export function TitleSheet({
	label,
	submitLabel,
	placeholder,
	initialValue = '',
	onSubmit,
}: TitleSheetProps) {
	const { colors, spacing } = useTheme()
	const { t } = useTranslation()
	const insets = useSafeAreaInsets()

	const [title, setTitle] = useState(initialValue)
	const trimmed = title.trim()

	const submit = () => {
		if (trimmed.length === 0) return
		onSubmit(trimmed)
	}

	return (
		/*
		 * Same frame as the "Co tworzymy" sheet of 05: a sheet sits on the surface
		 * colour.
		 *
		 * The bottom inset is Android's alone. There the navigation bar is drawn
		 * over the sheet and the content has to clear it. iOS already lifts the
		 * whole sheet 8 pt off the screen edge, and `insets.bottom` still reports
		 * the home indicator's 34 pt inside it — measured on iPhone 17 — so
		 * taking the larger of the two would pad the sheet twice over.
		 */
		<View
			style={{
				backgroundColor: colors.surface,
				paddingHorizontal: spacing.lg,
				paddingTop: spacing.xl,
				paddingBottom:
					Platform.OS === 'android' ? Math.max(spacing.lg, insets.bottom) : spacing.lg,
				gap: spacing.md,
			}}
		>
			<SectionLabel>{label}</SectionLabel>

			<TextField
				value={title}
				onChangeText={setTitle}
				placeholder={placeholder}
				variant='underline'
				textVariant='title'
				autoFocus
				onSubmitEditing={submit}
			/>

			<Button label={submitLabel} onPress={submit} disabled={trimmed.length === 0} />
			<Button label={t('app.cancel')} variant='plain' onPress={() => router.back()} />
		</View>
	)
}
