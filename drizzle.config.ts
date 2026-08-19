import { defineConfig } from 'drizzle-kit'

/**
 * Migration generation for the on-device database. Run it with
 * `npm run db:generate` after every change to src/db/schema.ts.
 *
 * `driver: 'expo'` is what makes drizzle-kit emit src/db/migrations/migrations.js
 * alongside the plain .sql files — that file is what the app imports at startup,
 * because a phone cannot read a .sql file off disk.
 */
export default defineConfig({
	schema: './src/db/schema.ts',
	out: './src/db/migrations',
	dialect: 'sqlite',
	driver: 'expo',
})
