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
  chatReply?: string
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
  costBreakdown: [number, number, number, number] // Boutique Stays, Gastronomy, Experiences/Access, Transit
  days: DayPlan[]
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      prompt,
      destination = "Kyoto, Japan",
      days = 5,
      pace = "Balanced",
      lens = "Architectural & Cultural Gems",
      apiKey: clientKey,
      context,
    } = body

    const userQuery = (prompt || destination || "Kyoto, Japan").trim()

    // 1. Resolve API Key from Environment, Header, or Client Body
    const headerKey = request.headers.get("x-gemini-key")
    const activeKey =
      process.env.GEMINI_API_KEY ||
      clientKey ||
      headerKey ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      ""

    const durationDays = Math.max(1, Math.min(14, Number(days) || 5))

    // 2. If valid Gemini API key present, execute live call
    if (activeKey && !activeKey.includes("placeholder") && activeKey.length > 15) {
      try {
        const systemPrompt = `You are ROVEO's elite international travel concierge AI. Generate a bespoke, highly sophisticated, circadian travel itinerary for ANY city, region, state, country, or small village in strict JSON format.
User Request: ${userQuery}
Duration: ${durationDays} days (if not specified in prompt, default to 3-5 days)
Circadian Pace: ${pace} (Slow & Zen / Balanced / High Pulse)
Curatorial Lens: ${lens} (Architectural & Cultural Gems / Gastronomy & Hidden Salons / Coastal & Nature Sanctuary / Private Concierge Luxury)
${context ? `Previous Context / Existing Itinerary: ${JSON.stringify(context).slice(0, 800)}` : ""}

Return a strict JSON object with this exact schema:
{
  "chatReply": "2-3 sentences of conversational concierge advice answering the user's prompt directly.",
  "name": "Location Name (City/Town/Village)",
  "region": "State / District, Country",
  "category": "Culture | Beach | Adventure | City",
  "rating": 4.9,
  "duration": "${durationDays} days",
  "budgetMin": 80,
  "budgetMax": 200,
  "dailyCost": 130,
  "season": "Prime travel months",
  "description": "Art-directed editorial prose capturing the location's character, history, and atmosphere.",
  "highlights": ["Highlight 1", "Highlight 2", "Highlight 3", "Highlight 4"],
  "prepList": ["Local permit or booking tip", "Transit or packing essential", "Cultural etiquette note", "Regional secret"],
  "costBreakdown": [45, 30, 15, 10], // Stays, Food, Experiences, Transit (must sum to 100)
  "days": [
    {
      "day": 1,
      "theme": "Editorial theme for Day 1",
      "stops": [
        { "slot": "Morning • 08:30", "title": "Exact local landmark, trail, or cafe", "note": "Insider concierge tip with circadian nuance", "dist": "10 min walk", "reserved": true },
        { "slot": "Afternoon • 13:30", "title": "Artisanal culinary, historic, or scenic stop", "note": "Local specialty to try", "dist": "15 min transit", "reserved": false },
        { "slot": "Twilight • 19:00", "title": "Sunset viewpoint, rooftop, or evening salon", "note": "Golden hour atmosphere tip", "dist": "8 min walk", "reserved": true }
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
              maxOutputTokens: 5000,
            },
          }),
        })

        if (geminiRes.ok) {
          const data = await geminiRes.json()
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || ""
          if (rawText) {
            // JSON Sanitizer: strip code fences
            const clean = rawText
              .replace(/```json/gi, "")
              .replace(/```/g, "")
              .trim()
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
        console.warn("Gemini live call error, activating universal editorial fallback:", geminiError)
      }
    }

    // 3. Universal Resilient Fallback for ANY Location on Earth
    const fallback = generateUniversalEditorialFallback(userQuery, durationDays, pace, lens)
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

function generateUniversalEditorialFallback(
  input: string,
  days: number,
  pace: string,
  lens: string
): SynthesizedItinerary {
  const lower = input.toLowerCase()

  // 1. Kolhapur & Western Ghats Curated Sanctuary
  if (lower.includes("kolhapur")) {
    return {
      chatReply: `I have synthesized an authentic ${days}-day circadian journey across Kolhapur and the Western Ghats. Your itinerary balances the sacred morning calmness of Shri Mahalakshmi Temple, the mist-veiled heights of Panhala fort, authentic Tambada-Pandhara Rassa cuisine, and tranquil twilight sunsets over Rankala Lake.`,
      name: "Kolhapur",
      region: "Maharashtra, India",
      category: "Culture",
      rating: 4.94,
      duration: `${days} days`,
      budgetMin: 40,
      budgetMax: 110,
      dailyCost: 75,
      season: "October — March (Pleasant Winters)",
      description: "Steeped in royal Maratha valor and sacred Hemadpanthi stone artistry, Kolhapur is an ancient sanctuary along the Panchganga River. From centuries-old wrestling akhadas to the Sahyadri hill fortresses and fiery, fragrant culinary traditions, this expedition captures Maharashtra's untamed soul.",
      highlights: [
        "Private dawn access to the 7th-century Shri Mahalakshmi Temple sanctum",
        "Panhala Fortress ridge exploration amidst cool Western Ghats cloud cover",
        "Heirloom Kolhapuri culinary tasting featuring authentic Tambada & Pandhara Rassa",
        "Artisanal visits to traditional leather chappal crafters in historic Shivaji Market",
      ],
      prepList: [
        "Wear modest, breathable cotton attire suitable for traditional temple shrines",
        "Carry light walking shoes for Panhala Fort's cobblestone stairways and stone ramparts",
        "Sample Kolhapuri spicy mutton/veg thali early around 1:00 PM for the freshest batch",
        "Keep Indian Rupee cash for local bazaar craft guilds and Rankala lakeside food stalls",
      ],
      costBreakdown: [40, 35, 15, 10],
      days: [
        {
          day: 1,
          theme: "Sacred Dawn Sanctum & Royal Maratha Architecture",
          stops: [
            {
              slot: "Morning • 08:30",
              title: "Shri Mahalakshmi (Ambabai) Temple Courtyard",
              note: "Arrive at 08:15 AM as morning sunlight filters through 7th-century black basalt stone carvings; observe morning rituals before afternoon pilgrims gather.",
              dist: "Heritage Center",
              reserved: true,
            },
            {
              slot: "Afternoon • 13:30",
              title: "New Palace (Shahu Chhatrapati Museum) & Royal Gardens",
              note: "Explore the Anglo-Indian black stone palace, private royal armory, and clock tower preserved by the royal family.",
              dist: "12 min transit",
              reserved: false,
            },
            {
              slot: "Twilight • 18:30",
              title: "Rankala Lake Promenade & Sunset Tea Pavilion",
              note: "Unwind along the peaceful paved promenade; watch dusk settle over the Rajghat stone towers with local roasted corn and ginger chai.",
              dist: "8 min walk",
              reserved: true,
            },
          ],
        },
        {
          day: 2,
          theme: "Sahyadri Fortress Heights & Terroir Gastronomy",
          stops: [
            {
              slot: "Morning • 08:30",
              title: "Panhala Fort — Teen Darwaza & Sajja Kothi Ramparts",
              note: "Climb into the cool, mist-veiled Sahyadri mountain bastion where Chhatrapati Shivaji Maharaj held court; breathtaking valley panoramas.",
              dist: "28 min scenic drive",
              reserved: true,
            },
            {
              slot: "Afternoon • 13:30",
              title: "Heritage Kolhapuri Thali at Dehati / Opal",
              note: "Savor generational Tambada (red chili) and Pandhara (white coconut-mutton broth) rassa paired with jowar bhakri.",
              dist: "15 min transit",
              reserved: false,
            },
            {
              slot: "Twilight • 19:00",
              title: "Bhavani Mandap Historical Salon & Twilight Courtyards",
              note: "Walk through the historic court assembly of the Maratha kings illuminated by golden lanterns.",
              dist: "5 min walk",
              reserved: true,
            },
          ],
        },
        {
          day: 3,
          theme: "Traditional Kushti Akhadas & Artisanal Craft Guilds",
          stops: [
            {
              slot: "Morning • 07:30",
              title: "Motibaug Talim (Traditional Clay Wrestling Akhada)",
              note: "Witness traditional kushti wrestlers training in red earth blessed with ghee and turmeric—a 150-year-old living tradition.",
              dist: "10 min walk",
              reserved: true,
            },
            {
              slot: "Afternoon • 13:00",
              title: "Shivaji Market & Chappal Lane Master Craftsmen",
              note: "Meet third-generation leather artisans stitching world-famous authentic vegetable-tanned Kolhapuri footwear.",
              dist: "6 min walk",
              reserved: false,
            },
            {
              slot: "Twilight • 18:45",
              title: "Jyotiba Temple Hilltop Twilight Viewpoint",
              note: "Ascend to 3,124 ft above sea level for a spiritual mountain sunset with pink gulal powder dusting the temple stones.",
              dist: "25 min drive",
              reserved: true,
            },
          ],
        },
      ].slice(0, days),
    }
  }

  // 2. Amalfi Coast & Capri Curated Sanctuary
  if (lower.includes("amalfi") || lower.includes("capri")) {
    return {
      chatReply: `I have curated a ${days}-day coastal circadian flow along the Amalfi Coast and Capri. Featuring private wooden gozzo boat passages, lemon terrace lunches, and sunset aperitivos overlooking Positano's pastel cliffs.`,
      name: "Amalfi Coast & Capri",
      region: "Campania, Italy",
      category: "Beach",
      rating: 4.96,
      duration: `${days} days`,
      budgetMin: 220,
      budgetMax: 580,
      dailyCost: 380,
      season: "May — June & September — October",
      description: "Dramatically sculpted vertical cliffs, fragrant sfusato amalfitano lemon groves, and the sapphire waters of the Tyrrhenian Sea. A timeless Italian coastal sanctuary curated with private boat corridors and quiet cliffside verandas.",
      highlights: [
        "Private wooden gozzo boat journey around the Faraglioni and Capri sea caves",
        "Ravello cliffside villa gardens (Villa Cimbrone & Villa Rufolo) suspended over the sea",
        "Artisanal limoncello tasting in a generational family-owned cliffside lemon grove",
        "Sunset aperitivo on a private terrace overlooking Positano's illuminated pastel facade",
      ],
      prepList: [
        "Reserve private boat passages 14 days in advance during shoulder season",
        "Pack rubber-soled deck shoes for wet boat transfers and cobblestone stairways",
        "Opt for morning ferry or private water taxi to avoid coastal road bottlenecks",
        "Carry light linen apparel for Mediterranean midday sun and warm evening breezes",
      ],
      costBreakdown: [50, 25, 15, 10],
      days: [
        {
          day: 1,
          theme: "Positano Pastel Arrival & Mediterranean Twilight",
          stops: [
            {
              slot: "Morning • 09:00",
              title: "Positano Marina Grande & Coastal Promenade",
              note: "Arrive via maritime water transit; coffee at an uncrowded seaside caffe while morning sun lights the cliffs.",
              dist: "Harbor Pier",
              reserved: true,
            },
            {
              slot: "Afternoon • 13:30",
              title: "Trattoria da Adolfo (Laurito Beach via Boat)",
              note: "Take the iconic red-fish boat to a secluded pebble cove for grilled mozzarella on lemon leaves and chilled white sangria.",
              dist: "10 min boat transfer",
              reserved: true,
            },
            {
              slot: "Twilight • 19:30",
              title: "Franco's Bar Sunset Aperitivo & Champagne Salon",
              note: "Enjoy curated Campari spritz and music overlooking the glowing vertical townscape.",
              dist: "12 min walk",
              reserved: false,
            },
          ],
        },
        {
          day: 2,
          theme: "Private Capri Sea Navigation & Hidden Grottos",
          stops: [
            {
              slot: "Morning • 08:30",
              title: "Private Gozzo Boat Charter to Capri & Faraglioni",
              note: "Sail past Punta Campanella into private coves; swim in crystal turquoise inlets before commercial boats arrive.",
              dist: "Marina transfer",
              reserved: true,
            },
            {
              slot: "Afternoon • 13:30",
              title: "Cliffside Dining at La Fontelina or Da Paolino Lemon Trees",
              note: "Feast on salt-crusted sea bass and handmade ravioli capresi beneath a canopy of fragrant ripe lemons.",
              dist: "Private tender",
              reserved: true,
            },
            {
              slot: "Twilight • 19:00",
              title: "Capri Piazzetta Twilight Espresso & Evening Stroll",
              note: "Watch evening society gather in Capri's legendary open-air living room as the day-trippers depart.",
              dist: "8 min funicular",
              reserved: false,
            },
          ],
        },
      ].slice(0, days),
    }
  }

  // 3. Extract a clean primary name for Universal Geography Fallback
  const cleanInput = input
    .replace(/^plan a \d+[- ]day trip to /i, "")
    .replace(/^trip to /i, "")
    .replace(/^in /i, "")
    .split(/exploring|with|focused on|and|for/i)[0]
    .trim()

  const parts = cleanInput.split(",")
  const locationName = parts[0]?.trim() || "Global Sanctuary"
  const regionName = parts.length > 1 ? cleanInput : `${locationName}, Regional Territory`

  const dayThemes = [
    "Arrival into Historical Heritage & Local Rhythm",
    "Ancient Architecture, Fortresses & Sacred Courtyards",
    "Terroir Gastronomy & Artisanal Market Corridors",
    "Hidden Viewpoints, Lakeside Trails & Stillness",
    "Panoramic Ridges & Twilight Tea Pavilions",
    "Craft Workshops & Traditional Cultural Salons",
    "Dawn Contemplation & Curated Farewell Epilogue",
  ]

  const stopsPalette = [
    {
      slot: "Morning • 08:30",
      title: `${locationName} Dawn Landmark & Historical Center`,
      note: "Arrive as morning mist lifts; local artisans open century-old courtyards before crowds arrive.",
      dist: "8 min walk",
      reserved: true,
    },
    {
      slot: "Afternoon • 13:30",
      title: "Regional Terroir Luncheon & Artisanal Culinary Stop",
      note: "Authentic local specialty dining featuring heirloom ingredients and regional spice profiles.",
      dist: "14 min transit",
      reserved: false,
    },
    {
      slot: "Twilight • 19:00",
      title: "Sunset Promenade & Evening Cultural Salon",
      note: "Golden hour viewpoint followed by unhurried evening tea and acoustic terrace views.",
      dist: "10 min walk",
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
        title: sIdx === 0 ? `${locationName} ${dayThemes[themeIndex].split("&")[0]?.trim() || "Morning Sanctuary"}` : stop.title,
      })),
    })
  }

  return {
    chatReply: `I have synthesized an authentic ${days}-day circadian journey across ${locationName}, customized for a ${pace.toLowerCase()} cadence and curated through a lens of ${lens.toLowerCase()}. All stops are proximity-calibrated.`,
    name: locationName,
    region: regionName,
    category: "Culture",
    rating: 4.92,
    duration: `${days} days`,
    budgetMin: 80,
    budgetMax: 220,
    dailyCost: 140,
    season: "October — March & Spring",
    description: `A mastercrafted ${days}-day expedition through ${locationName}. Balanced around circadian energy and regional heritage, uncovering intimate viewpoints, local culinary secrets, and sacred architecture.`,
    highlights: [
      `Private morning access to ${locationName} landmark heritage`,
      "Circadian dining curated around hyper-local micro-seasons",
      "Pedestrian-optimized transit routes with zero bottlenecking",
      "Sunset panoramas away from common tourist footfall",
    ],
    prepList: [
      "Carry modest attire and easily removable footwear for historical sites",
      "Reserve celebrated local culinary tastings 7 days in advance",
      "Download offline regional offline trail and navigation maps",
      "Keep local cash currency for street artisans and family-run bakeries",
    ],
    costBreakdown: [45, 30, 15, 10],
    days: generatedDays,
  }
}
