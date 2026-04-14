import { ApplicationCommandOptionType, ApplicationIntegrationType, InteractionContextType } from 'discord.js'

/* eslint-disable no-console */
const axios = require('axios')

const token = process.env.DISCORD_API_KEY
const clientid = process.env.CLIENT_ID

const commands = [
  {
    name: 'kv',
    description: 'Update KV config',
    integration_types: [ ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall ],
    contexts: [ InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel ],
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: 'key',
        description: 'Key',
        required: true
      },
      {
        type: ApplicationCommandOptionType.String,
        name: 'value',
        description: 'Value',
        required: false
      },
      {
        type: ApplicationCommandOptionType.Boolean,
        name: 'global',
        description: 'If not this will only affect this guild',
        required: false
      }
    ]
  },
]

async function run(remove = true, add = true, whitelist) {
  const opts = {
    headers: { Authorization: `Bot ${token}` }
  }

  const { data } = await axios.get(`https://discord.com/api/v8/applications/${clientid}/commands`, opts)

  if (remove) {
    await Promise.all(data
      .filter(d => !whitelist || whitelist.includes(d.name))
      .map(d => axios.delete(`https://discord.com/api/v8/applications/${clientid}/commands/${d.id}`, opts))
    )
  }

  let delay = 0
  if (add) {
    for (const command of commands) {
      if (whitelist && !whitelist.includes(command.name)) continue
      setTimeout(() => {
        axios
          .post(`https://discord.com/api/v8/applications/${clientid}/commands`, command, opts)
          .catch(err => console.error(err.response.status, command.name, JSON.stringify(err.response.data, null, 2)))
        console.log('Registered command %s', command.name)
      }, delay += 1000)
    }
    setTimeout(() => console.log('Done.'), delay + 100)
  }
}
run(false, true)
// run(true, false, [ 'vote' ])