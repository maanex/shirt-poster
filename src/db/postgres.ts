import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'

export const db = drizzle({
	connection: {
		connectionString: process.env.POSTGRES_URL!,
		// ssl: true
	}
})

export async function applyMigrations() {
	await migrate(db, { migrationsFolder: './.drizzle' })
}
