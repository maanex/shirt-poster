import type { Message, TextBasedChannel } from "discord.js"
import type { CachedMessage } from "./types"

export class MessageCache {
  private readonly cache = new Map<string, CachedMessage[]>()
  private readonly maxPerChannel: number

  constructor(maxPerChannel = 50) {
    this.maxPerChannel = maxPerChannel
  }

  toCachedMessage(msg: Message): CachedMessage {
    const authorUsername = msg.author.username
    const authorDisplayName = msg.member?.displayName || msg.author.displayName || msg.author.username
    return {
      id: msg.id,
      channelId: msg.channelId,
      authorId: msg.author.id,
      authorUsername,
      authorDisplayName,
      authorName: authorDisplayName,
      content: msg.content,
      createdAt: msg.createdTimestamp,
      referenceMessageId: msg.reference?.messageId ?? undefined,
    }
  }

  add(msg: Message): CachedMessage {
    const cached = this.toCachedMessage(msg)
    const channelList = this.cache.get(msg.channelId) ?? []

    // Avoid duplicates
    const existingIndex = channelList.findIndex((m) => m.id === cached.id)
    if (existingIndex !== -1) {
      channelList[existingIndex] = cached
    } else {
      channelList.push(cached)
      if (channelList.length > this.maxPerChannel) {
        channelList.shift()
      }
    }

    this.cache.set(msg.channelId, channelList)
    return cached
  }

  getChannelMessages(channelId: string): CachedMessage[] {
    return this.cache.get(channelId) ?? []
  }

  /**
   * Ensures that referenced ancestors in a reply chain are present in the cache.
   * If an ancestor is not cached, it is fetched from Discord and inserted into the cache.
   */
  async ensureReplyChain(channel: TextBasedChannel, startMessage: CachedMessage, maxDepth = 10): Promise<void> {
    let current = startMessage
    let depth = 0

    while (current.referenceMessageId && depth < maxDepth) {
      const channelList = this.cache.get(current.channelId) ?? []
      const existing = channelList.find((m) => m.id === current.referenceMessageId)

      if (existing) {
        current = existing
        depth++
        continue
      }

      try {
        const fetched = await channel.messages.fetch(current.referenceMessageId)
        if (!fetched) break

        const cached = this.add(fetched)
        current = cached
        depth++
      } catch {
        // Message might be deleted or inaccessible
        break
      }
    }
  }
}

export const messageCache = new MessageCache(50)

