import { sql } from 'drizzle-orm'
import { bigint, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'


export const configKv = pgTable('config_kv', {
  key: text('key').notNull(),
  guild: bigint('guild', { mode: 'bigint' }),
  value: text('value')
}, table => [
  uniqueIndex('config_kv_key_guild_uq').on(table.key, table.guild),
  uniqueIndex('config_kv_global_key_uq').on(table.key).where(sql`${table.guild} is null`)
])
