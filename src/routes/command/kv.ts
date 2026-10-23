import { button, enforcePrivateResponse, text } from 'cordo/components'
import { defineCordoCommand, defineCordoRoute, type CordoInteraction } from 'cordo/core'
import { KV } from '../../lib/kv'

const getFuzzyScore = (candidate: string, query: string): number => {
  const c = candidate.toLowerCase()
  const q = query.toLowerCase().trim()

  if (!q)
    return 1

  if (c === q)
    return 1000

  if (c.startsWith(q))
    return 500 - (c.length - q.length)

  if (c.includes(q))
    return 300 - c.indexOf(q) - (c.length - q.length)

  if (q.length >= 2) {
    let qIdx = 0
    let cIdx = 0
    let score = 50
    let consecutive = 0
    let prevMatchedIdx = -2

    while (qIdx < q.length && cIdx < c.length) {
      if (q[qIdx] === c[cIdx]) {
        const isConsecutive = cIdx === prevMatchedIdx + 1
        const isBoundary = cIdx === 0 || ['.', '-', '_', ':'].includes(c[cIdx - 1] ?? '') || ['.', '-', '_', ':'].includes(c[cIdx] ?? '')
        if (isConsecutive || isBoundary) {
          score += 10
          if (isConsecutive) {
            consecutive++
            score += consecutive * 5
          } else {
            consecutive = 0
          }
          if (isBoundary)
            score += 20
          prevMatchedIdx = cIdx
          qIdx++
        }
      }
      cIdx++
    }

    if (qIdx === q.length)
      return score - (c.length - q.length)
  }

  return -1
}

const getAllKnownKeys = (guildId?: string): string[] => {
  const keys = new Set<string>()

  for (const key of Object.keys(KV.knownOptions))
    keys.add(key)

  for (const entry of KV.listCached('')) {
    const cleaned = entry.key.replace(/^\d+:/, '')
    if (cleaned)
      keys.add(cleaned)
  }

  if (guildId) {
    try {
      const guild = BigInt(guildId)
      for (const entry of KV.listCached('', { guild })) {
        if (entry.key)
          keys.add(entry.key)
      }
    } catch {
      // Ignore invalid bigint
    }
  }

  return Array.from(keys)
}

const handleKeyAutocomplete = (value: string, i: CordoInteraction) => {
  const rawText = (value ?? '').slice(0, 100)
  const query = rawText.trim()
  const guildId = ('guild_id' in i && i.guild_id) ? i.guild_id : (i as any).guild?.id
  const knownKeys = getAllKnownKeys(guildId)

  let choices: Array<{ name: string, value: string }>

  if (!query) {
    choices = knownKeys.slice(0, 25).map(key => ({ name: key, value: key }))
  } else {
    const scored = knownKeys
      .map(key => ({ key, score: getFuzzyScore(key, query) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)

    choices = scored.map(item => ({ name: item.key, value: item.key }))
  }

  if (query.length > 0) {
    const alreadyPresent = choices.some(c => c.value.toLowerCase() === query.toLowerCase())
    if (!alreadyPresent) {
      if (choices.length >= 25)
        choices = choices.slice(0, 24)
      choices.push({ name: query, value: query })
    }
  }

  return choices.slice(0, 25)
}

const route = defineCordoRoute(i => {
  if (i.source !== 'command')
    return i.ack()

  const { key, value, global } = (i.command.options ?? {}) as { key?: string, value?: string, global?: boolean }
  if (!key) {
    return i.render(
      text('Key missing...'),
      enforcePrivateResponse()
    )
  }

  if (i.location !== 'guild' && !global) {
    return i.render(
      text('Guild-specific keys can only be set in a guild. Use the "global" option to set global keys.'),
      enforcePrivateResponse()
    )
  }

  if (key === 'GET' && value === 'ADMIN') {
    const initialAdminClaimed = KV.get('initial-admin')
    if (!initialAdminClaimed && global) {
      KV.set('initial-admin', i.user.id)
      KV.set(`user.${i.user.id}.admin`, 'true')
      return i.render(
        text('You now admin. Good job.'),
        enforcePrivateResponse()
      )
    } else if (!global) {
      return i.render(
        text('You fogor something...'),
        enforcePrivateResponse()
      )
    } else {
      return i.render(
        text('Bla' + ' bla'.repeat(Math.floor(Math.random() * 30))),
        enforcePrivateResponse()
      )
    }
  }

  const guild = global
    ? undefined
    : i.location === 'guild'
      ? BigInt(i.guild.id)
      : null
  if (guild === null) // just to be sure lol
    return i.ack()

  const userAdmin = KV.getBool(`user.${i.user.id}.admin`, { default: false, guild })
  if (!userAdmin) {
    return i.render(
      text('You do not have permission to use this command.'),
      button().label('click me'), // for the fun of it (doesnt do anything)
      enforcePrivateResponse()
    )
  }

  if (value === undefined) {
    if (key.endsWith('*')) {
      const prefix = key.slice(0, -1).toLowerCase()
      const found = Array.from(KV.listCached(prefix, { guild }))
      return i.render(
        text(found.map(entry => `${entry.key}=${entry.value}`).join('\n').slice(0, 1999) || 'No keys found with that prefix.')
          .codeBlock(),
        enforcePrivateResponse()
      )
    } else {
      const currentValueGuild = guild ? KV.get(key.toLowerCase(), { guild }) : null
      const currentValueGlobal = KV.get(key.toLowerCase())
      return i.render(
        text(`(guild)${key}=${currentValueGuild}\n(global)${key}=${currentValueGlobal}`)
          .codeBlock(),
        enforcePrivateResponse()
      )
    }
  }

  if (key.includes('*')) {
    return i.render(
      text('Wildcard keys are not supported.'),
      enforcePrivateResponse()
    )
  }

  const setValue = value === 'null' ? null : String(value)
  KV.set(key.toLowerCase(), setValue, { guild })
  return i.render(
    text(`✅ Set key "${key}" to "${setValue}" ${global ? 'globally' : 'for this guild'}.`),
    enforcePrivateResponse()
  )
})

export default defineCordoCommand({
  type: 'chat',
  name: 'kv',
  description: 'Update KV config',
  limitInstallTypes: ['guild', 'user'],
  limitContexts: ['guild', 'dm', 'group'],
  options: [
    {
      type: 'string',
      name: 'key',
      description: 'Key',
      required: true,
      choices: (value, i) => handleKeyAutocomplete(value, i),
    },
    {
      type: 'string',
      name: 'value',
      description: 'Value',
      required: false,
    },
    {
      type: 'boolean',
      name: 'global',
      description: 'If not this will only affect this guild',
      required: false,
    },
  ],
  route,
})
