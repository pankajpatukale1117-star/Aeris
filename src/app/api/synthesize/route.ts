import { NextResponse } from "next/server"

export interface Stop {
  slot: string
  title: string
  note: string
  dist: string
  reserved: boolean
}

export interface DayPlan {
  day: number
  theme: string
  stops: Stop[]
}

export interface SynthesizedItinerary {
  chatReply?: string
  hasItineraryUpdate?: boolean
  name: string
  region: string
  category: "Culture" | "Beach" | "Adventure" | "City" | "Nature" | string
  rating: number
  duration: string
  budgetMin: number
  budgetMax: number
  dailyCost: number
  season: string
  description: string
  highlights: string[]
  prepList: string[]
  costBreakdown: [number, number, number, number] // Stays, Food, Experiences, Transit
  days: DayPlan[]
}

function cleanAndParseGeminiResponse(rawText: string): {
  chatReply: string
  hasItineraryUpdate: boolean
  itinerary?: any
} {
  try {
    // 1. Strip markdown code fences if present
    const cleaned = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim()
    const parsed = JSON.parse(cleaned)
    return {
      chatReply: parsed.chatReply || parsed.reply || "Your journey has been tailored to your preferences.",
      hasItineraryUpdate: parsed.hasItineraryUpdate !== false && Boolean(parsed.days || parsed.name),
      itinerary: parsed,
    }
  } catch {
    // 2. Regex fallback extraction if there's leading/trailing conversational text
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          chatReply: parsed.chatReply || parsed.reply || "Your journey has been tailored.",
          hasItineraryUpdate: parsed.hasItineraryUpdate !== false && Boolean(parsed.days || parsed.name),
          itinerary: parsed,
        }
      } catch {}
    }
    // 3. Fallback: conversational text without itinerary mutation
    return {
      chatReply: rawText.replace(/```/g, "").trim(),
      hasItineraryUpdate: false,
    }
  }
}

function validateItinerary(data: any): SynthesizedItinerary | null {
  if (!data || typeof data !== "object") return null
  const name = typeof data.name === "string" && data.name.trim() ? data.name.trim() : ""
  if (!name) return null

  if (!Array.isArray(data.days) || data.days.length === 0) return null

  const validatedDays: DayPlan[] = []
  for (let i = 0; i < data.days.length; i++) {
    const d = data.days[i]
    if (!d || typeof d !== "object") return null
    const dayNum = Number(d.day) || i + 1
    const theme = typeof d.theme === "string" && d.theme.trim() ? d.theme.trim() : `Day ${dayNum} Exploration`
    if (!Array.isArray(d.stops) || d.stops.length === 0) return null

    const validatedStops: Stop[] = []
    for (const s of d.stops) {
      if (!s || typeof s !== "object") continue
      const title = typeof s.title === "string" ? s.title.trim() : ""
      if (!title) continue
      validatedStops.push({
        slot: typeof s.slot === "string" && s.slot.trim() ? s.slot.trim() : "Daytime",
        title,
        note: typeof s.note === "string" ? s.note.trim() : "",
        dist: typeof s.dist === "string" && s.dist.trim() ? s.dist.trim() : "Local transit",
        reserved: Boolean(s.reserved),
      })
    }

    if (validatedStops.length === 0) return null
    validatedDays.push({
      day: dayNum,
      theme,
      stops: validatedStops,
    })
  }

  const costBreakdown: [number, number, number, number] =
    Array.isArray(data.costBreakdown) && data.costBreakdown.length === 4
      ? [
          Number(data.costBreakdown[0]) || 45,
          Number(data.costBreakdown[1]) || 25,
          Number(data.costBreakdown[2]) || 20,
          Number(data.costBreakdown[3]) || 10,
        ]
      : [45, 25, 20, 10]

  return {
    name,
    region: typeof data.region === "string" ? data.region.trim() : "Global Sanctuary",
    category: typeof data.category === "string" ? data.category.trim() : "Nature & Culture",
    rating: Number(data.rating) || 4.9,
    duration: typeof data.duration === "string" ? data.duration.trim() : `${validatedDays.length} days`,
    budgetMin: Number(data.budgetMin) || 80,
    budgetMax: Number(data.budgetMax) || 200,
    dailyCost: Number(data.dailyCost) || 120,
    season: typeof data.season === "string" ? data.season.trim() : "Peak Travel Season",
    description:
      typeof data.description === "string" && data.description.trim()
        ? data.description.trim()
        : `An art-directed circadian journey across ${name}.`,
    highlights:
      Array.isArray(data.highlights) && data.highlights.length > 0
        ? data.highlights.map(String)
        : [`Scenic viewpoints of ${name}`],
    prepList:
      Array.isArray(data.prepList) && data.prepList.length > 0
        ? data.prepList.map(String)
        : ["Pack comfortable walking shoes", "Check local weather before transit"],
    costBreakdown,
    days: validatedDays,
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      prompt,
      message,
      destination = "Mahabaleshwar, Maharashtra",
      days = 3,
      travelers = 2,
      budget = "Moderate",
      pace = "Balanced",
      lens = "Nature and sightseeing",
      currency = "USD",
      apiKey: clientKey,
      context,
      currentItinerary,
      history = [],
    } = body

    const userMessage = (message || prompt || destination || "Mahabaleshwar, Maharashtra").trim()
    const activeItinerary: SynthesizedItinerary | null = currentItinerary || context || null

    // 1. Secure API Key Resolution: custom client override key if specified, otherwise server env
    const headerKey = request.headers.get("x-gemini-key")
    const customKey =
      (clientKey && clientKey.trim() && !clientKey.includes("placeholder") ? clientKey.trim() : null) ||
      (headerKey && headerKey.trim() && !headerKey.includes("placeholder") ? headerKey.trim() : null)
    const activeKey = customKey || process.env.GEMINI_API_KEY || ""

    if (!activeKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Gemini API key is not configured. Please set GEMINI_API_KEY in your server environment (.env.local).",
        },
        { status: 401 }
      )
    }

    const durationDays = Math.max(1, Math.min(14, Number(days) || (activeItinerary?.days?.length || 3)))

    // 2. Build High-Fidelity Concierge Prompt with Strict Quality Guidelines
    const systemPrompt = `You are the Principal Travel Curator and Chief Itinerary Architect for AERIS, an ultra-luxury AI travel concierge.
Your task is to synthesize a genuine, deeply personalized, realistic day-by-day travel itinerary.

INPUT PARAMETERS:
- Destination: ${destination}
- Duration: ${durationDays} days
- Travelers: ${travelers}
- Budget Tier / Style: ${budget}
- Preferred Pace: ${pace} (e.g. Relaxed: 2 stops/day; Balanced: 3 stops/day; Intensive: 4 stops/day)
- Focus Lens / Interests: ${lens}
- Currency: ${currency}
- Specific User Request: "${userMessage}"
${activeItinerary ? `- Previous Active Itinerary: ${activeItinerary.name} (${activeItinerary.duration})` : ""}
${history && history.length > 0 ? `- Recent Conversation Context: ${JSON.stringify(history.slice(-4))}` : ""}

CRITICAL CURATION & QUALITY GUIDELINES:
1. Deep Regional Specificity:
   - Identify the exact geographic location (whether a global metropolis, a regional district, or an offbeat hill station / village like Mahabaleshwar, Maharashtra).
   - Name authentic, real-world viewpoints, hiking trails, heritage sites, sacred shrines, scenic valleys, and local culinary specialties (e.g., for Mahabaleshwar: Arthur's Seat, Wilson/Sunrise Point, Kate's Point, Lodwick Point, Elephant's Head Point, Lingmala Waterfalls, Old Mahabaleshwar/Panchganga Temple, Venna Lake, Mapro Garden strawberry plantations & fresh cream).
   - NEVER use generic filler like "Explore local shops", "Visit a museum", or "Dine at a restaurant". Name specific places, local markets, or authentic street food corridors.

2. Distinct & Circadian-Logical Daily Plans:
   - Each day must have a unique editorial theme and completely distinct activities from the other days.
   - Organize activities chronologically: Morning (08:30–09:00), Afternoon (13:00–13:30), Twilight/Evening (17:30–19:00).
   - Ensure realistic geographic sequencing to avoid impossible backtracking along mountain roads or busy city corridors.

3. Truthful & Practical Grounding:
   - Provide practical navigation advice (e.g., ghat road transit, walking footwear, seasonal weather).
   - NEVER invent fake confirmed availability, guaranteed table reservations, or fake fixed prices. Frame budgets and timings as realistic estimates.

4. Intelligent Routing Protocol:
   - If the user asks a purely conversational travel question (e.g., "What should I pack?", "When is monsoon season?"), provide an insightful answer in "chatReply", set "hasItineraryUpdate": false, and do not regenerate the full itinerary.
   - If the user requests a new trip or modifications ("make day 2 less walking", "add more nature"), acknowledge the request warmly in "chatReply", set "hasItineraryUpdate": true, and provide the complete updated itinerary.

RETURN FORMAT:
You MUST respond with ONLY a valid, parseable JSON object matching this schema. Do NOT include markdown code blocks (\`\`\`json).
{
  "chatReply": "Warm, articulate, insider concierge narrative explaining the curated flow.",
  "hasItineraryUpdate": true,
  "name": "${destination}",
  "region": "State / District, Country",
  "category": "Nature | Culture | Beach | Adventure | City",
  "rating": 4.9,
  "duration": "${durationDays} days",
  "budgetMin": 80,
  "budgetMax": 180,
  "dailyCost": 120,
  "season": "Best travel months",
  "description": "2-3 sentences of evocative editorial prose capturing the destination's atmospheric essence, terrain, and spirit.",
  "highlights": ["Authentic Highlight 1", "Authentic Highlight 2", "Authentic Highlight 3", "Authentic Highlight 4"],
  "prepList": ["Practical transit/nav tip", "Seasonal clothing advice", "Local etiquette or permits", "Insider secret"],
  "costBreakdown": [45, 25, 20, 10], // Stays, Gastronomy, Experiences, Transit (must sum to 100)
  "days": [
    {
      "day": 1,
      "theme": "Editorial theme for Day 1",
      "stops": [
        {
          "slot": "Morning • 08:30",
          "title": "Exact Landmark or Trail Name",
          "note": "Insider context, sunrise light tip, or cultural note",
          "dist": "Transit / walk indicator",
          "reserved": false
        },
        {
          "slot": "Afternoon • 13:00",
          "title": "Exact Dining or Heritage Stop",
          "note": "Specific local culinary dish or architectural highlight",
          "dist": "Transit / walk indicator",
          "reserved": false
        },
        {
          "slot": "Twilight • 17:30",
          "title": "Sunset Viewpoint or Evening Stroll",
          "note": "Golden hour perspective and dusk ambiance",
          "dist": "Transit / walk indicator",
          "reserved": false
        }
      ]
    }
  ]
}`

    // 3. Multi-Model Flash Strategy (Try Gemini 2.5 Flash first, then available Flash models)
    const candidateModels = [
      "gemini-2.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
      "gemini-3.5-flash",
      "gemini-3.8-flash",
    ]

    let lastError: { status: number; message: string } | null = null

    for (const model of candidateModels) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 18000)

      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(activeKey)}`

        const geminiRes = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: systemPrompt }],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.7,
              maxOutputTokens: 6000,
            },
          }),
        }).finally(() => clearTimeout(timeoutId))

        if (geminiRes.ok) {
          const data = await geminiRes.json()
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || ""
          if (rawText) {
            const parsed = cleanAndParseGeminiResponse(rawText)

            // Pure conversational advisory query
            if (!parsed.hasItineraryUpdate) {
              return NextResponse.json({
                success: true,
                source: model,
                hasItineraryUpdate: false,
                chatReply: parsed.chatReply,
                itinerary: activeItinerary,
              })
            }

            // Itinerary generation / mutation: validate structure strictly
            const validatedItinerary = validateItinerary(parsed.itinerary)
            if (validatedItinerary) {
              return NextResponse.json({
                success: true,
                source: model,
                hasItineraryUpdate: true,
                chatReply: parsed.chatReply,
                itinerary: {
                  ...activeItinerary,
                  ...validatedItinerary,
                  chatReply: parsed.chatReply,
                },
              })
            }
          }
        } else {
          const status = geminiRes.status
          const errorBody = await geminiRes.json().catch(() => null)
          const errorMsg = errorBody?.error?.message || geminiRes.statusText || "Gemini API error"
          lastError = { status, message: errorMsg }

          // If model is deprecated or not found (404), seamlessly proceed to next flash model
          if (status === 404) {
            continue
          }

          // If quota exceeded (429) or high demand (503), try next available flash model
          if (status === 429 || status === 503) {
            continue
          }

          // If invalid API key (400, 401, 403), stop immediately and return auth error
          if (status === 400 || status === 401 || status === 403) {
            break
          }
        }
      } catch (err: any) {
        lastError = {
          status: 504,
          message: err?.name === "AbortError" ? "Request timed out waiting for Gemini response." : (err?.message || "Network error"),
        }
      }
    }

    // 4. Return Genuine Error Response (Never Silent Mock / Fake Success)
    if (lastError?.status === 429) {
      return NextResponse.json(
        {
          success: false,
          error: "Gemini API free tier quota exceeded. Please wait a moment before requesting another itinerary or check your Google AI Studio quota.",
        },
        { status: 429 }
      )
    }

    if (lastError?.status === 503) {
      return NextResponse.json(
        {
          success: false,
          error: "Google Gemini is temporarily experiencing high demand. Please retry in a few moments.",
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: lastError?.message || "Failed to synthesize itinerary with Google Gemini API. Please check your prompt and retry.",
      },
      { status: lastError?.status && lastError.status >= 400 ? lastError.status : 502 }
    )
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "An unexpected server error occurred during synthesis.",
      },
      { status: 500 }
    )
  }
}
