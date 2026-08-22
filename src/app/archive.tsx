import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { router, Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Alert, Pressable, StyleSheet, View } from 'react-native'

import { Icon } from '@/components/Icon'
import { ListRow, Screen, SectionLabel, Text } from '@/components/ui'
import {
	currentSpaceId,
	deleteList,
	itemCountsByList,
	lists as listsTable,
	listsInSpace,
	spaceById,
} from '@/db'
import { useTheme } from '@/hooks'
import { dayMonth, monthHeading } from '@/lib/time'

type ListRecord = typeof listsTable.$inferSelect

/**
 * Every list that has been put away. See 41.
 *
 * A list arrives here two ways and the row says which: it closed itself once
 * everything on it was checked off, or somebody hid it by hand while it still
 * had things to buy. `archived_reason` is that distinction, recorded since M3
 * for exactly this screen.
 *
 * Nothing here is a dead end. The three dots reopen a list, copy its items onto
 * a new one, or delete it for good; and `frequentItemNames` in src/db/queries.ts
 * reads archived lists too, so an archive that has been building up makes the
 * quick-add suggestions better rather than just taking up room. 41 says so in
 * its own info strip, which is why that strip is rendered.
 */
export default function Archive() {
	const { t } = useTranslation()
	const { colors, radius, spacing } = useTheme()
	const spaceId = currentSpaceId()

	const { data: space } = useLiveQuery(spaceById(spaceId), [spaceId])
	const { data: rows } = useLiveQuery(listsInSpace(spaceId), [spaceId])
	const { data: counts } = useLiveQuery(itemCountsByList())

	// Newest first, by when it was archived rather than when it was touched:
	// this screen is a record of closings, not of activity.
	const archived = rows
		.filter((row): row is ListRecord & { archivedAt: string } => Boolean(row.archivedAt))
		.sort((a, b) => b.archivedAt.localeCompare(a.archivedAt))

	const subtitle = (list: ListRecord & { archivedAt: string }) => {
		const count = counts.find((row) => row.listId === list.id)
		const date = dayMonth(list.archivedAt)

		if (list.archivedReason === 'manual') {
			return t('archive.hidden', {
				progress: t('app.progress', {
					checked: count?.checked ?? 0,
					total: count?.total ?? 0,
				}),
				date,
			})
		}

		return t('archive.closed', {
			items: t('list.itemCount', { count: count?.total ?? 0 }),
			date,
		})
	}

	const clear = () => {
		if (archived.length === 0) return

		Alert.alert(
			t('archive.clearTitle', { lists: t('archive.listCount', { count: archived.length }) }),
			t('archive.clearBody'),
			[
				{ text: t('app.cancel'), style: 'cancel' },
				{
					text: t('menu.deleteForever'),
					style: 'destructive',
					onPress: () => archived.forEach((list) => deleteList({ spaceId, listId: list.id })),
				},
			],
		)
	}

	return (
		<Screen scroll bleed surface contentStyle={{ paddingBottom: spacing.xl }}>
			<Stack.Screen
				options={{
					headerBackTitle: t('lists.title'),
					headerRight: () => (
						<Pressable onPress={clear} disabled={archived.length === 0} hitSlop={spacing.sm}>
							<Text
								variant='bodyMedium'
								tone='accent'
								style={{ opacity: archived.length === 0 ? 0.4 : 1 }}
							>
								{t('archive.clear')}
							</Text>
						</Pressable>
					),
				}}
			/>

			{/* 41 sets the count and the Przestrzeń's name against the title. */}
			<View style={[styles.header, { padding: spacing.lg, gap: spacing.md }]}>
				<Text variant='titleLarge' style={styles.grow}>
					{t('archive.title')}
				</Text>
				<View style={styles.right}>
					<Text variant='bodySmall' tone='muted'>
						{t('archive.listCount', { count: archived.length })}
					</Text>
					<Text variant='bodySmall' tone='muted'>
						{space[0]?.name ?? ''}
					</Text>
				</View>
			</View>

			{archived.length === 0 ? (
				<View style={{ paddingHorizontal: spacing.lg }}>
					<Text variant='bodySmall' tone='muted'>
						{t('archive.empty')}
					</Text>
				</View>
			) : null}

			{archived.map((list, index) => {
				const month = monthHeading(list.archivedAt)
				const opensMonth =
					index === 0 || monthHeading(archived[index - 1].archivedAt) !== month
				const closed = list.archivedReason !== 'manual'

				return (
					<View key={list.id}>
						{opensMonth ? (
							<View
								style={{
									backgroundColor: colors.background,
									paddingHorizontal: spacing.lg,
									paddingVertical: spacing.sm,
									borderTopWidth: StyleSheet.hairlineWidth,
									borderBottomWidth: StyleSheet.hairlineWidth,
									borderColor: colors.border,
								}}
							>
								<SectionLabel>{month}</SectionLabel>
							</View>
						) : null}

						<View style={{ paddingHorizontal: spacing.lg }}>
							<ListRow
								title={list.title}
								subtitle={subtitle(list)}
								onPress={() => router.push(`/list/${list.id}`)}
								left={
									// 41 marks the two ways in: a green check for a list
									// that finished itself, a grey minus for one put away
									// with things still on it.
									<Icon
										name={closed ? 'check' : 'minus-circle'}
										size={20}
										color={closed ? colors.success : colors.textMuted}
									/>
								}
								right={
									<Pressable
										onPress={() => router.push(`/list/${list.id}/menu`)}
										hitSlop={spacing.sm}
									>
										<Icon name='more' size={20} color={colors.accent} />
									</Pressable>
								}
							/>
						</View>
					</View>
				)
			})}

			{archived.length > 0 ? (
				<View
					style={[
						styles.info,
						{
							backgroundColor: colors.tileFill,
							borderRadius: radius.md,
							margin: spacing.lg,
							padding: spacing.md,
							gap: spacing.md,
						},
					]}
				>
					<Icon name='info' size={20} color={colors.accent} />
					<Text variant='bodySmall' tone='muted' style={styles.grow}>
						{t('archive.info')}
					</Text>
				</View>
			) : null}
		</Screen>
	)
}

const styles = StyleSheet.create({
	header: { flexDirection: 'row', alignItems: 'flex-start' },
	right: { alignItems: 'flex-end' },
	grow: { flex: 1 },
	info: { flexDirection: 'row', alignItems: 'flex-start' },
})
