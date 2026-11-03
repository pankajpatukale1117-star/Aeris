import { NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"

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

    // If Gemini API key is present and not placeholder, call Google GenAI
    if (apiKey && apiKey !== "your_gemini_api_key" && !apiKey.includes("placeholder")) {
      try {
        const ai = new GoogleGenAI({ apiKey })

        const prompt = `You are the lead travel architect for AERIS, a luxury travel-tech product.
Generate a structured, highly realistic travel itinerary based on:
- Origin: ${origin}
- Destination: ${destination}
- Dates: ${departureDate} to ${returnDate}
- Travelers: ${travelers}
- Budget Level: ${budget}
- Preferred Pace: ${pace}
- Interests: ${interests.join(", ")}
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

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        })

        const text = response.text || ""
        const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim()
        const parsed = JSON.parse(cleanJson)

        return NextResponse.json({ success: true, itinerary: parsed, source: "gemini" })
      } catch (geminiError: any) {
        console.warn("Gemini API call failed, using high-fidelity fallback:", geminiError)
      }
    }

    // High-fidelity curated fallback matching AERIS's standards
    const mockItinerary = {
      title: `${pace.charAt(0).toUpperCase() + pace.slice(1)} Discovery in ${destination}`,
      destination: destination,
      overview: `A bespoke journey through ${destination} crafted for ${travelers} traveler(s). Experience the finest local culture, hand-picked dining, and unforgettable scenic landmarks aligned with your interest in ${interests.slice(0, 2).join(" & ")}.`,
      durationDays: 7,
      estimatedBudget: budget === "luxury" ? "$4,500 total" : "$2,200 total",
      budgetBreakdown: {
        accommodation: budget === "luxury" ? "$2,400" : "$1,100",
        foodAndDining: budget === "luxury" ? "$1,200" : "$650",
        activities: budget === "luxury" ? "$600" : "$300",
        localTransport: budget === "luxury" ? "$300" : "$150",
      },
      travelTips: [
        `Book landmark reservations at least 2 weeks in advance for ${destination}.`,
        "Utilize high-speed rail or local transit passes for effortless navigation between districts.",
        "Keep local currency cash handy for neighborhood food markets and artisanal craft vendors.",
      ],
      days: [
        {
          dayNumber: 1,
          date: "Day 1",
          title: "Arrival, Acclimatization & Evening Heritage",
          description: "Arrive, check into your accommodation, and soak in your first golden hour views followed by a welcome dinner.",
          activities: [
            {
              id: "act-1-1",
              time: "14:00",
              title: "Check-in & Rest",
              description: "Unpack and freshen up at your boutique hotel.",
              duration: "1.5h",
              location: "City Center",
              estimatedCost: "Included",
              category: "Accommodation",
            },
            {
              id: "act-1-2",
              time: "17:30",
              title: "Sunset Orientation Walk",
              description: "Gentle stroll through the historic quarter to experience local architecture and evening ambiance.",
              duration: "1.5h",
              location: "Old Town Promenade",
              estimatedCost: "Free",
              category: "Sightseeing",
            },
            {
              id: "act-1-3",
              time: "19:30",
              title: "Welcome Gastronomic Tasting",
              description: "Multi-course seasonal dinner featuring regional specialties and local wine pairings.",
              duration: "2h",
              location: "Artisanal Bistro",
              estimatedCost: "$75/person",
              category: "Food",
            },
          ],
        },
        {
          dayNumber: 2,
          date: "Day 2",
          title: "Iconic Landmarks & Cultural immersion",
          description: "Explore the destination's most celebrated historical sites with early access.",
          activities: [
            {
              id: "act-2-1",
              time: "08:30",
              title: "Morning Heritage Site Tour",
              description: "Visit the world-famous architectural monument before peak tourist volume.",
              duration: "2.5h",
              location: "Historic Landmark",
              estimatedCost: "$25",
              category: "Culture",
            },
            {
              id: "act-2-2",
              time: "12:30",
              title: "Market Hall Lunch & Tasting",
              description: "Sample street delights and fresh seasonal produce from local purveyors.",
              duration: "1.5h",
              location: "Central Market",
              estimatedCost: "$20",
              category: "Food",
            },
            {
              id: "act-2-3",
              time: "15:00",
              title: "Scenic Panoramic Viewpoint",
              description: "Take the cable car or funicular up to the highest viewpoint for 360-degree vistas.",
              duration: "2h",
              location: "Summit Lookout",
              estimatedCost: "$15",
              category: "Adventure",
            },
          ],
        },
        {
          dayNumber: 3,
          date: "Day 3",
          title: "Nature Excursion & Hidden Gems",
          description: "Escape the bustling core to discover tranquil nature paths, coastal lookouts, or mountain gardens.",
          activities: [
            {
              id: "act-3-1",
              time: "09:00",
              title: "Wilderness Nature Hike",
              description: "Guided moderate walk along scenic trails surrounded by native flora and viewpoints.",
              duration: "3h",
              location: "National Park / Reserve",
              estimatedCost: "$10",
              category: "Nature",
            },
            {
              id: "act-3-2",
              time: "13:30",
              title: "Courtyard Garden Lunch",
              description: "Relaxed dining in a leafy garden with organic regional ingredients.",
              duration: "1.5h",
              location: "Garden Café",
              estimatedCost: "$30",
              category: "Food",
            },
          ],
        },
      ],
    }

    return NextResponse.json({
      success: true,
      itinerary: mockItinerary,
      source: "demo-engine",
      note: "Generated with AERIS Curated Engine. Add GEMINI_API_KEY to .env.local for live LLM synthesis.",
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate itinerary" },
      { status: 500 }
    )
  }
}

