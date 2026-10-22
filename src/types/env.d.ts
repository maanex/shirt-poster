declare global {
  namespace NodeJS {
    interface ProcessEnv {
      POSTGRES_URL?: string
      DISCORD_CLIENT_ID: string
      DISCORD_API_KEY: string
      SYSTEM_ONE_URL?: string
      SYSTEM_ONE_MODEL?: string
    }
  }
}

export {}
