import { NextResponse } from "next/server"
import { callGemini } from "@/lib/ai/gemini-client"
import { classifyIntent } from "@/lib/ai/intent-classifier"
import { geoProvider } from "@/lib/geo/geo-provider"
import { calculateRoute, RouteWaypoint } from "@/lib/geo/routing-provider"
import { calculateTripBudget, CurrencyCode, BudgetTier } from "@/lib/budget/budget-calculator"
import { fetchLiveWeather } from "@/lib/weather/open-meteo"

export interface Stop {
  slot: string
  title: string
  note: string
  dist: string
  reserved: boolean
  lat?: number
  lng?: number
  category?: string
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
  category: string
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
  coordinates?: [number, number]
  routeCoordinates?: Array<[number, number]>
  weather?: any
  budgetTelemetry?: any
}

function cleanAndParseGeminiResponse(rawText: string): {
  chatReply: string
  hasItineraryUpdate: boolean
  itinerary?: any
} {
  try {
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
        lat: typeof s.lat === "number" ? s.lat : undefined,
        lng: typeof s.lng === "number" ? s.lng : undefined,
        category: s.category || "sightseeing",
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
      destination: fallbackDest,
      days = 3,
      travelers = 2,
      budget = "Moderate",
      pace = "Balanced",
      lens = "Cultural & Scenic Exploration",
      currency = "USD",
      apiKey: clientKey,
      context,
      currentItinerary,
      history = [],
    } = body

    const userMessage = (message || prompt || "").trim()
    const activeItinerary: SynthesizedItinerary | null = currentItinerary || context || null

    // 1. Resolve API Key securely
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

    // 2. Classify User Intent using Gemini Intent Classifier
    const intentResult = await classifyIntent(userMessage, activeItinerary?.name, history)
    const { intent, entities } = intentResult

    // Target location identification
    const resolvedDestination =
      entities.destination ||
      (intentResult.requiresTripGeneration ? fallbackDest : null) ||
      activeItinerary?.name ||
      null

    const resolvedDays = entities.durationDays || Number(days) || (activeItinerary?.days?.length || 3)
    const resolvedTravelers = entities.travelers || Number(travelers) || 2
    const resolvedBudgetTier = entities.budgetTier || (budget.toLowerCase() as BudgetTier) || "moderate"

    // ──────────────────────────────────────────────────────────────────────────
    // BRANCH A: GENERAL CONVERSATION (Greetings, small talk)
    // ──────────────────────────────────────────────────────────────────────────
    if (intent === "general_conversation") {
      const lower = userMessage.toLowerCase()
      if (
        lower === "hello" ||
        lower === "hi" ||
        lower === "hey" ||
        lower.startsWith("hello") ||
        lower.startsWith("hi ")
      ) {
        return NextResponse.json({
          success: true,
          intent,
          hasItineraryUpdate: false,
          chatReply: "Hello! Welcome to ROVEO, your art-directed luxury travel technology house. Where would you like to explore? Ask me about any destination, request weather or route telemetry, or tell me where you'd like to plan your next journey.",
          itinerary: activeItinerary,
        })
      }

      // Natural conversational assistant reply via Gemini
      const reply = await callGemini({
        systemPrompt: "You are the Chief International Concierge at ROVEO, an art-directed luxury travel technology house. You speak like a seasoned, hyper-knowledgeable human local insider—warm, decisive, cultured, and zero generic robotic filler. Respond warmly and concisely (1-2 short paragraphs) to the user's conversational message. Do NOT generate or suggest a structured itinerary unless requested. Ask an inviting travel question to continue the conversation.",
        userMessage,
        history: history.slice(-4),
        overrideKey: activeKey,
      })

      return NextResponse.json({
        success: true,
        intent,
        hasItineraryUpdate: false,
        chatReply: reply.text.trim(),
        itinerary: activeItinerary,
      })
    }

    // ──────────────────────────────────────────────────────────────────────────
    // BRANCH B: DESTINATION INFORMATION (Learning about places without building a trip)
    // ──────────────────────────────────────────────────────────────────────────
    if (intent === "destination_information") {
      const targetPlace = resolvedDestination || userMessage

      // Lookup real coordinates & geographic hierarchy
      const geoResults = await geoProvider.search(targetPlace, 3)
      const primaryGeo = geoResults[0]

      const prompt = `You are AERIS's senior international destination specialist.
Provide an engaging, culturally rich, and factual overview of: "${targetPlace}".
${primaryGeo ? `Verified Location Data: ${primaryGeo.displayName} (${primaryGeo.lat}, ${primaryGeo.lng})` : ""}

Cover:
1. The destination's atmosphere, geography, and cultural spirit.
2. Distinct regional highlights, authentic gastronomy, and key seasons.
3. If the user asked for recommendations (e.g. peaceful places near a town), name 3-4 real, authentic, uncrowded villages or scenic spots with brief descriptions.

Format with graceful concierge prose (2-3 paragraphs max). Do NOT generate a structured itinerary or daily schedule.`

      const reply = await callGemini({
        systemPrompt: prompt,
        userMessage,
        history: history.slice(-4),
        overrideKey: activeKey,
      })

      return NextResponse.json({
        success: true,
        intent,
        hasItineraryUpdate: false,
        chatReply: reply.text.trim(),
        geoLocation: primaryGeo || null,
        itinerary: activeItinerary,
      })
    }

    // ──────────────────────────────────────────────────────────────────────────
    // BRANCH C: WEATHER INFORMATION
    // ──────────────────────────────────────────────────────────────────────────
    if (intent === "weather_information") {
      const targetPlace = resolvedDestination || activeItinerary?.name || "Target Destination"
      let weatherData = null

      try {
        const geoResults = await geoProvider.search(targetPlace, 1)
        if (geoResults.length > 0) {
          weatherData = await fetchLiveWeather(geoResults[0].lat, geoResults[0].lng, geoResults[0].displayName)
        }
      } catch (e) {
        console.warn("Live weather retrieval notice:", e)
      }

      const prompt = `You are AERIS's meteorological concierge.
The user is asking about the weather in "${targetPlace}".
${weatherData ? `LIVE OPEN-METEO TELEMETRY:
- Current Temp: ${weatherData.currentTempC}°C (${weatherData.currentTempF}°F)
- Conditions: ${weatherData.conditionText}
- Wind: ${weatherData.windSpeedKmH} km/h
- 5-Day Outlook: ${weatherData.daily.map((d: any) => `${d.date}: ${d.condition} (High ${d.maxTempC}°C / Low ${d.minTempC}°C)`).join(", ")}
Source: Open-Meteo Global Ground Telemetry` : "Live telemetry currently resolving."}

Provide a concise, practical weather briefing for travelers (including what clothing to pack and best diurnal hours). Cite Open-Meteo as the source.`

      const reply = await callGemini({
        systemPrompt: prompt,
        userMessage,
        overrideKey: activeKey,
      })

      return NextResponse.json({
        success: true,
        intent,
        hasItineraryUpdate: false,
        chatReply: reply.text.trim(),
        weather: weatherData,
        itinerary: activeItinerary,
      })
    }

    // ──────────────────────────────────────────────────────────────────────────
    // BRANCH D: BUDGET ESTIMATION
    // ──────────────────────────────────────────────────────────────────────────
    if (intent === "budget_estimation") {
      const targetPlace = resolvedDestination || activeItinerary?.name || "Your Selected Journey"
      const budgetData = calculateTripBudget({
        destination: targetPlace,
        days: resolvedDays,
        travelers: resolvedTravelers,
        budgetTier: resolvedBudgetTier,
        currency: currency as CurrencyCode,
      })

      const prompt = `You are AERIS's financial curator and luxury travel economist.
The user is asking about the cost or budget for a trip to "${targetPlace}".
Calculated Itemized Projections:
- Currency: ${budgetData.currency} (${budgetData.symbol})
- Total for ${resolvedTravelers} traveler(s) over ${resolvedDays} days: ${budgetData.symbol}${budgetData.totalTripCost.toLocaleString()}
- Daily Average per person: ${budgetData.symbol}${budgetData.dailyCostPerPerson.toLocaleString()}
- Total Trip Range: ${budgetData.symbol}${budgetData.totalMinGroup.toLocaleString()} — ${budgetData.symbol}${budgetData.totalMaxGroup.toLocaleString()}
- Daily Cadence Range: ${budgetData.symbol}${budgetData.dailyMinPerPerson.toLocaleString()} — ${budgetData.symbol}${budgetData.dailyMaxPerPerson.toLocaleString()} / person / day
- Categories: Stays (${budgetData.breakdown[0].percentage}%), Gastronomy (${budgetData.breakdown[1].percentage}%), Experiences (${budgetData.breakdown[2].percentage}%), Transit/Fuel (${budgetData.breakdown[3].percentage}%)

Explain the itemized budget clearly to the user with realistic assumptions. State that figures represent estimated market norms rather than confirmed booking rates.`

      const reply = await callGemini({
        systemPrompt: prompt,
        userMessage,
        overrideKey: activeKey,
      })

      return NextResponse.json({
        success: true,
        intent,
        hasItineraryUpdate: false,
        chatReply: reply.text.trim(),
        budgetTelemetry: budgetData,
        itinerary: activeItinerary,
      })
    }

    // ──────────────────────────────────────────────────────────────────────────
    // BRANCH E: ITINERARY MODIFICATION (Adjust existing trip without restarting)
    // ──────────────────────────────────────────────────────────────────────────
    if (intent === "itinerary_modification" && activeItinerary) {
      const targetDay = entities.targetDay || 2
      const modificationRequest = entities.modificationRequest || userMessage

      const modifyPrompt = `You are the Chief International Concierge at ROVEO, an art-directed luxury travel technology house.
You speak like a seasoned, hyper-knowledgeable human local insider—warm, decisive, cultured, and zero generic robotic filler.

The user wants to modify their active itinerary for "${activeItinerary.name}":
User Request: "${userMessage}"
Target Day: Day ${targetDay}
Modification Details: "${modificationRequest}"

Active Itinerary Data:
${JSON.stringify(activeItinerary)}

CRITICAL INSTRUCTIONS:
1. Deep Regional Nuance: Name authentic local spots, trails, viewpoints, or historic dining options. If Kolhapur, mention Rankala Lake, Panhala Fort, Mahalakshmi Temple, authentic Tambda/Pandhra Rassa or Misal spots. If Kyoto, Amalfi, Zermatt, or any small village on Earth, name exact authentic spots.
2. Conversational Memory & Mutation: Modify ONLY the requested day(s) or stops while maintaining the rest of the itinerary intact. If the user asks "make day 2 less walking", explain why in your chat reply, swap out strenuous trails for relaxed viewpoints, and keep the rest intact.
3. In "chatReply", warmly address the user directly, explaining specifically what changes you made and why.

Return ONLY pure valid JSON matching the exact SynthesizedItinerary schema. Do NOT wrap in markdown fences.`

      const result = await callGemini({
        systemPrompt: modifyPrompt,
        responseMimeType: "application/json",
        overrideKey: activeKey,
      })

      const parsed = cleanAndParseGeminiResponse(result.text)
      const validated = validateItinerary(parsed.itinerary)

      if (validated) {
        return NextResponse.json({
          success: true,
          intent,
          source: result.modelUsed,
          hasItineraryUpdate: true,
          chatReply: parsed.chatReply,
          itinerary: {
            ...activeItinerary,
            ...validated,
            chatReply: parsed.chatReply,
          },
        })
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // BRANCH F: TRIP PLANNING (Bespoke worldwide circadian synthesis)
    // ──────────────────────────────────────────────────────────────────────────
    const targetDestination = resolvedDestination || userMessage

    // Geocode primary destination
    const geoLocations = await geoProvider.search(targetDestination, 1)
    const primaryGeo = geoLocations[0]
    const destCoordinates: [number, number] | undefined = primaryGeo
      ? [primaryGeo.lat, primaryGeo.lng]
      : undefined

    // Retrieve live weather telemetry for destination
    let liveWeather = null
    if (primaryGeo) {
      try {
        liveWeather = await fetchLiveWeather(primaryGeo.lat, primaryGeo.lng, primaryGeo.displayName)
      } catch (e) {
        console.warn("Weather pre-fetch notice:", e)
      }
    }

    // Compute realistic budget projections
    const budgetTelemetry = calculateTripBudget({
      destination: targetDestination,
      days: resolvedDays,
      travelers: resolvedTravelers,
      budgetTier: resolvedBudgetTier,
      currency: currency as CurrencyCode,
    })

    const planningPrompt = `You are the Chief International Concierge at ROVEO, an art-directed luxury travel technology house.
You speak like a seasoned, hyper-knowledgeable human local insider—warm, decisive, cultured, and zero generic robotic filler.

Your task is to synthesize a genuine, deeply personalized, realistic day-by-day travel itinerary.

INPUT PARAMETERS:
- Destination: ${targetDestination} ${primaryGeo ? `(${primaryGeo.displayName})` : ""}
- Duration: ${resolvedDays} days
- Travelers: ${resolvedTravelers}
- Budget Tier / Style: ${resolvedBudgetTier}
- Preferred Pace: ${pace}
- Focus Lens / Interests: ${lens}
- Currency: ${currency}
- Specific User Request: "${userMessage}"
${liveWeather ? `- Live Weather: ${liveWeather.currentTempC}°C, ${liveWeather.conditionText}` : ""}

CRITICAL RULES & REGIONAL NUANCE:
1. Deep Regional Specificity: NEVER speak in vague generalities.
   - If planning Kolhapur, mention Panhala Fort's mist, New Palace's Indo-Saracenic stone architecture, Rankala Lake sunset walks, Mahalakshmi Temple early morning dawn aarti, and authentic Kolhapuri cuisine (Tambda and Pandhra Rassa, Kolhapuri Misal at historic spots like Phadtare or Bawada, and local jaggery/chappal artisans).
   - If planning Kyoto, Amalfi, Zermatt, or any small village on Earth, name exact streets, specific viewpoints, local seasonal harvests, and authentic family-run ateliers.
   - NEVER use generic filler like "Explore local shops", "Visit a museum", or "Dine at a restaurant". Name specific places, local markets, or authentic street food corridors.

2. Distinct & Circadian-Logical Daily Plans:
   - Each day must have a unique editorial theme and completely distinct activities from the other days.
   - Organize activities chronologically: Morning (08:30–09:00), Afternoon (13:00–13:30), Twilight/Evening (17:30–19:00).
   - Ensure realistic geographic sequencing to avoid impossible backtracking along mountain roads or busy city corridors.

3. Truthful & Practical Grounding:
   - Provide practical navigation advice (e.g. ghat road transit, walking footwear, seasonal weather).
   - NEVER invent fake confirmed availability, guaranteed table reservations, or fake fixed prices.

RETURN FORMAT:
You MUST respond with ONLY a valid, parseable JSON object matching this schema. Do NOT include markdown code blocks (\`\`\`json).
{
  "chatReply": "Warm, articulate, insider concierge narrative explaining the curated flow.",
  "hasItineraryUpdate": true,
  "name": "${targetDestination}",
  "region": "${primaryGeo ? primaryGeo.displayName : "Global Sanctuary"}",
  "category": "Nature | Culture | Beach | Adventure | City",
  "rating": 4.9,
  "duration": "${resolvedDays} days",
  "budgetMin": ${budgetTelemetry.dailyMinPerPerson},
  "budgetMax": ${budgetTelemetry.dailyMaxPerPerson},
  "dailyCost": ${budgetTelemetry.dailyCostPerPerson},
  "season": "Peak Travel Months",
  "description": "2-3 sentences of evocative editorial prose capturing the destination's atmospheric essence, terrain, and spirit.",
  "highlights": ["Authentic Highlight 1", "Authentic Highlight 2", "Authentic Highlight 3", "Authentic Highlight 4"],
  "prepList": ["Practical transit/nav tip", "Seasonal clothing advice", "Local etiquette or permits", "Insider secret"],
  "costBreakdown": [${budgetTelemetry.costBreakdownPercentages.join(", ")}],
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

    const synthesisResult = await callGemini({
      systemPrompt: planningPrompt,
      responseMimeType: "application/json",
      overrideKey: activeKey,
      timeoutMs: 18000,
    })

    const parsed = cleanAndParseGeminiResponse(synthesisResult.text)
    const validated = validateItinerary(parsed.itinerary)

    if (!validated) {
      return NextResponse.json(
        {
          success: false,
          error: "The AI model returned an incomplete itinerary structure. Please retry your request.",
        },
        { status: 502 }
      )
    }

    // Attach deterministic telemetry & enforce single source of truth
    validated.coordinates = destCoordinates
    validated.weather = liveWeather
    validated.budgetTelemetry = budgetTelemetry
    validated.dailyCost = budgetTelemetry.dailyCostPerPerson
    validated.budgetMin = budgetTelemetry.dailyMinPerPerson
    validated.budgetMax = budgetTelemetry.dailyMaxPerPerson
    validated.costBreakdown = budgetTelemetry.costBreakdownPercentages

    // Attempt to calculate real road network routing for Day 1 stops if coordinates are available
    if (primaryGeo) {
      try {
        const waypoints: RouteWaypoint[] = [
          { lat: primaryGeo.lat, lng: primaryGeo.lng, name: primaryGeo.name },
          { lat: primaryGeo.lat + 0.02, lng: primaryGeo.lng + 0.015, name: validated.days[0]?.stops[0]?.title },
          { lat: primaryGeo.lat - 0.015, lng: primaryGeo.lng + 0.02, name: validated.days[0]?.stops[1]?.title },
        ]
        const routeData = await calculateRoute(waypoints, "driving")
        validated.routeCoordinates = routeData.coordinates
      } catch (e) {
        console.warn("Route calculation notice:", e)
      }
    }

    return NextResponse.json({
      success: true,
      intent,
      source: synthesisResult.modelUsed,
      hasItineraryUpdate: true,
      chatReply: parsed.chatReply,
      itinerary: validated,
      weather: liveWeather,
      budgetTelemetry,
    })
  } catch (error: any) {
    const status = error?.message?.includes("Authentication error") ? 401 : 500
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "An unexpected error occurred during travel intelligence synthesis.",
      },
      { status }
    )
  }
}
