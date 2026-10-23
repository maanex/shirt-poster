import type { TextBasedChannel } from 'discord.js'
import { getMessage, getOlderChannelMessages, type MessageMemory } from '../chat-history'
import type { ChessRating } from './types'

/**
 * Generates letter labels: 0 -> 'A', 1 -> 'B', ..., 25 -> 'Z', 26 -> 'A1', etc.
 */
export function getAuthorLabel(index: number): string {
  const letter = String.fromCharCode(65 + (index % 26))
  return index < 26 ? letter : `${letter}${Math.floor(index / 26)}`
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Collects older messages backwards from an anchor timestamp until limit is reached or gap exceeds maxGapMs.
 */
function collectWithCutoff(
  candidates: MessageMemory[],
  anchorTimestamp: number,
  limit: number,
  maxGapMs: number
): MessageMemory[] {
  const result: MessageMemory[] = []
  let prevTimestamp = anchorTimestamp

  for (let i = candidates.length - 1; i >= 0; i--) {
    const candidate = candidates[i]!
    if (prevTimestamp - candidate.timestamp > maxGapMs)
      break

    result.unshift(candidate)
    prevTimestamp = candidate.timestamp

    if (result.length >= limit)
      break
  }

  return result
}

/**
 * Collects up to `maxMessages` conversation messages:
 * - If target message is a reply: crawls the reply chain upwards until N messages or top of chain.
 *   If top of chain is reached, queries older messages starting from the top of the chain.
 * - If target message is not a reply: queries the last N messages in the channel.
 * - Non-reply channel history respects the `cutoffHours` cutoff date.
 */
export async function collectConversationMessages(
  channel: TextBasedChannel,
  targetMessage: MessageMemory,
  maxMessages = 10,
  cutoffHours = 3
): Promise<MessageMemory[]> {
  const maxGapMs = cutoffHours * 3600 * 1000

  // 1. Target message is a Discord reply
  if (targetMessage.referenceId) {
    const chain: MessageMemory[] = [targetMessage]
    let current = targetMessage

    while (current.referenceId && chain.length < maxMessages) {
      const parent = await getMessage(channel, current.referenceId)
      if (!parent || chain.some((m) => m.id === parent.id))
        break

      chain.unshift(parent)
      current = parent
    }

    if (chain.length < maxMessages) {
      const root = chain[0]!
      const needed = maxMessages - chain.length
      const older = await getOlderChannelMessages(channel, needed, root.id)
      const backfill = collectWithCutoff(older, root.timestamp, needed, maxGapMs)
      return [...backfill, ...chain]
    }

    return chain.slice(-maxMessages)
  }

  // 2. Target message is not a reply: collect recent channel history
  const older = await getOlderChannelMessages(channel, maxMessages - 1, targetMessage.id)
  const backfill = collectWithCutoff(older, targetMessage.timestamp, maxMessages - 1, maxGapMs)
  return [...backfill, targetMessage]
}

/**
 * Transforms an array of messages into a formatted conversation flow:
 * - Authors mapped to 'A', 'B', 'C', ... in appearance order.
 * - Mentions (<@id> and @name) transformed into @A, @B, etc.
 * - Media/stickers replaced with *sent an image*, *sent a sticker*, etc.
 * - Interaction commands attributed to user with descriptive action.
 * - Each line prefixed with rating: `(book) A: ...`, `(unrated) B: ...`, `(RATE THIS) A: ...`
 */
export function formatConversation(
  messages: MessageMemory[],
  targetMessageId: string,
  ratingCache: Map<string, ChessRating>
): string {
  if (messages.length === 0)
    return ''

  const authorIdToLetter = new Map<string, string>()
  const authorNames: { name: string; letter: string }[] = []
  const seenNames = new Set<string>()
  let authorCount = 0

  for (const msg of messages) {
    let letter = authorIdToLetter.get(msg.authorId)
    if (!letter) {
      letter = getAuthorLabel(authorCount++)
      authorIdToLetter.set(msg.authorId, letter)
    }

    for (const name of [msg.authorUsername, msg.authorDisplayName, msg.authorName]) {
      const trimmed = name?.trim()
      if (trimmed && !seenNames.has(trimmed.toLowerCase())) {
        seenNames.add(trimmed.toLowerCase())
        authorNames.push({ name: trimmed, letter })
      }
    }
  }

  authorNames.sort((a, b) => b.name.length - a.name.length)

  const formattedLines: string[] = []

  for (const msg of messages) {
    const authorLetter = authorIdToLetter.get(msg.authorId) ?? 'Unknown'
    let content = ''

    if (msg.content.length > 0) {
      let text = msg.content.replace(/<@!?(\d+)>/g, (_, userId) => {
        const letter = authorIdToLetter.get(userId)
        return letter ? `@${letter}` : '@User'
      })

      for (const { name, letter } of authorNames) {
        const regex =
          name.length === 1
            ? new RegExp(`@${escapeRegex(name)}(?=\\W|$)`, 'gi')
            : new RegExp(`(?:^|(?<=\\W))@?${escapeRegex(name)}(?=\\W|$)`, 'gi')
        text = text.replace(regex, `@${letter}`)
      }

      content = msg.contentDescription ? `*${msg.contentDescription}*\n${text}` : text
    } else {
      content = `*${msg.contentDescription || 'empty message'}*`
    }

    const rating = ratingCache.get(msg.id)
    const prefix = msg.id === targetMessageId ? '(RATE THIS) ' : (rating ? `(${rating}) ` : '(unrated) ')
    formattedLines.push(`${prefix}${authorLetter}: ${content.trim()}`)
  }

  return formattedLines.join('\n')
}
