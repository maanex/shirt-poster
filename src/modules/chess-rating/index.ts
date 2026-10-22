import { KV } from "../../lib/kv"
import { defineModule } from "../../lib/module"
import { debugLog, getDecisionClient } from "../../lib/system-one"
import { formatConversation, selectMessages } from "./conversation-builder"
import { messageCache } from "./message-cache"
import {
  CHESS_RATING_CRITERIA,
  CHESS_RATING_EMOJIS,
  CHESS_RATING_INSTRUCTIONS,
  type ChessRating,
} from "./types"

export * from "./types"
export * from "./conversation-builder"
export * from "./message-cache"

/**
 * Checks if chess rating is enabled for this channel via KV (`chess-rating.channels`).
 * Supports:
 * - `*` for guild-wide access
 * - Comma- or space-separated list of channel IDs (e.g. `123456789,987654321`)
 */
export function isChannelOptedIn(guildId: string | null | undefined, channelId: string): boolean {
  if (!guildId) {
    return false
  }

  const allowed = KV.get("chess-rating.channels", {
    guild: BigInt(guildId),
  })

  if (!allowed) {
    debugLog(`[ChessRating] Skipped: chess-rating.channels is unset for guild ${guildId}`)
    return false
  }

  const trimmed = allowed.trim()
  if (trimmed === "*") {
    return true
  }

  const channelList = trimmed.split(/[\s,]+/).filter(Boolean)
  const isAllowed = channelList.includes(channelId)
  if (!isAllowed) {
    debugLog(`[ChessRating] Skipped: channel ${channelId} not in chess-rating.channels (${allowed})`)
  }
  return isAllowed
}

/**
 * Checks if the top probability is at least 0.1 higher than the second highest probability.
 */
export function meetsConfidenceGap(
  probabilities: Record<string, number>,
  minGap = 0.1
): { ok: boolean; highest: number; secondHighest: number; diff: number } {
  const sorted = Object.values(probabilities).sort((a, b) => b - a)
  const highest = sorted[0] ?? 0
  const secondHighest = sorted[1] ?? 0
  const diff = highest - secondHighest
  return { ok: diff >= minGap, highest, secondHighest, diff }
}

export default defineModule({
  listeners: {
    messageCreate: async (msg) => {
      // 1. Filter out bot messages & DMs
      if (msg.author.bot) {
        return
      }
      if (msg.channel.isDMBased()) {
        debugLog(`[ChessRating] Skipped DM message from ${msg.author.tag}`)
        return
      }

      // Check opt-in via KV (chess-rating.channels)
      if (!isChannelOptedIn(msg.guildId, msg.channelId)) {
        return
      }

      debugLog(`[ChessRating] Handling message from ${msg.author.tag}: "${msg.content}"`)

      // Add to cache
      const cached = messageCache.add(msg)

      // If this message references another, ensure the reply ancestors are fetched into the cache
      if (msg.reference?.messageId) {
        await messageCache.ensureReplyChain(msg.channel, cached)
      }

      // If message content is empty (e.g. only embeds/attachments), ignore
      if (!msg.content.trim()) {
        debugLog(`[ChessRating] Skipped: message content is empty`)
        return
      }

      // Build conversation plaintext following the 10-message & 3-hour cutoff rules
      const channelMessages = messageCache.getChannelMessages(msg.channelId)
      const selected = selectMessages(channelMessages, cached, 10)
      const conversationText = formatConversation(selected)

      if (!conversationText.trim()) {
        debugLog(`[ChessRating] Skipped: formatted conversation is empty`)
        return
      }

      debugLog(`[ChessRating] Sending state to decision model (${selected.length} msgs):\n${conversationText}`)

      // Query decision model (System One or Cloudflare Clef)
      const decisionClient = getDecisionClient()
      const answer = await decisionClient.askChoice<ChessRating>(
        conversationText,
        "chess_rating",
        CHESS_RATING_CRITERIA,
        CHESS_RATING_INSTRUCTIONS
      )

      if (!answer) {
        debugLog(`[ChessRating] Decision model returned no answer`)
        return
      }

      debugLog(`[ChessRating] Decision model answer: "${answer.choice}" (confidence: ${answer.confidence})`, answer.probabilities)

      // Verify the confidence condition: top choice must lead by at least 0.1
      const gap = meetsConfidenceGap(answer.probabilities, 0.1)
      if (!gap.ok) {
        debugLog(`[ChessRating] Skipped: confidence gap too narrow (highest: ${gap.highest.toFixed(3)}, 2nd: ${gap.secondHighest.toFixed(3)}, diff: ${gap.diff.toFixed(3)} < 0.1)`)
        return
      }

      const emoji = CHESS_RATING_EMOJIS[answer.choice]
      if (!emoji) {
        console.warn(`[ChessRating] No emoji found for choice "${answer.choice}"`)
        return
      }

      // Extract the ID from the <:name:id> format, or use as-is
      const emojiId = emoji.match(/:(\d+)>/)?.[1] ?? emoji

      try {
        debugLog(`[ChessRating] Reacting to message ${msg.id} with ${emoji}...`)
        await msg.react(emojiId)
        debugLog(`[ChessRating] Reacted successfully!`)
      } catch (err) {
        console.error(`[ChessRating] Failed to react to message ${msg.id}:`, err)
      }
    },
  },
})

