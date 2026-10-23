import { defineCordoConfig } from 'cordo/core'


export default defineCordoConfig({
  paths: {
    routes: './src/routes',
    types: './src/types/cordo.ts',
  },
  client: {
    id: process.env.DISCORD_CLIENT_ID,
    token: process.env.DISCORD_API_KEY,
  },
  functDefaultFlags: {
    run: {
      privateErrorMessage: true
    }
  }
})
