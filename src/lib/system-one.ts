export type SystemOneChoiceQuestion<T extends string = string> = {
  type: "choice"
  instructions?: string
  criteria: Record<T, string>
}

export type SystemOneRequestBody<T extends string = string> = {
  model: string
  state: string
  questions: Record<string, SystemOneChoiceQuestion<T>>
}

export type SystemOneChoiceAnswer<T extends string = string> = {
  type: "choice"
  choice: T
  confidence: number
  probabilities: Record<T, number>
}

export type SystemOneResponseBody<T extends string = string> = {
  model: string
  answers: Record<string, SystemOneChoiceAnswer<T>>
  usage?: {
    input_tokens: number
    output_tokens: number
  }
}

export interface DecisionModelClient {
  askChoice<T extends string>(
    state: string,
    questionKey: string,
    criteria: Record<T, string>,
    instructions?: string
  ): Promise<SystemOneChoiceAnswer<T> | null>
}

export const isDebugEnabled = () => process.env.CHESS_RATING_DEBUG === "true"

export const debugLog = (...args: unknown[]) => {
  if (isDebugEnabled()) {
    console.log(...args)
  }
}

export abstract class BaseDecisionClient implements DecisionModelClient {
  protected readonly timeoutMs: number

  constructor(timeoutMs = 10_000) {
    this.timeoutMs = timeoutMs
  }

  protected abstract getUrl(): string
  protected abstract getHeaders(): Record<string, string>
  protected abstract getModelName(): string
  protected abstract validateConfig(): string | null

  /**
   * Prompts the decision model to evaluate a state string against a set of choice criteria.
   */
  async askChoice<T extends string>(
    state: string,
    questionKey: string,
    criteria: Record<T, string>,
    instructions?: string
  ): Promise<SystemOneChoiceAnswer<T> | null> {
    const configError = this.validateConfig()
    if (configError) {
      console.error(`[${this.constructor.name}] Configuration error: ${configError}`)
      return null
    }

    const questionObj: SystemOneChoiceQuestion<T> = {
      type: "choice",
      criteria,
      ...(instructions ? { instructions } : {}),
    }

    const payload: SystemOneRequestBody<T> = {
      model: this.getModelName(),
      state,
      questions: {
        [questionKey]: questionObj,
      },
    }

    const url = this.getUrl()
    try {
      debugLog(`[${this.constructor.name}] POST ${url} (model: ${this.getModelName()})`)
      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.timeoutMs),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "")
        console.error(`[${this.constructor.name}] Request failed (${response.status}): ${errorText}`)
        return null
      }

      const raw = await response.json()
      // Cloudflare envelopes results in { result: ... }, while standard System One returns answers at the root
      const data = (raw.result ?? raw) as SystemOneResponseBody<T>
      const answer = data.answers?.[questionKey]
      if (!answer) {
        console.warn(`[${this.constructor.name}] No answer found for question key "${questionKey}" in response.`)
        return null
      }

      return answer
    } catch (err) {
      console.error(`[${this.constructor.name}] Error calling API:`, err)
      return null
    }
  }
}

export type SystemOneConfig = {
  url?: string
  model?: string
  timeoutMs?: number
}

export class SystemOneClient extends BaseDecisionClient {
  private readonly configUrl?: string
  private readonly configModel?: string

  constructor(config?: SystemOneConfig) {
    super(config?.timeoutMs)
    this.configUrl = config?.url
    this.configModel = config?.model
  }

  protected validateConfig(): string | null {
    return null
  }

  protected getUrl(): string {
    return this.configUrl ?? process.env.SYSTEM_ONE_URL ?? "http://localhost:11435/v1/systemone"
  }

  protected getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
    }
  }

  protected getModelName(): string {
    return this.configModel ?? process.env.SYSTEM_ONE_MODEL ?? "laya:en"
  }
}

export type CloudflareClefConfig = {
  accountId?: string
  apiToken?: string
  url?: string
  model?: string
  timeoutMs?: number
}

export class CloudflareClefClient extends BaseDecisionClient {
  private readonly configAccountId?: string
  private readonly configApiToken?: string
  private readonly configUrl?: string
  private readonly configModel?: string

  constructor(config?: CloudflareClefConfig) {
    super(config?.timeoutMs)
    this.configAccountId = config?.accountId
    this.configApiToken = config?.apiToken
    this.configUrl = config?.url
    this.configModel = config?.model
  }

  private get accountId(): string | undefined {
    return this.configAccountId ?? process.env.CLOUDFLARE_ACCOUNT_ID
  }

  private get apiToken(): string | undefined {
    return this.configApiToken ?? process.env.CLOUDFLARE_API_TOKEN
  }

  private get customUrl(): string | undefined {
    return this.configUrl ?? process.env.CLOUDFLARE_CLEF_URL
  }

  protected validateConfig(): string | null {
    if (!this.customUrl && (!this.accountId || !this.apiToken)) {
      return "CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN must be set to use Cloudflare Clef"
    }
    return null
  }

  protected getUrl(): string {
    if (this.customUrl) {
      return this.customUrl
    }
    return `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run/@cf/cloudflare/clef`
  }

  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    const token = this.apiToken
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }
    return headers
  }

  protected getModelName(): string {
    return this.configModel ?? "clef"
  }
}

export const systemOneClient = new SystemOneClient()
export const cloudflareClefClient = new CloudflareClefClient()

/**
 * Returns the configured decision model client based on DECISION_PROVIDER or available credentials.
 */
export function getDecisionClient(): DecisionModelClient {
  const provider = process.env.DECISION_PROVIDER?.toLowerCase()
  if (provider === "cloudflare" || provider === "clef") {
    return cloudflareClefClient
  }
  if (provider === "systemone") {
    return systemOneClient
  }
  if (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN) {
    return cloudflareClefClient
  }
  return systemOneClient
}
