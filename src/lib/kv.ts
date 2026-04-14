import consola from "consola"
import { and, eq, isNull } from "drizzle-orm"
import { db } from "../db/postgres"
import { configKv } from "../db/schema"


export namespace KV {

  type Options = {
    guild?: bigint
  }

  const cache = new Map<string, string | null>()

  export async function load() {
    cache.clear()
    const rows = await db
      .select()
      .from(configKv)
      .catch(err => {
        consola.withTag('KV:load').error(err)
        return []
      })
    for (const row of rows) {
      if (row.guild === null)
        cache.set(row.key, row.value)
      else
        cache.set(`${row.guild}:${row.key}`, row.value)
    }
  }

  export function get(key: string, options?: Options & { default?: string }) {    
    if (!options?.guild)
      return cache.get(key) ?? options?.default ?? null

    return cache.get(`${options.guild}:${key}`)
      ?? cache.get(key)
      ?? null
  }

  export function getBool(key: string, options?: Options & { default?: boolean }) {
    const value = get(key, { ...options, default: undefined })
    if (value === null)
      return options?.default ?? false

    return value === 'true'
  }

  export function getInt(key: string, options?: Options & { default?: number }) {
    const value = get(key, { ...options, default: undefined })
    if (value === null)
      return options?.default ?? 0

    const parsed = parseInt(value, 10)
    return isNaN(parsed) ? options?.default ?? 0 : parsed
  }

  export async function set(key: string, value: string | boolean | number | null, options?: Options) {
    const guild = options?.guild ?? null
    const cacheKey = guild ? `${guild}:${key}` : key
    const prevValue = cache.get(cacheKey) ?? null
    const stringValue = String(value)
    cache.set(cacheKey, stringValue)

    const where = guild === null
      ? and(eq(configKv.key, key), isNull(configKv.guild))
      : and(eq(configKv.key, key), eq(configKv.guild, guild))

    await db
      .update(configKv)
      .set({ value: stringValue })
      .where(where)
      .returning({ key: configKv.key })
      .then(async updated => {
        if (updated.length > 0)
          return

        await db.insert(configKv).values({
          key,
          guild,
          value: stringValue
        })
      })
      .catch(err => {
        consola.withTag('KV:set').error(err)
        cache.set(cacheKey, prevValue)
      })
  }

}
