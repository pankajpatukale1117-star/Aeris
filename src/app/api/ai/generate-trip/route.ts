import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      origin = "New York, USA",
      destination = "Kyoto, Japan",
      departureDate = "2026-11-15",
      returnDate = "2026-11-22",
      travelers = 2,
      budget = "mid-range",
      pace = "balanced",
      interests = ["Culture", "Food", "History"],
      transportation = "Public Transit / Trains",
      accommodation = "Boutique Hotels",
    } = body

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey || apiKey === "your_gemini_api_key" || apiKey.includes("placeholder")) {
      return NextResponse.json(
        {
          success: false,
          error: "Gemini API key is not configured. Please set GEMINI_API_KEY in .env.local.",
        },
        { status: 401 }
      )
    }

    const prompt = `You are the lead travel architect for AERIS, a luxury travel-tech product.
Generate a structured, highly realistic, non-generic travel itinerary based on:
- Origin: ${origin}
- Destination: ${destination}
- Dates: ${departureDate} to ${returnDate}
- Travelers: ${travelers}
- Budget Level: ${budget}
- Preferred Pace: ${pace}
- Interests: ${Array.isArray(interests) ? interests.join(", ") : interests}
- Transportation: ${transportation}
- Accommodation: ${accommodation}

You MUST return pure JSON matching this exact structure:
{
  "title": "A captivating title for this trip",
  "destination": "${destination}",
  "overview": "A 2-3 sentence overview highlighting the journey's theme and flow.",
  "durationDays": 7,
  "estimatedBudget": "$X,XXX total for ${travelers} travelers",
  "budgetBreakdown": {
    "accommodation": "$XXX",
    "foodAndDining": "$XXX",
    "activities": "$XXX",
    "localTransport": "$XXX"
  },
  "travelTips": [
    "Tip 1 regarding local customs or transit",
    "Tip 2 regarding reservations or best hours",
    "Tip 3 regarding packing or payments"
  ],
  "days": [
    {
      "dayNumber": 1,
      "date": "Day 1",
      "title": "Theme for Day 1",
      "description": "Brief summary of Day 1",
      "activities": [
        {
          "id": "act-1-1",
          "time": "09:00",
          "title": "Activity Title",
          "description": "Engaging description with practical context",
          "duration": "1.5h",
          "location": "Specific landmark or neighborhood",
          "estimatedCost": "$XX or Free",
          "category": "Sightseeing | Food | Adventure | Cultural | Relaxation"
        }
      ]
    }
  ]
}

DO NOT include markdown code fences (\`\`\`json). Return ONLY valid raw JSON.`

    const models = ["gemini-2.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-3.8-flash"]
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
              responseMimeType: "application/json",
              temperature: 0.7,
              maxOutputTokens: 6000,
            },
          }),
        })

        if (res.ok) {
          const data = await res.json()
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ""
          const cleanJson = text.replace(/```json/gi, "").replace(/```/g, "").trim()
          const parsed = JSON.parse(cleanJson)
          return NextResponse.json({ success: true, itinerary: parsed, source: m })
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
      {
        success: false,
        error: lastError?.message || "Failed to generate itinerary with Gemini API.",
      },
      { status: lastError?.status && lastError.status >= 400 ? lastError.status : 502 }
    )
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Internal server error.",
      },
      { status: 500 }
    )
  }
}
