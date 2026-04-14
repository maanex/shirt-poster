import { KV } from "../lib/kv"
import { defineModule } from "../lib/module"


export type MessageMemory = {
	id: string,
	channelId: string,
	guildId: string,
	authorId: string,
	authorName: string,
	content: string,
	timestamp: number,
}

const memory = new Map<string, MessageMemory[]>()

export default defineModule({
  listeners: {
    messageCreate: async (msg) => {
      if (msg.channel.isDMBased())
        return
      if (!msg.guildId)
        return
      if (!msg.channel.permissionsFor(msg.guild!.roles.everyone)?.has('ViewChannel'))
        return

      const channelMemory = memory.get(msg.guildId) || []
      channelMemory.push({
        id: msg.id,
        channelId: msg.channel.id,
        guildId: msg.guild?.id || '',
        authorId: msg.author.id,
        authorName: msg.author.displayName || msg.author.username,
        content: msg.content,
        timestamp: Date.now()
      })
      memory.set(msg.guildId, channelMemory)

      const memorySize = KV.getInt('chat-history.length', {
        guild: BigInt(msg.guildId),
        default: 100
      })

      if (channelMemory.length > memorySize)
        channelMemory.shift()
      memory.set(msg.guildId, channelMemory)
    }
  }
})

export function getMessageMemoryFor(guildId: string): MessageMemory[] {
	return memory.get(guildId) || []
}
