import { defineModule } from "../lib/module"

const mapping = {
  'sus 🤨': /(?:(?:^|\s)sus\S)|(?:\Ssus(?:\S|$))/i,
  'think!': /(?:^|\s)think(?:\s|$)/i,
  'you\'re are': /you.{1,2}re/i,
  'you\'re welcome': /thanks|thank you|thx|ty|tysm/i,
  'Follow me on soundcloud!': /spotify|apple music|youtube music|deezer|tidal/i,
  '🤑': /\d+\$/i,
  'reference detected!!': /(?:(?:^|\s)referenc(?:\s|$))|(?:\Sreferenc(?:\S|$))/i,
  'hello': /(?:^|\W)hi(?:\W|$)/i,
  '🤨': /🤨|shirt/i,
}

export default defineModule({
  listeners: {
    messageCreate: async (msg) => {
      if (msg.author.bot)
        return

      if (Math.random() > 0.01)
        return

      for (const [ word, regex ] of Object.entries(mapping)) {
        if (regex.test(msg.content)) {
          msg.reply(word)
          break
        }
      }
    }
  }
})
