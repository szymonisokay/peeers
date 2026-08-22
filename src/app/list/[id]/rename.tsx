import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { router, useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { TitleSheet } from '@/components/TitleSheet'
import { listById, renameList } from '@/db'
import { useTheme } from '@/hooks'

/** Renaming a list, from the "..." menu. The same sheet as `new-list`. */
export default function Rename() {
	const { t } = useTranslation()
	const { colors } = useTheme()
	const { id } = useLocalSearchParams<{ id: string }>()

	const { data: found } = useLiveQuery(listById(id), [id])
	const list = found[0]

	/*
	 * The row arrives one render after the screen. `TitleSheet` seeds its field
	 * once, on mount, so it must not mount before the title exists — an empty
	 * sheet that later has a title behind it would save the wrong thing.
	 */
	if (!list) return <View style={{ backgroundColor: colors.surface }} />

	return (
		<TitleSheet
			label={t('newList.renameHeading')}
			submitLabel={t('app.save')}
			initialValue={list.title}
			onSubmit={(title) => {
				renameList({ spaceId: list.spaceId, listId: list.id, title })
				router.back()
			}}
		/>
	)
}
