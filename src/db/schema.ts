import { sql } from 'drizzle-orm'
import { bigint, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import type { ChessRating } from '../modules/chess-rating/types'


export const configKv = pgTable('config_kv', {
  key: text('key').notNull(),
  guild: bigint('guild', { mode: 'bigint' }),
  value: text('value')
}, table => [
  uniqueIndex('config_kv_key_guild_uq').on(table.key, table.guild),
  uniqueIndex('config_kv_global_key_uq').on(table.key).where(sql`${table.guild} is null`)
])

export const chessRatings = pgTable('chess_ratings', {
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  userId: bigint('user_id', { mode: 'bigint' }).notNull(),
  chessRating: text('chess_rating').$type<ChessRating>().notNull(),
})
