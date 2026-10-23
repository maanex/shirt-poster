import consola from "consola"
import { and, eq, isNull } from "drizzle-orm"
import { db } from "../db/postgres"
import { configKv } from "../db/schema"


export namespace KV {

  export const knownOptions = {
    'user.{id}.{permission}': {
      type: 'boolean',
      default: false
    },
    'chat-history.length': {
      type: 'int',
      default: 100
    },
    'daily-poll.channel': {
      type: 'string',
      default: null
    },
    'chess-rating.channels': {
      type: 'string',
      default: null
    },
    'chess-rating.min-confidence': {
      type: 'float',
      default: 24
    },
    'chess-rating.history-limit': {
      type: 'int',
      default: 10
    },
    'chess-rating.history-cutoff-hours': {
      type: 'float',
      default: 24
    },
  } as const

  type LooseAutocomplete<T extends string> = T | Omit<string, T>
  type KnownOptionKey = LooseAutocomplete<keyof typeof knownOptions>
  type KnownOptionKeyForType<T extends 'boolean' | 'int' | 'float' | 'string'> = LooseAutocomplete<{
    [K in keyof typeof knownOptions]: typeof knownOptions[K]['type'] extends T ? K : never
  }[keyof typeof knownOptions]>

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

  export function get(key: KnownOptionKey, options?: Options & { default?: string }) {    
    if (!options?.guild)
      return cache.get(key as string) ?? options?.default ?? null

    return cache.get(`${options.guild}:${key}`)
      ?? cache.get(key as string)
      ?? null
  }

  export function getBool(key: KnownOptionKeyForType<'boolean'>, options?: Options & { default?: boolean }) {
    const value = get(key, { ...options, default: undefined })
    if (value === null)
      return options?.default ?? false

    return value === 'true'
  }

  export function getInt(key: KnownOptionKeyForType<'int'>, options?: Options & { default?: number }) {
    const value = get(key, { ...options, default: undefined })
    if (value === null)
      return options?.default ?? 0

    const parsed = parseInt(value, 10)
    return isNaN(parsed) ? options?.default ?? 0 : parsed
  }

  export function getFloat(key: KnownOptionKeyForType<'float'>, options?: Options & { default?: number }) {
    const value = get(key, { ...options, default: undefined })
    if (value === null)
      return options?.default ?? 0

    const parsed = parseFloat(value)
    return isNaN(parsed) ? options?.default ?? 0 : parsed
  }

  export async function set(key: KnownOptionKey, value: string | boolean | number | null, options?: Options) {
    const guild = options?.guild ?? null
    const cacheKey = guild ? `${guild}:${key}` : key as string
    const prevValue = cache.get(cacheKey as string) ?? null
    const stringValue = String(value)
    cache.set(cacheKey as string, stringValue)

    const where = guild === null
      ? and(eq(configKv.key, key as string), isNull(configKv.guild))
      : and(eq(configKv.key, key as string), eq(configKv.guild, guild))

    await db
      .update(configKv)
      .set({ value: stringValue })
      .where(where)
      .returning({ key: configKv.key })
      .then(async updated => {
        if (updated.length > 0)
          return

        await db.insert(configKv).values({
          key: key as string,
          guild,
          value: stringValue
        })
      })
      .catch(err => {
        consola.withTag('KV:set').error(err)
        cache.set(cacheKey, prevValue)
      })
  }

  export function* listCached(prefix: string, options?: Options) {
    const guildPrefix = options?.guild ? `${options.guild}:` : ''
    const fullPrefix = guildPrefix + prefix
    for (const [ cacheKey, value ] of cache.entries()) {
      if (cacheKey.startsWith(fullPrefix)) {
        yield {
          key: cacheKey.slice(guildPrefix.length),
          value: String(value)
        }
      }
    }
  }

}
