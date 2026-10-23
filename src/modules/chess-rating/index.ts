import { KV } from '../../lib/kv'
import { defineModule } from '../../lib/module'
import { debugLog, getDecisionClient } from '../../lib/system-one'
import { parseDiscordMessage } from '../chat-history'
import { collectConversationMessages, formatConversation } from './conversation-builder'
import { CHESS_RATING_CRITERIA, CHESS_RATING_EMOJIS, CHESS_RATING_INSTRUCTIONS, type ChessRating } from './types'

export * from './types'
export * from './conversation-builder'

// In-memory cache of rated messages: messageId -> ChessRating
export const ratingCache = new Map<string, ChessRating>()

// Sequential message queue per channel to prevent race conditions in conversation flow
const channelQueues = new Map<string, Promise<void>>()

function queueChannelTask(channelId: string, task: () => Promise<void>): Promise<void> {
  const next = (channelQueues.get(channelId) ?? Promise.resolve()).then(task, task)
  channelQueues.set(channelId, next)
  next.finally(() => {
    if (channelQueues.get(channelId) === next)
      channelQueues.delete(channelId)
  })
  return next
}

/**
 * Checks if chess rating is enabled for this channel via KV (`chess-rating.channels`).
 * Supports:
 * - `*` for guild-wide access
 * - Comma- or space-separated list of channel IDs (e.g. `123456789,987654321`)
 */
export function isChannelOptedIn(guildId: string | null | undefined, channelId: string): boolean {
  if (!guildId)
    return false

  const allowed = KV.get('chess-rating.channels', { guild: BigInt(guildId) })?.trim()
  if (!allowed)
    return false

  if (allowed === '*')
    return true

  return allowed.split(/[\s,]+/).includes(channelId)
}

/**
 * Checks if the top probability is at least minGap higher than the second highest probability.
 */
export function meetsConfidenceGap(
  probabilities: Record<string, number>,
  minGap = 0.1
): { ok: boolean; highest: number; secondHighest: number; diff: number } {
  const [highest = 0, secondHighest = 0] = Object.values(probabilities).sort((a, b) => b - a)
  const diff = highest - secondHighest
  return {
    ok: diff >= minGap,
    highest,
    secondHighest,
    diff,
  }
}

export default defineModule({
  listeners: {
    messageCreate: async (msg) => {
      // 1. Filter out direct messages
      if (msg.channel.isDMBased())
        return

      // 2. Check opt-in via KV (chess-rating.channels)
      if (!isChannelOptedIn(msg.guildId, msg.channelId))
        return

      // 3. Parse message into rich memory representation
      const parsed = parseDiscordMessage(msg)

      // 4. Do not rate/react to bot messages or messages without text content
      if (parsed.isBot || parsed.content.length === 0)
        return

      // 5. Process rating sequentially per channel
      await queueChannelTask(msg.channelId, async () => {
        const guildId = msg.guildId!

        // Read N and T from KV with defaults
        const maxMessages = KV.getInt('chess-rating.history-limit', {
          guild: BigInt(guildId),
          default: 10,
        })
        const cutoffHours = KV.getFloat('chess-rating.history-cutoff-hours', {
          guild: BigInt(guildId),
          default: 3,
        })

        // Collect conversation messages and format with ratings
        const messages = await collectConversationMessages(
          msg.channel,
          parsed,
          maxMessages,
          cutoffHours
        )
        const conversationText = formatConversation(messages, parsed.id, ratingCache)

        if (!conversationText.trim())
          return

        debugLog(`[ChessRating] Conversation text:\n${conversationText}`)

        // Query decision model
        const decisionClient = getDecisionClient()
        const answer = await decisionClient.askChoice<ChessRating>(
          conversationText,
          'chess_rating',
          CHESS_RATING_CRITERIA,
          CHESS_RATING_INSTRUCTIONS
        )

        if (!answer)
          return

        debugLog(`[ChessRating] Model response: '${answer.choice}' (confidence: ${answer.confidence})`, answer.probabilities)

        // Check minimum confidence gap from KV (default 0.1)
        const minGap = KV.getFloat('chess-rating.min-confidence', {
          guild: BigInt(guildId),
          default: 0.1,
        })

        const gap = meetsConfidenceGap(answer.probabilities, minGap)
        if (!gap.ok)
          return

        // Cache the rating in RAM
        ratingCache.set(parsed.id, answer.choice)

        // React with fitting emoji
        const emoji = CHESS_RATING_EMOJIS[answer.choice]
        if (!emoji) {
          console.warn(`[ChessRating] No emoji found for choice '${answer.choice}'`)
          return
        }

        const emojiId = emoji.match(/:(\d+)>/)?.[1] ?? emoji

        try {
          await msg.react(emojiId)
        } catch (err) {
          console.error(`[ChessRating] Failed to react to message ${msg.id}:`, err)
        }
      })
    },
  },
})
