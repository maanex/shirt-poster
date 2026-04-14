import { button, enforcePrivateResponse, text } from "cordo/components"
import { defineCordoRoute } from "cordo/core"
import { KV } from "../../lib/kv"


export default defineCordoRoute(i => {
  if (i.source !== 'command')
    return i.ack()

  const { key, value, global } = (i.command.options ?? {}) as { key?: string, value?: string, global?: boolean }
  if (!key) {
    return i.render(
      text('Key missing...'),
      enforcePrivateResponse()
    )
  }

  if (i.location !== 'guild' && !global) {
    return i.render(
      text('Guild-specific keys can only be set in a guild. Use the "global" option to set global keys.'),
      enforcePrivateResponse()
    )
  }

  if (key === 'GET' && value === 'ADMIN') {
    const initialAdminClaimed = KV.get('initial-admin')
    if (!initialAdminClaimed && global) {
      KV.set('initial-admin', i.user.id)
      KV.set(`user.${i.user.id}.admin`, 'true')
      return i.render(
        text('You now admin. Good job.'),
        enforcePrivateResponse()
      )
    } else if (!global) {
      return i.render(
        text('You fogor something...'),
        enforcePrivateResponse()
      )
    } else {
      return i.render(
        text('Bla' + ' bla'.repeat(Math.floor(Math.random() * 30))),
        enforcePrivateResponse()
      )
    }
  }

  const guild = global
    ? undefined
    : i.location === 'guild'
      ? BigInt(i.guild.id)
      : null
  if (guild === null) // just to be sure lol
    return i.ack()

  const userAdmin = KV.getBool(`user.${i.user.id}.admin`, { default: false, guild })
  if (!userAdmin) {
    return i.render(
      text('You do not have permission to use this command.'),
      button().label('click me'), // for the fun of it (doesnt do anything)
      enforcePrivateResponse()
    )
  }

  if (value === undefined) {
    const currentValueGuild = guild ? KV.get(key.toLowerCase(), { guild }) : null
    const currentValueGlobal = KV.get(key.toLowerCase())
    return i.render(
      text(`(guild)${key}=${currentValueGuild}\n(global)${key}=${currentValueGlobal}`)
        .codeBlock(),
      enforcePrivateResponse()
    )
  }

  const setValue = value === 'null' ? null : String(value)
  KV.set(key.toLowerCase(), setValue, { guild })
  return i.render(
    text(`✅ Set key "${key}" to "${setValue}" ${global ? 'globally' : `for this guild`}.`),
    enforcePrivateResponse()
  )
})
