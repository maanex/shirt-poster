declare global {
  namespace NodeJS {
    interface ProcessEnv {
      POSTGRES_URL?: string
      DISCORD_CLIENT_ID: string
      DISCORD_API_KEY: string
      SYSTEM_ONE_URL?: string
      SYSTEM_ONE_MODEL?: string
      CLOUDFLARE_ACCOUNT_ID?: string
      CLOUDFLARE_API_TOKEN?: string
      CLOUDFLARE_CLEF_URL?: string
      DECISION_PROVIDER?: "systemone" | "cloudflare" | "clef"
      CHESS_RATING_DEBUG?: string
    }
  }
}

export {}
