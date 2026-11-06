import { NextResponse } from "next/server"

const CANDIDATE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
]

const FALLBACK_SUGGESTIONS = [
  {
    time: "10:30 — 11:30",
    startTime: "10:30",
    endTime: "11:30",
    title: "Artisan Espresso & Morning Pastry Salon",
    description: "Sip single-origin espresso paired with warm cornetti at a quiet local piazza terrace.",
    location: "Old Town Historic District",
    duration: "1h",
    estimatedCost: "15",
    category: "Dining",
  },
  {
    time: "14:00 — 16:00",
    startTime: "14:00",
    endTime: "16:00",
    title: "Panoramic Coastal Cliffside Walk & Viewpoint",
    description: "Gentle scenic stroll along the elevated pine trails with breathtaking azure water views.",
    location: "Belvedere Scenic Overlook",
    duration: "2h",
    estimatedCost: "Free",
    category: "Sightseeing",
  },
  {
    time: "17:30 — 19:00",
    startTime: "17:30",
    endTime: "19:00",
    title: "Sunset Aperitivo at Terrace Lounge",
    description: "Chilled regional spritz with artisan olives and local cheeses as golden hour illuminates the sea.",
    location: "Cliffside Lounge",
    duration: "1.5h",
    estimatedCost: "35",
    category: "Culture & Nightlife",
  },
  {
    time: "20:00 — 22:30",
    startTime: "20:00",
    endTime: "22:30",
    title: "Intimate Trattoria Candlelit Dinner",
    description: "Hand-rolled pasta, freshly caught seafood, and local wine in a tucked-away stone courtyard.",
    location: "Piazza del Duomo",
    duration: "2.5h",
    estimatedCost: "75",
    category: "Dining",
  },
]

export async function POST(request: Request) {
  try {
    const { destination, dayTitle, existingActivities, currency = "USD" } = await request.json()
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey || apiKey === "your_gemini_api_key" || apiKey.includes("placeholder")) {
      const pick = { ...FALLBACK_SUGGESTIONS[Math.floor(Math.random() * FALLBACK_SUGGESTIONS.length)] }
      if (currency === "INR" && pick.estimatedCost !== "Free") {
        pick.estimatedCost = String(Number(pick.estimatedCost) * 20)
      } else if (currency === "JPY" && pick.estimatedCost !== "Free") {
        pick.estimatedCost = String(Number(pick.estimatedCost) * 120)
      }
      return NextResponse.json({ activity: pick, source: "curated_fallback" })
    }

    const currentTimes = (existingActivities || []).map((a: any) => `${a.time}: ${a.title} (${a.category})`).join(", ")

    const prompt = `You are ROVEO's Chief Travel Concierge.
Target Destination: "${destination || "Amalfi Coast, Italy"}"
Day Theme: "${dayTitle || "Exploration & Leisure"}"
Current Day Schedule: ${currentTimes || "No stops yet"}
Active Currency: ${currency}

Suggest ONE authentic, exquisite, non-generic travel activity for this day that fits into the itinerary naturally without colliding with existing times.
IMPORTANT ON PRICING: Provide a realistic, ground-truth local price in ${currency} (e.g. if currency is INR, realistic Indian prices like 150-1200; if USD/EUR, 10-60; if JPY, 1000-6000). Never overinflate costs.

Return ONLY raw valid JSON (no markdown fences, no extra text):
{
  "time": "15:00",
  "title": "Evocative experience title",
  "description": "1-2 sentences of sensory, inspiring description.",
  "location": "Specific authentic landmark, street, or quarter",
  "duration": "1.5h",
  "estimatedCost": "25",
  "category": "Sightseeing"
}
Categories must be one of: "Sightseeing", "Dining", "Stay", "Adventure", "Transport", "Culture & Nightlife", "Relaxation".
estimatedCost must be a numeric string (e.g. "25") or "Free". Do not include dollar or currency symbols in estimatedCost.`

    for (const model of CANDIDATE_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.6,
              maxOutputTokens: 600,
              responseMimeType: "application/json",
            },
          }),
        })

        if (!res.ok) continue

        const data = await res.json()
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (rawText) {
          const cleaned = rawText.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim()
          const parsed = JSON.parse(cleaned)
          if (parsed.title) {
            return NextResponse.json({
              activity: {
                id: `act-${Date.now()}`,
                time: parsed.time || "14:00",
                title: parsed.title,
                description: parsed.description || "Curated bespoke experience.",
                location: parsed.location || destination || "City Center",
                duration: parsed.duration || "1.5h",
                estimatedCost: parsed.estimatedCost ? String(parsed.estimatedCost).replace(/[^0-9.]/g, "") : "Free",
                category: parsed.category || "Sightseeing",
              },
              source: model,
            })
          }
        }
      } catch (e) {
        continue
      }
    }

    const pick = FALLBACK_SUGGESTIONS[Math.floor(Math.random() * FALLBACK_SUGGESTIONS.length)]
    return NextResponse.json({
      activity: {
        id: `act-${Date.now()}`,
        ...pick,
      },
      source: "curated_fallback",
    })
  } catch (error: any) {
    const pick = FALLBACK_SUGGESTIONS[0]
    return NextResponse.json({
      activity: {
        id: `act-${Date.now()}`,
        ...pick,
      },
      source: "curated_fallback",
    })
  }
}

