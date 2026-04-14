import { defineModule } from "../lib/module"

const mapping = {
  'sus 🤨': /(?:^|\w)sus(?:\w|$)/i
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
