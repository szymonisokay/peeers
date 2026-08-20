import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Avatar, Chip, SectionLabel, Stepper, Text, TextField } from '@/components/ui'
import {
	allPeople,
	currentPersonId,
	currentSpaceId,
	editItem,
	frequentNotesFor,
	itemById,
	removeItem,
} from '@/db'
import { useTheme } from '@/hooks'
import { whenLong } from '@/lib/time'

/**
 * One item, opened by holding its row on a list — a tap checks it off. See 28.
 *
 * A sheet route rather than a component, the pattern M2 settled: the
 * `formSheet` options live in src/app/_layout.tsx. "Udostępnij", which 28 draws
 * in the header behind the sheet, is not built — link sharing is out of the
 * MVP, see docs/PROJECT.md.
 */
export default function ItemDetail() {
	const { colors, spacing } = useTheme()
	const insets = useSafeAreaInsets()

	const { id } = useLocalSearchParams<{ id: string }>()
	const spaceId = currentSpaceId()
	const personId = currentPersonId()

	const { data: found } = useLiveQuery(itemById(id), [id])
	const { data: persons } = useLiveQuery(allPeople())

	const item = found[0]

	/*
	 * The fields are local state, not the row: 28 has a "Zapisz", so nothing is
	 * written until it is pressed. The row arrives one render later than the
	 * screen — `useLiveQuery` fills in after its effect runs — so the seeding
	 * happens once, when it does.
	 */
	const [name, setName] = useState('')
	const [quantity, setQuantity] = useState(1)
	const [note, setNote] = useState('')
	const [notes, setNotes] = useState<string[]>([])
	/*
	 * Which item the fields were filled from, rather than a "have they been
	 * filled" flag. A route screen is not guaranteed to unmount between two
	 * items — the parameters can change under it — and a flag would then leave
	 * one item's text sitting above another item's id, with "Zapisz" ready to
	 * write the first into the second.
	 */
	const [seededFor, setSeededFor] = useState<string | null>(null)

	useEffect(() => {
		if (!item || item.id === seededFor) return

		setName(item.name)
		setQuantity(item.quantity)
		setNote(item.note ?? '')
		setNotes(frequentNotesFor(spaceId, item.name, 3))
		setSeededFor(item.id)
	}, [item, seededFor, spaceId])

	/*
	 * A soft-deleted row is still a row, and `itemById` has no reason to hide
	 * one — the change history reads deleted items back. This screen does have a
	 * reason: editing something that is no longer on the list would write an
	 * event nobody can see the effect of. M8 makes this reachable for real, when
	 * the deletion arrives from another phone while the sheet is open.
	 */
	useEffect(() => {
		if (item?.deletedAt) router.back()
	}, [item?.deletedAt])

	if (!item || item.deletedAt) return <View style={{ backgroundColor: colors.surface }} />

	const author = persons.find((person) => person.id === item.createdBy)
	const trimmed = name.trim()
	const nextNote = note.trim().length > 0 ? note.trim() : null
	const changed = trimmed !== item.name || quantity !== item.quantity || nextNote !== item.note
	const canSave = changed && trimmed.length > 0

	const save = () => {
		if (!canSave) return

		editItem({
			spaceId,
			listId: item.listId,
			itemId: item.id,
			name: trimmed,
			quantity,
			note: nextNote,
		})
		router.back()
	}

	const remove = () => {
		Alert.alert(`Usunąć „${item.name}"?`, 'Pozycję można przywrócić w historii zmian.', [
			{ text: 'Anuluj', style: 'cancel' },
			{
				text: 'Usuń',
				style: 'destructive',
				onPress: () => {
					removeItem({ spaceId, listId: item.listId, itemId: item.id })
					router.back()
				},
			},
		])
	}

	return (
		<View
			style={{
				backgroundColor: colors.surface,
				paddingHorizontal: spacing.lg,
				paddingTop: spacing.xl,
				// Android draws its navigation bar over the sheet; iOS insets the
				// whole sheet already, so this only ever adds where it is needed.
				paddingBottom: Math.max(spacing.lg, insets.bottom),
				gap: spacing.lg,
			}}
		>
			<View style={styles.row}>
				<SectionLabel>POZYCJA</SectionLabel>
				<Pressable onPress={save} disabled={!canSave} hitSlop={spacing.sm} style={styles.right}>
					<Text variant='bodyMedium' tone='accent' style={{ opacity: canSave ? 1 : 0.4 }}>
						Zapisz
					</Text>
				</Pressable>
			</View>

			<View style={{ gap: spacing.xs }}>
				<SectionLabel>NAZWA</SectionLabel>
				<TextField
					value={name}
					onChangeText={setName}
					variant='underline'
					textVariant='title'
					onSubmitEditing={save}
				/>
			</View>

			<View style={[styles.row, { gap: spacing.lg, alignItems: 'flex-start' }]}>
				<View style={{ gap: spacing.xs }}>
					<SectionLabel>ILOŚĆ</SectionLabel>
					<Stepper value={quantity} onChange={setQuantity} />
				</View>

				<View style={[styles.grow, { gap: spacing.xs }]}>
					<SectionLabel>DOPISEK</SectionLabel>
					<TextField value={note} onChangeText={setNote} onSubmitEditing={save} />
				</View>
			</View>

			{notes.length > 0 ? (
				<View style={[styles.chips, { gap: spacing.sm }]}>
					{notes.map((suggestion) => (
						<Chip key={suggestion} label={suggestion} onPress={() => setNote(suggestion)} />
					))}
				</View>
			) : null}

			<Text variant='bodySmall' tone='muted'>
				Dopisek widzą wszyscy na liście — dobre miejsce na markę, rozmiar albo „ten w zielonym
				pudełku".
			</Text>

			<View
				style={[
					styles.row,
					{
						gap: spacing.md,
						paddingTop: spacing.lg,
						borderTopWidth: StyleSheet.hairlineWidth,
						borderTopColor: colors.border,
					},
				]}
			>
				<Avatar
					name={author?.name ?? '?'}
					color={author?.color ?? colors.textMuted}
					size={28}
				/>
				<Text variant='bodySmall' tone='muted' style={styles.grow} numberOfLines={1}>
					{`Dodał(-a) ${item.createdBy === personId ? 'Ty' : (author?.name ?? '—')} · ${whenLong(item.createdAt)}`}
				</Text>
				<Pressable onPress={remove} hitSlop={spacing.sm}>
					<Text variant='bodyMedium' tone='danger'>
						Usuń
					</Text>
				</Pressable>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	row: { flexDirection: 'row', alignItems: 'center' },
	right: { marginLeft: 'auto' },
	grow: { flex: 1 },
	chips: { flexDirection: 'row', flexWrap: 'wrap' },
})
