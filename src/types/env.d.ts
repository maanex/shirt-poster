
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      POSTGRES_URL?: string
      DISCORD_CLIENT_ID: string
      DISCORD_API_KEY: string
    }
  }
}