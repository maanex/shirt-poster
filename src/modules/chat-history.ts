import type { Message, TextBasedChannel } from 'discord.js'
import { KV } from '../lib/kv'
import { defineModule } from '../lib/module'

export type MessageMemory = {
  id: string
  channelId: string
  guildId: string
  authorId: string
  authorName: string
  authorUsername?: string
  authorDisplayName?: string
  content: string
  contentDescription?: string
  timestamp: number
  referenceId?: string
  isBot?: boolean
}

const memory = new Map<string, MessageMemory[]>()

/**
 * Recursively extracts text from Discord Components V2 (CV2) text components (type 10).
 */
export function extractCV2Text(components?: any[]): string {
  if (!Array.isArray(components))
    return ''

  const texts: string[] = []
  const walk = (comp: any) => {
    if (!comp)
      return

    if (comp.type === 10 && typeof comp.content === 'string' && comp.content.trim())
      texts.push(comp.content.trim())

    if (Array.isArray(comp.components)) {
      for (const child of comp.components)
        walk(child)
    }
  }

  for (const c of components)
    walk(c)

  return texts.join('\n')
}

/**
 * Parses a Discord.js Message into a rich MessageMemory object.
 */
export function parseDiscordMessage(msg: Message): MessageMemory {
  const content = (msg.content || '').trim() || extractCV2Text(msg.components as any[])

  // Check if message was triggered by an interaction (e.g. slash command)
  const interaction = (msg as any).interactionMetadata || (msg as any).interaction
  const user = interaction?.user ?? msg.author
  const authorId = user?.id ?? ''
  const authorUsername = user?.username
  const authorDisplayName = interaction?.user ? user?.displayName : (msg.member?.displayName || user?.displayName)
  const authorName = authorDisplayName || authorUsername || 'Unknown'

  const interactionDesc = interaction
    ? `used /${interaction.commandName || interaction.name || 'command'} command from bot ${msg.author?.displayName || msg.author?.username || 'bot'}`
    : ''

  let mediaDesc = ''
  const attachments = Array.from(msg.attachments?.values?.() ?? [])
  if (attachments.some((a) => a.contentType?.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(a.url || '')))
    mediaDesc = 'sent an image'
  else if (attachments.some((a) => a.contentType?.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(a.url || '')))
    mediaDesc = 'sent a video'
  else if (attachments.length > 0)
    mediaDesc = 'sent an attachment'
  else if ((msg.stickers?.size ?? 0) > 0)
    mediaDesc = 'sent a sticker'
  else if ((msg.embeds?.length ?? 0) > 0 && content.length === 0)
    mediaDesc = 'sent an embed'

  const contentDescription = interactionDesc
    ? (mediaDesc ? `${interactionDesc} (${mediaDesc})` : interactionDesc)
    : mediaDesc

  return {
    id: msg.id,
    channelId: msg.channelId,
    guildId: msg.guildId ?? '',
    authorId,
    authorName,
    authorUsername,
    authorDisplayName,
    content,
    contentDescription: contentDescription || undefined,
    timestamp: msg.createdTimestamp || Date.now(),
    referenceId: msg.reference?.messageId ?? undefined,
    isBot: Boolean(msg.author?.bot),
  }
}

/**
 * Stores a MessageMemory in the in-memory guild cache.
 */
function recordInMemory(guildId: string, item: MessageMemory) {
  if (!guildId)
    return

  const channelMemory = memory.get(guildId) || []
  const existingIdx = channelMemory.findIndex((m) => m.id === item.id)

  if (existingIdx !== -1)
    channelMemory[existingIdx] = item
  else {
    channelMemory.push(item)
    channelMemory.sort((a, b) => a.timestamp - b.timestamp)

    const limit = KV.getInt('chat-history.length', { guild: BigInt(guildId), default: 100 })
    if (channelMemory.length > limit)
      channelMemory.shift()
  }
  memory.set(guildId, channelMemory)
}

export function getMessageMemoryFor(guildId: string): MessageMemory[] {
  return memory.get(guildId) || []
}

/**
 * Retrieves a message by ID from memory, falling back to Discord API if not cached.
 */
export async function getMessage(channel: TextBasedChannel, messageId: string): Promise<MessageMemory | null> {
  const guildId = 'guildId' in channel && channel.guildId ? channel.guildId : ''
  if (guildId) {
    const cached = (memory.get(guildId) || []).find((m) => m.id === messageId)
    if (cached)
      return cached
  }

  try {
    const fetched = await channel.messages.fetch(messageId)
    if (!fetched)
      return null
    const parsed = parseDiscordMessage(fetched)
    if (parsed.guildId)
      recordInMemory(parsed.guildId, parsed)
    return parsed
  } catch {
    return null
  }
}

/**
 * Queries older messages from a channel, checking memory and falling back to Discord API.
 * Returns messages in chronological order.
 */
export async function getOlderChannelMessages(
  channel: TextBasedChannel,
  limit: number,
  beforeId?: string
): Promise<MessageMemory[]> {
  const guildId = 'guildId' in channel && channel.guildId ? channel.guildId : ''
  let eligible = (guildId ? memory.get(guildId) || [] : []).filter((m) => m.channelId === channel.id)

  if (beforeId) {
    const pivot = eligible.find((m) => m.id === beforeId)
    if (pivot)
      eligible = eligible.filter((m) => m.timestamp < pivot.timestamp)
  }

  if (eligible.length >= limit)
    return eligible.slice(-limit)

  try {
    const fetched = await channel.messages.fetch({
      limit,
      ...(beforeId ? { before: beforeId } : {}),
    })

    const parsedList = Array.from(fetched.values()).map(parseDiscordMessage)
    for (const item of parsedList) {
      if (item.guildId)
        recordInMemory(item.guildId, item)
    }

    const combined = new Map([...eligible, ...parsedList].map((m) => [m.id, m]))
    return Array.from(combined.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-limit)
  } catch {
    return eligible.slice(-limit)
  }
}

export default defineModule({
  listeners: {
    messageCreate: async (msg) => {
      if (msg.channel.isDMBased())
        return
      if (!msg.guildId)
        return
      if (!msg.channel.permissionsFor(msg.guild!.roles.everyone)?.has('ViewChannel'))
        return

      recordInMemory(msg.guildId, parseDiscordMessage(msg))
    },
  },
})

