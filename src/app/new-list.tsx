import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { TitleSheet } from '@/components/TitleSheet'
import { addItems, createList, currentSpaceId, listToCopy } from '@/db'

/**
 * Naming a list before it exists. See D-Q3 in the M4 exec plan: 05 and 35's
 * "Nowa" both need a next step no mockup draws, and 15 shows a list that
 * already has a name, so one sheet with one field invents the least.
 *
 * `copyFrom` is the "Skopiuj pozycje na nową listę" of 41: the field arrives
 * prefilled with that list's title and its items are re-added to the new list
 * once it exists. The archive screen that offers it arrives in Milestone 8;
 * until then the route is reachable by deep link,
 * `peeers://new-list?copyFrom=<listId>`, which is how it was checked.
 */
export default function NewList() {
	const { t } = useTranslation()
	const { copyFrom } = useLocalSearchParams<{ copyFrom?: string }>()
	const spaceId = currentSpaceId()

	// Read once, on mount. A snapshot is what this needs, and doing it in the
	// body would re-read the database on every keystroke.
	const [source] = useState(() => (copyFrom ? listToCopy(copyFrom) : null))

	const create = (title: string) => {
		const listId = createList({ spaceId, title })
		if (source && source.items.length > 0) addItems({ spaceId, listId, items: source.items })

		// `replace`, not `push`: the sheet has done its job, and going back from
		// the new list should return to wherever the sheet was opened from.
		router.replace(`/list/${listId}`)
	}

	return (
		<TitleSheet
			label={t('newList.heading')}
			submitLabel={t('newList.create')}
			placeholder={t('newList.placeholder')}
			initialValue={source?.title ?? ''}
			onSubmit={create}
		/>
	)
}
