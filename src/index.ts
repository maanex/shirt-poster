import { Cordo } from "cordo/core"
import { Client, Events, GatewayIntentBits } from "discord.js"
import { KV } from "./lib/kv"
import { moduleList } from "./lib/module-list"

// Load KV config
await KV.load()

// Mount cordo
await Cordo.mountCordo({
  client: {
    id: process.env.CLIENT_ID as string,
  },
})

// Create Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
})

client.on(Events.Raw, event => {
  if (event.t === 'INTERACTION_CREATE')
    Cordo.triggerInteraction(event.d)
})

moduleList.forEach(module => {
  module.onInit?.({ client })
  for (const [ event, listener ] of Object.entries(module.listeners ?? {}))
    client.on(event, listener as any)
})

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user?.tag}`)
  moduleList.forEach(module => module.onReady?.({ client: client as Client<true> }))
})

client.login(process.env.DISCORD_API_KEY)

