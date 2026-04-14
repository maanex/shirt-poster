import fs from 'node:fs'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'

const connectionString = process.env.POSTGRES_URL_FILE
	? fs.readFileSync(process.env.POSTGRES_URL_FILE).toString().trim()
	: process.env.POSTGRES_URL
if (!connectionString)
	throw new Error('POSTGRES_URL environment variable is required')

export const db = drizzle({
	connection: {
		connectionString,
		// ssl: true
	}
})

// Run migrations automatically on startup
export async function runMigrations() {
	console.log('Running database migrations...')
	await migrate(db, { migrationsFolder: `${import.meta.dir}/../../.drizzle` })
	console.log('Migrations completed successfully')
}
