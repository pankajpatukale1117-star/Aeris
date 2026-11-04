import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { message, currentItinerary } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey || apiKey === "your_gemini_api_key" || apiKey.includes("placeholder")) {
      return NextResponse.json(
        { error: "Gemini API key is not configured. Please set GEMINI_API_KEY in .env.local." },
        { status: 401 }
      )
    }

    const prompt = `You are ROVEO's senior travel concierge and destination specialist.
The user is currently reviewing this trip: "${currentItinerary?.title || currentItinerary?.name || "Custom Itinerary"}" in "${currentItinerary?.destination || currentItinerary?.region || "the destination"}".
User question/modification request: "${message}"

Provide a warm, expert, concise response (2-3 paragraphs max). If the user asked to modify the itinerary (e.g., make it cheaper, add adventure, change pace), explain specifically what adjustments you recommend.`

    const models = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-3.8-flash"]
    let lastError: any = null

    for (const m of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(apiKey)}`
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2000,
            },
          }),
        })

        if (res.ok) {
          const data = await res.json()
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) {
            return NextResponse.json({ reply: text.trim(), source: m })
          }
        } else {
          const status = res.status
          const errData = await res.json().catch(() => null)
          lastError = { status, message: errData?.error?.message || res.statusText }
          if (status === 404 || status === 429 || status === 503) continue
        }
      } catch (err: any) {
        lastError = { status: 500, message: err.message }
      }
    }

    return NextResponse.json(
      { error: lastError?.message || "Failed to generate chat reply with Gemini API." },
      { status: lastError?.status && lastError.status >= 400 ? lastError.status : 502 }
    )
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process chat" }, { status: 500 })
  }
}
