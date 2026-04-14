import { defineCordoConfig } from 'cordo/core'


export default defineCordoConfig({
  typeDest: './src/types/cordo.ts',
  rootDir: './src',
  client: {
    id: process.env.DISCORD_CLIENT_ID,
  },
  functDefaultFlags: {
    run: {
      privateErrorMessage: true
    }
  }
})
