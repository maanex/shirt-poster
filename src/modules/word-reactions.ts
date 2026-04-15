import { defineModule } from "../lib/module"

const mapping = {
  'sus 🤨': /(?:(?:^|\s)sus\S)|(?:\Ssus(?:\S|$))/i
}

export default defineModule({
  listeners: {
    messageCreate: async (msg) => {
      if (msg.author.bot)
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
