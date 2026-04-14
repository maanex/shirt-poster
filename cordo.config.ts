import { defineCordoConfig } from 'cordo/core'


export default defineCordoConfig({
  typeDest: './src/types/cordo.ts',
  rootDir: './src',
  client: {
    id: process.env.CLIENT_ID,
  },
  functDefaultFlags: {
    run: {
      privateErrorMessage: true
    }
  }
})
