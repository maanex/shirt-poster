export type SystemOneChoiceQuestion<T extends string = string> = {
  type: "choice"
  instructions?: string
  question?: string
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

export type SystemOneConfig = {
  url?: string
  model?: string
  timeoutMs?: number
}

export class SystemOneClient {
  private readonly url: string
  private readonly model: string
  private readonly timeoutMs: number

  constructor(config?: SystemOneConfig) {
    this.url = config?.url ?? process.env.SYSTEM_ONE_URL ?? "http://localhost:11435/v1/systemone"
    this.model = config?.model ?? process.env.SYSTEM_ONE_MODEL ?? "laya:en"
    this.timeoutMs = config?.timeoutMs ?? 10_000
  }

  /**
   * Prompts System One to evaluate a state string against a set of choice criteria.
   */
  async askChoice<T extends string>(
    state: string,
    questionKey: string,
    criteria: Record<T, string>,
    instructions?: string
  ): Promise<SystemOneChoiceAnswer<T> | null> {
    const questionObj: SystemOneChoiceQuestion<T> = {
      type: "choice",
      criteria,
      ...(instructions ? { instructions, question: instructions } : {}),
    }

    const payload: SystemOneRequestBody<T> = {
      model: this.model,
      state,
      questions: {
        [questionKey]: questionObj,
      },
    }

    try {
      console.log(`[SystemOne] POST ${this.url} (model: ${this.model})`)
      const response = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.timeoutMs),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "")
        console.error(`[SystemOne] Request failed (${response.status}): ${errorText}`)
        return null
      }

      const data = (await response.json()) as SystemOneResponseBody<T>
      const answer = data.answers?.[questionKey]
      if (!answer) {
        console.warn(`[SystemOne] No answer found for question key "${questionKey}" in response.`)
        return null
      }

      return answer
    } catch (err) {
      console.error("[SystemOne] Error calling System One API:", err)
      return null
    }
  }
}

export const systemOneClient = new SystemOneClient()

