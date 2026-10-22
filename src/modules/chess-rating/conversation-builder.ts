import type { CachedMessage } from "./types"

const THREE_HOURS_MS = 3 * 60 * 60 * 1000

/**
 * Generates letter labels: 0 -> "A", 1 -> "B", ..., 25 -> "Z", 26 -> "A1", etc.
 */
export function getAuthorLabel(index: number): string {
  if (index < 26) {
    return String.fromCharCode(65 + index)
  }
  const letter = String.fromCharCode(65 + (index % 26))
  const suffix = Math.floor(index / 26)
  return `${letter}${suffix}`
}

/**
 * Escapes regex special characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Selects up to `maxMessages` following the rules:
 * 1. If current message is a reply, include the entire reply chain (up to maxMessages).
 * 2. Backfill remaining slots from recent channel history.
 * 3. Cut off older channel messages if the gap between consecutive messages is > 3 hours
 *    (reply-chain ancestors bypass this cutoff).
 */
export function selectMessages(
  channelMessages: CachedMessage[],
  currentMessage: CachedMessage,
  maxMessages = 10,
  maxGapMs = THREE_HOURS_MS
): CachedMessage[] {
  const messageMap = new Map<string, CachedMessage>()
  for (const msg of channelMessages) {
    messageMap.set(msg.id, msg)
  }
  messageMap.set(currentMessage.id, currentMessage)

  // 1. Traverse reply chain first
  const replyChain: CachedMessage[] = [currentMessage]
  const visitedReplyIds = new Set<string>([currentMessage.id])
  let pointer = currentMessage

  while (pointer.referenceMessageId && replyChain.length < maxMessages) {
    const parentMsg = messageMap.get(pointer.referenceMessageId)
    if (!parentMsg || visitedReplyIds.has(parentMsg.id)) {
      break
    }
    visitedReplyIds.add(parentMsg.id)
    replyChain.push(parentMsg)
    pointer = parentMsg
  }

  const selectedMap = new Map<string, CachedMessage>()
  for (const msg of replyChain) {
    selectedMap.set(msg.id, msg)
  }

  // 2. Backfill from channel history in reverse order
  if (selectedMap.size < maxMessages) {
    const historyBeforeCurrent = channelMessages
      .filter((m) => m.id !== currentMessage.id && m.createdAt <= currentMessage.createdAt)
      .sort((a, b) => a.createdAt - b.createdAt)

    let lastTimestamp = currentMessage.createdAt

    for (let i = historyBeforeCurrent.length - 1; i >= 0; i--) {
      const candidate = historyBeforeCurrent[i]!

      if (selectedMap.has(candidate.id)) {
        lastTimestamp = candidate.createdAt
        continue
      }

      // Check the 3-hour cutoff between consecutive channel messages
      if (lastTimestamp - candidate.createdAt > maxGapMs) {
        break
      }

      selectedMap.set(candidate.id, candidate)
      lastTimestamp = candidate.createdAt

      if (selectedMap.size >= maxMessages) {
        break
      }
    }
  }

  // Sort selected messages chronologically
  return Array.from(selectedMap.values()).sort((a, b) => a.createdAt - b.createdAt)
}

/**
 * Transforms an array of messages into a clean plaintext conversation:
 * - Authors mapped to "A", "B", "C", ... in order of appearance.
 * - Mentions (<@id> and @name) transformed into @A, @B, etc.
 * - Bare usernames / display names also translated into @A, @B, etc.
 */
export function formatConversation(messages: CachedMessage[]): string {
  if (messages.length === 0) {
    return ""
  }

  const authorIdToLetter = new Map<string, string>()
  const authorNames: { name: string; letter: string }[] = []
  const seenNameKeys = new Set<string>()
  let authorCount = 0

  // Assign letters in chronological order of appearance and collect all known names
  for (const msg of messages) {
    let letter = authorIdToLetter.get(msg.authorId)
    if (!letter) {
      letter = getAuthorLabel(authorCount++)
      authorIdToLetter.set(msg.authorId, letter)
    }

    const candidateNames = [
      msg.authorUsername,
      msg.authorDisplayName,
      msg.authorName,
    ].filter((n): n is string => Boolean(n && n.trim().length > 0))

    for (const rawName of candidateNames) {
      const trimmed = rawName.trim()
      const key = `${trimmed.toLowerCase()}:${letter}`
      if (!seenNameKeys.has(key)) {
        seenNameKeys.add(key)
        authorNames.push({ name: trimmed, letter })
      }
    }
  }

  // Sort known names by descending length so longer names match first
  authorNames.sort((a, b) => b.name.length - a.name.length)

  const formattedLines: string[] = []

  for (const msg of messages) {
    const authorLetter = authorIdToLetter.get(msg.authorId) ?? "Unknown"
    let content = msg.content

    // 1. Replace Discord mention tags: <@123456789> or <@!123456789>
    content = content.replace(/<@!?(\d+)>/g, (_, userId) => {
      const letter = authorIdToLetter.get(userId)
      return letter ? `@${letter}` : "@User"
    })

    // 2. Replace plaintext usernames/display names (with or without "@")
    for (const { name, letter } of authorNames) {
      const regex =
        name.length === 1
          ? new RegExp(`@${escapeRegex(name)}(?=\\W|$)`, "gi")
          : new RegExp(`(?:^|(?<=\\W))@?${escapeRegex(name)}(?=\\W|$)`, "gi")
      content = content.replace(regex, `@${letter}`)
    }

    formattedLines.push(`${authorLetter}: ${content.trim()}`)
  }

  return formattedLines.join("\n")
}

