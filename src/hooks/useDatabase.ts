import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator'
import { useEffect, useState } from 'react'

import { db } from '@/db/client'
import migrations from '@/db/migrations/migrations'
import { ensureSeed } from '@/db/seed'

/**
 * Brings the database up: applies any migrations this device has not run yet,
 * then seeds the development Przestrzeń.
 *
 * Returns `ready: false` until both finish. The root layout must not render a
 * screen before then — a query against a table that does not exist yet throws,
 * and on a fresh install no table exists.
 *
 * On failure there is deliberately nothing to show. There is no mockup for a
 * broken database, and inventing Polish copy for one is what AGENTS.md forbids;
 * a development build surfaces the error on its red screen, which is where this
 * is actually diagnosed. See the M3 exec plan's Decision Log.
 */
export function useDatabase() {
	const { success, error } = useMigrations(db, migrations)
	// A release build has nothing to seed, so it is "seeded" from the start.
	const [seeded, setSeeded] = useState(!__DEV__)

	useEffect(() => {
		if (!success || seeded) return

		ensureSeed()
		setSeeded(true)
	}, [success, seeded])

	return { ready: success && seeded, error }
}
