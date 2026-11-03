/**
 * AERIS Resilient Gemini Client
 * Executes requests against Google Gemini API with multi-model fallback:
 * 1. gemini-2.5-flash
 * 2. gemini-3.5-flash-lite
 * 3. gemini-3.1-flash-lite
 * 4. gemini-3.5-flash
 * 5. gemini-3.8-flash
 */

const CANDIDATE_MODELS = [
  "gemini-2.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.8-flash",
]

export interface GeminiCallParams {
  systemPrompt: string
  userMessage?: string
  history?: Array<{ role: "user" | "model"; text: string }>
  responseMimeType?: "application/json" | "text/plain"
  temperature?: number
  maxOutputTokens?: number
  timeoutMs?: number
  overrideKey?: string
}

export interface GeminiCallResult {
  text: string
  modelUsed: string
  status: number
}

export async function callGemini(params: GeminiCallParams): Promise<GeminiCallResult> {
  const {
    systemPrompt,
    userMessage,
    history = [],
    responseMimeType = "text/plain",
    temperature = 0.7,
    maxOutputTokens = 4000,
    timeoutMs = 15000,
    overrideKey,
  } = params

  const apiKey = overrideKey || process.env.GEMINI_API_KEY || ""

  if (!apiKey || apiKey === "your_gemini_api_key" || apiKey.includes("placeholder")) {
    throw new Error("Gemini API key is not configured. Set GEMINI_API_KEY in server environment.")
  }

  // Format contents for Gemini REST API
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = []

  // Add conversation history if provided
  for (const h of history) {
    contents.push({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.text }],
    })
  }

  // Combine system prompt and current message
  const promptText = userMessage ? `${systemPrompt}\n\nUser Message: ${userMessage}` : systemPrompt
  contents.push({
    role: "user",
    parts: [{ text: promptText }],
  })

  let lastError: { status: number; message: string } | null = null

  for (const model of CANDIDATE_MODELS) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature,
            maxOutputTokens,
            ...(responseMimeType === "application/json" ? { responseMimeType } : {}),
          },
        }),
      }).finally(() => clearTimeout(timer))

      if (res.ok) {
        const data = await res.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ""
        if (text) {
          return {
            text,
            modelUsed: model,
            status: 200,
          }
        }
      } else {
        const status = res.status
        const errJson = await res.json().catch(() => null)
        const errMsg = errJson?.error?.message || res.statusText || "Gemini Error"
        lastError = { status, message: errMsg }

        // If key is invalid, break immediately
        if (status === 400 || status === 401 || status === 403) {
          throw new Error(`Authentication error (${status}): ${errMsg}`)
        }

        // 404 (model deprecated), 429 (rate limit), 503 (high demand) -> continue to next model
        if (status === 404 || status === 429 || status === 503) {
          continue
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        lastError = { status: 504, message: `Model ${model} timed out after ${timeoutMs}ms.` }
      } else if (err.message && err.message.includes("Authentication error")) {
        throw err
      } else {
        lastError = { status: 500, message: err.message || "Network error" }
      }
    }
  }

  throw new Error(lastError?.message || "All candidate Gemini models were unavailable.")
}

