import { defineModule } from "../../lib/module"
import { systemOneClient } from "../../lib/system-one"
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
 * Checks if the top probability is at least 0.15 higher than the second highest probability.
 */
export function meetsConfidenceGap(
  probabilities: Record<string, number>,
  minGap = 0.15
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
        console.log(`[ChessRating] Skipped DM message from ${msg.author.tag}`)
        return
      }

      console.log(`[ChessRating] Handling message from ${msg.author.tag}: "${msg.content}"`)

      // Add to cache
      const cached = messageCache.add(msg)

      // If this message references another, ensure the reply ancestors are fetched into the cache
      if (msg.reference?.messageId) {
        await messageCache.ensureReplyChain(msg.channel, cached)
      }

      // If message content is empty (e.g. only embeds/attachments), ignore
      if (!msg.content.trim()) {
        console.log(`[ChessRating] Skipped: message content is empty`)
        return
      }

      // Build conversation plaintext following the 10-message & 3-hour cutoff rules
      const channelMessages = messageCache.getChannelMessages(msg.channelId)
      const selected = selectMessages(channelMessages, cached, 10)
      const conversationText = formatConversation(selected)

      if (!conversationText.trim()) {
        console.log(`[ChessRating] Skipped: formatted conversation is empty`)
        return
      }

      console.log(`[ChessRating] Sending state to SystemOne (${selected.length} msgs):\n${conversationText}`)

      // Query System One API
      const answer = await systemOneClient.askChoice<ChessRating>(
        conversationText,
        "chess_rating",
        CHESS_RATING_CRITERIA,
        CHESS_RATING_INSTRUCTIONS
      )

      if (!answer) {
        console.log(`[ChessRating] SystemOne returned no answer`)
        return
      }

      console.log(`[ChessRating] SystemOne answer: "${answer.choice}" (confidence: ${answer.confidence})`, answer.probabilities)

      // Verify the confidence condition: top choice must lead by at least 0.15
      const gap = meetsConfidenceGap(answer.probabilities, 0.15)
      if (!gap.ok) {
        console.log(`[ChessRating] Skipped: confidence gap too narrow (highest: ${gap.highest.toFixed(3)}, 2nd: ${gap.secondHighest.toFixed(3)}, diff: ${gap.diff.toFixed(3)} < 0.15)`)
        return
      }

      const emoji = CHESS_RATING_EMOJIS[answer.choice]
      if (!emoji) {
        console.warn(`[ChessRating] No emoji found for choice "${answer.choice}"`)
        return
      }

      try {
        console.log(`[ChessRating] Reacting to message ${msg.id} with ${emoji}...`)
        await msg.react(emoji)
        console.log(`[ChessRating] Reacted successfully!`)
      } catch (err) {
        console.error(`[ChessRating] Failed to react to message ${msg.id}:`, err)
      }
    },
  },
})

