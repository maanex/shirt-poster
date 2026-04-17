import { EmojiRegex, SimpleEmailRegex } from "../lib/const"
import { defineModule } from "../lib/module"
import { pickOne } from "../lib/utils"


export default defineModule({
  listeners: {
    messageCreate: async (msg) => {
      if (msg.author.bot)
        return

      const lowercaseContent = msg.content.toLowerCase()

      if (msg.content.startsWith(`<@${msg.client.user?.id}>`)) {
        // direct talk
        const content = msg.content.slice(`<@${msg.client.user?.id}>`.length).trim().toLowerCase()
        if (!content.length) {
          msg.reply(`<@${msg.author.id}>`)
          return
        }

        if (content === 'redeem') {
          msg.reply(`lol, baited`)
          return
        }

        if (!content.includes('please')) {
          msg.reply(`you forgot to say "please"`)
          return
        }

        if (!content.includes('thank you') && !content.includes('thanks')) {
          msg.reply(`you forgot to say "thank you"`)
          return
        }

        if (!EmojiRegex.test(content)) {
          msg.reply(`you forgot to include an emoji`)
          return
        }

        if (!/[A-Z]/.test(msg.content)) { // using msg.content here because content is lowercased
          msg.reply(`your message must include at least one uppercase letter`)
          return
        }

        if (!/[a-z]/.test(content)) {
          msg.reply(`your message must include at least one lowercase letter`)
          return
        }

        if (!/[0-9]/.test(content)) {
          msg.reply(`your message must include at least one number`)
          return
        }

        if (!/\W/.test(content)) {
          msg.reply(`your message must include at least one special character`)
          return
        }

        if (!SimpleEmailRegex.test(content)) {
          msg.reply(`you forgot to include an email address`)
          return
        }

        if (!/[.!?]$/.test(content)) {
          msg.reply(`have some respect for punctuation and end your message with a proper sentence-ending punctuation mark!`)
          return
        }

        if (!content.includes('shirt')) {
          msg.reply(`do you even want to talk about shirts?`)
          return
        }

        msg.reply(`thank you for your message! I'll get back to you within 5-10 business days.`)
      }
      else if (msg.content.includes(`<@${msg.client.user?.id}>`)) {
        msg.reply(pickOne(
          '⚠️ Shirt Poster Bot mentioned!',
          '?',
          'Type "@Shirt Poster redeem" for a surprise!',
          `<@${msg.author.id}>`,
          '👕',
          'Why',
          'okay',
          'uhm',
          'out of office'
        ))
      }
      else if (lowercaseContent.includes('shirt poster')) {
        msg.reply('https://cdn.discordapp.com/attachments/975750923911581696/1494314798383628288/address-me.png')
      }
      else if (msg.reference) {
        const ref = await msg.fetchReference()
        if (ref.author.id === msg.client.user?.id) {
          if (lowercaseContent === 'why') {
            msg.reply(msg.author.avatarURL() ?? 'I can\'t hear you')
          }
          else if (lowercaseContent === 'please') {
            msg.reply([
              `IP Address: ${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
              `User Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${Math.floor(Math.random() * 100)}.0.${Math.floor(Math.random() * 1000)}.${Math.floor(Math.random() * 100)} Safari/537.36`,
              `Browser Version: 146.0.0.0`,
              `Latitude: ${(Math.random() * 180 - 90).toFixed(4)}`,
              `Longitude: ${(Math.random() * 360 - 180).toFixed(4)}`,
              `User Name: ${msg.author.username}`,
              `Created At: ${msg.author.createdAt.toISOString()}`,
              `Display Pixel Depth: 24`,
              `Available Sandbox Memory: 4096MB`,
              `Current Time UTC: ${new Date().toISOString()}`,
            ].join('\n'))
          }
        }
      }
    }
  }
})
