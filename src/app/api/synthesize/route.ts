import { NextResponse } from "next/server"

interface Stop {
  slot: string
  title: string
  note: string
  dist: string
  reserved: boolean
}

interface DayPlan {
  day: number
  theme: string
  stops: Stop[]
}

export interface SynthesizedItinerary {
  name: string
  region: string
  category: "Culture" | "Beach" | "Adventure" | "City"
  rating: number
  duration: string
  budgetMin: number
  budgetMax: number
  dailyCost: number
  season: string
  description: string
  highlights: string[]
  prepList: string[]
  costBreakdown: [number, number, number, number] // Boutique Stays, Gastronomy, Private Access, Transit
  days: DayPlan[]
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      destination = "Kyoto, Japan",
      days = 5,
      pace = "Balanced",
      lens = "Architectural & Cultural Gems",
      apiKey: clientKey,
    } = body

    // 1. Resolve API Key from Header, Body, or Environment
    const headerKey = request.headers.get("x-gemini-key")
    const activeKey =
      clientKey ||
      headerKey ||
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      ""

    const durationDays = Math.max(1, Math.min(14, Number(days) || 5))

    // 2. If valid Gemini API key present, execute live call
    if (activeKey && !activeKey.includes("placeholder") && activeKey.length > 15) {
      try {
        const systemPrompt = `You are ROVEO's elite international travel concierge AI. Generate a bespoke, highly sophisticated, circadian travel itinerary in strict JSON format.
Destination: ${destination}
Duration: ${durationDays} days
Circadian Pace: ${pace} (Slow & Zen / Balanced / High Pulse)
Curatorial Lens: ${lens} (Architectural & Cultural Gems / Gastronomy & Hidden Salons / Coastal & Nature Sanctuary / Private Concierge Luxury)

Return a strict JSON object with this exact schema:
{
  "name": "City Name",
  "region": "Region, Country",
  "category": "Culture | Beach | Adventure | City",
  "rating": 4.9,
  "duration": "${durationDays} days",
  "budgetMin": 150,
  "budgetMax": 350,
  "dailyCost": 220,
  "season": "Best months to visit",
  "description": "2-3 sentences of art-directed editorial prose capturing the essence of the journey.",
  "highlights": ["Highlight 1", "Highlight 2", "Highlight 3", "Highlight 4"],
  "prepList": ["Concierge prep item 1", "Concierge prep item 2", "Concierge prep item 3", "Concierge prep item 4"],
  "costBreakdown": [45, 30, 15, 10],
  "days": [
    {
      "day": 1,
      "theme": "Editorial theme for Day 1",
      "stops": [
        { "slot": "Morning • 08:30", "title": "Specific authentic landmark or venue", "note": "Insider concierge tip with circadian nuance", "dist": "8 min walk", "reserved": true },
        { "slot": "Afternoon • 13:30", "title": "Bespoke culinary or cultural stop", "note": "Insider recommendation", "dist": "14 min transit", "reserved": false },
        { "slot": "Twilight • 19:00", "title": "Evening salon, dining, or twilight viewpoint", "note": "Golden hour atmosphere tip", "dist": "10 min walk", "reserved": true }
      ]
    }
  ]
}`

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(activeKey)}`

        const geminiRes = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
              maxOutputTokens: 4096,
            },
          }),
        })

        if (geminiRes.ok) {
          const data = await geminiRes.json()
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || ""
          if (rawText) {
            const clean = rawText.replace(/```json/g, "").replace(/```/g, "").trim()
            const parsed: SynthesizedItinerary = JSON.parse(clean)
            return NextResponse.json({
              success: true,
              source: "gemini-2.5-flash",
              itinerary: parsed,
            })
          }
        } else {
          console.warn("Gemini 2.5 Flash status not ok:", geminiRes.status, await geminiRes.text())
        }
      } catch (geminiError) {
        console.warn("Gemini API call failed, deploying resilient editorial fallback:", geminiError)
      }
    }

    // 3. Graceful Resilient Fallback: Built-in Curated Sanctuary
    const fallback = generateEditorialSanctuaryFallback(destination, durationDays, pace, lens)
    return NextResponse.json({
      success: true,
      source: "curated-sanctuary-fallback",
      itinerary: fallback,
    })
  } catch (error: any) {
    console.error("Synthesize API Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to synthesize itinerary.",
      },
      { status: 500 }
    )
  }
}

function generateEditorialSanctuaryFallback(
  destination: string,
  days: number,
  pace: string,
  lens: string
): SynthesizedItinerary {
  const cityName = destination.split(",")[0].trim()
  const country = destination.includes(",") ? destination.split(",")[1].trim() : "Global Sanctuary"

  const dayThemes = [
    "Arrival into Quietude & Archival Textures",
    "Ancient Stone, Waterways & Hidden Courtyards",
    "Circadian Gastronomy & Terroir Exploration",
    "Private Artisanal Workshops & Forest Contemplation",
    "High Elevation Panoramas & Sunset Tea Pavilions",
    "Coastal Inlets & Twilight Architecture",
    "Farewell Dawn Walk & Curated Epilogue",
  ]

  const stopsPalette = [
    {
      slot: "Morning • 08:30",
      title: `${cityName} Dawn Sanctuary & Meditative Pavilion`,
      note: "Arrive just as cedar gates unlatch; sunlight filters through morning mist before public hours.",
      dist: "6 min walk",
      reserved: true,
    },
    {
      slot: "Afternoon • 13:30",
      title: "Private Courtyard Salon & Terroir Luncheon",
      note: "Seasonal tasting menu featuring heirloom wild herbs and cold-pressed olive oils.",
      dist: "12 min transit",
      reserved: false,
    },
    {
      slot: "Twilight • 19:00",
      title: "Lantern-lit Waterway & Acoustic Salon",
      note: "Evening ambient acoustics with botanical infusions overlooking the historical quarter.",
      dist: "9 min walk",
      reserved: true,
    },
  ]

  const generatedDays: DayPlan[] = []
  for (let i = 1; i <= days; i++) {
    const themeIndex = (i - 1) % dayThemes.length
    generatedDays.push({
      day: i,
      theme: dayThemes[themeIndex],
      stops: stopsPalette.map((stop, sIdx) => ({
        ...stop,
        title: sIdx === 0 ? `${cityName} ${dayThemes[themeIndex].split("&")[0] || "Morning Sanctuary"}` : stop.title,
      })),
    })
  }

  return {
    name: cityName,
    region: `${cityName}, ${country}`,
    category: "Culture",
    rating: 4.95,
    duration: `${days} days`,
    budgetMin: 180,
    budgetMax: 360,
    dailyCost: 245,
    season: "April — June & September — November",
    description: `A mastercrafted ${days}-day expedition through ${cityName}, balanced around ${pace.toLowerCase()} rhythms and focused on ${lens.toLowerCase()}. Designed to evoke stillness, intimacy, and profound place-making.`,
    highlights: [
      `Private access to historic ${cityName} pavilions`,
      "Circadian dining curated around hyper-local micro-seasons",
      "Bespoke walking routes verified for pedestrian flow",
      "Twilight architectural viewpoints away from crowds",
    ],
    prepList: [
      "Carry slip-on leather footwear for historical temple transitions",
      "Reserve private dining 14 days in advance via ROVEO Concierge",
      "Download offline topographical trail data for day journeys",
      "Keep local currency denominations for artisanal tea masters",
    ],
    costBreakdown: [45, 30, 15, 10],
    days: generatedDays,
  }
}
