import { drizzle } from 'drizzle-orm/expo-sqlite'
import { openDatabaseSync } from 'expo-sqlite'

import * as schema from './schema'

/**
 * The raw expo-sqlite handle.
 *
 * `enableChangeListener` is what makes `useLiveQuery` work at all: without it
 * no change notifications are emitted and every screen would show whatever it
 * read when it mounted until something remounted it.
 */
export const sqlite = openDatabaseSync('peeers.db', {
	enableChangeListener: true,
})

// WAL keeps a reader from blocking a writer. Foreign keys are off by default in
// SQLite and have to be turned on per connection.
sqlite.execSync('PRAGMA journal_mode = WAL')
sqlite.execSync('PRAGMA foreign_keys = ON')

/**
 * The typed database. Note that this driver is **synchronous** — queries end in
 * `.run()`, `.get()` or `.all()` and return immediately, and `db.transaction()`
 * takes a synchronous callback. Passing it an `async` callback would commit the
 * transaction before the work inside it finished.
 */
export const db = drizzle(sqlite, { schema })
