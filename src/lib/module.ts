import type { Client, ClientEvents } from "discord.js"


export type Module = {
  /** when we start up, before the client is logged in */
  onInit?(opts: { client: Client<boolean> }): any
  /** once the client is logged in */
  onReady?(opts: { client: Client<true> }): any
  /** listen to any event discord.js exposes */
  listeners?: {
    [K in keyof ClientEvents]?: (...data: ClientEvents[K]) => Promise<void>
  }
  /**  */
  hooks?: Record<string, {
    
  }>
}

export function defineModule(module: Module) {
  return module
}
