import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { router, useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Alert, Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Icon, type IconName } from '@/components/Icon'
import { Button, ListRow, SectionLabel } from '@/components/ui'
import { archiveList, deleteList, listById, pinList, unpinList } from '@/db'
import { useTheme } from '@/hooks'

/**
 * The "..." sheet behind the list header. See D-Q2 in the M4 exec plan: 25,
 * 35's pinned section and 41's manually hidden lists all exist, and no mockup
 * draws a way into any of them.
 *
 * Milestone 8 gives an archived list a different set of actions from this same
 * route, branching on `archivedAt` rather than adding a second sheet.
 */
export default function ListMenu() {
	const { t } = useTranslation()
	const { colors, spacing } = useTheme()
	const insets = useSafeAreaInsets()
	const { id } = useLocalSearchParams<{ id: string }>()

	const { data: found } = useLiveQuery(listById(id), [id])
	const list = found[0]

	if (!list) return <View style={{ backgroundColor: colors.surface }} />

	const pinned = Boolean(list.pinnedAt)
	const where = { spaceId: list.spaceId, listId: list.id }

	const remove = () => {
		Alert.alert(t('menu.deleteTitle', { title: list.title }), t('menu.deleteBody'), [
			{ text: t('app.cancel'), style: 'cancel' },
			{
				text: t('app.delete'),
				style: 'destructive',
				onPress: () => {
					deleteList(where)
					// Only this sheet is closed here. The list screen underneath
					// notices its own row is gone and pops itself, the same way the
					// item sheet does — see src/app/list/[id]/index.tsx.
					router.back()
				},
			},
		])
	}

	const actions: { key: string; label: string; icon: IconName; danger?: boolean; run: () => void }[] =
		[
			{
				key: 'rename',
				label: t('menu.rename'),
				icon: 'note',
				// A sheet replacing itself, rather than a sheet over a sheet.
				run: () => router.replace(`/list/${list.id}/rename`),
			},
			{
				key: 'pin',
				label: pinned ? t('menu.unpin') : t('menu.pin'),
				icon: 'pin',
				run: () => {
					if (pinned) unpinList(where)
					else pinList(where)
					router.back()
				},
			},
			{
				key: 'archive',
				label: t('menu.archive'),
				icon: 'pull-down',
				run: () => {
					// 'manual' is what 41 prints as "schowana ręcznie", against the
					// 'completed' a list gets when everything on it is checked off.
					archiveList({ ...where, reason: 'manual' })
					router.back()
				},
			},
			{ key: 'delete', label: t('menu.delete'), icon: 'trash', danger: true, run: remove },
		]

	return (
		<View
			style={{
				backgroundColor: colors.surface,
				paddingHorizontal: spacing.lg,
				paddingTop: spacing.xl,
				// Android's navigation bar only — see src/components/TitleSheet.tsx.
				paddingBottom:
					Platform.OS === 'android' ? Math.max(spacing.lg, insets.bottom) : spacing.lg,
				gap: spacing.sm,
			}}
		>
			{/* Which list this is about. The sheet covers the screen that says so. */}
			<SectionLabel>{list.title.toUpperCase()}</SectionLabel>

			<View>
				{actions.map((action, index) => (
					<ListRow
						key={action.key}
						title={action.label}
						tone={action.danger ? 'danger' : 'default'}
						onPress={action.run}
						last={index === actions.length - 1}
						left={
							<Icon
								name={action.icon}
								size={20}
								color={action.danger ? colors.danger : colors.text}
							/>
						}
						right={
							action.danger ? null : (
								<Icon name='chevron-right' size={18} color={colors.textMuted} />
							)
						}
					/>
				))}
			</View>

			<Button label={t('app.cancel')} variant='plain' onPress={() => router.back()} />
		</View>
	)
}
