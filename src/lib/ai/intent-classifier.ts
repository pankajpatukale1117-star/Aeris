import { callGemini } from "./gemini-client"

export type IntentType =
  | "general_conversation"
  | "destination_information"
  | "trip_planning"
  | "itinerary_modification"
  | "budget_estimation"
  | "route_research"
  | "weather_information"
  | "accommodation_research"
  | "transport_research"

export interface ExtractedEntities {
  destination?: string
  origin?: string
  durationDays?: number
  travelers?: number
  budgetTier?: "budget" | "moderate" | "luxury" | "ultra-luxury"
  pace?: "relaxed" | "balanced" | "intensive"
  interests?: string[]
  targetDay?: number
  modificationRequest?: string
  specificLocation?: string
}

export interface IntentResult {
  intent: IntentType
  confidence: number
  entities: ExtractedEntities
  requiresTripGeneration: boolean
  explanation?: string
}

export async function classifyIntent(
  userQuery: string,
  currentItineraryName?: string,
  recentHistory?: Array<{ role: "user" | "model"; text: string }>
): Promise<IntentResult> {
  const query = userQuery.trim()

  // Fast pre-check for obvious simple greetings to save tokens
  const lower = query.toLowerCase()
  if (
    lower === "hello" ||
    lower === "hi" ||
    lower === "hey" ||
    lower === "greetings" ||
    lower === "good morning" ||
    lower === "good evening" ||
    lower === "namaste" ||
    lower === "bonjour" ||
    lower === "ciao"
  ) {
    return {
      intent: "general_conversation",
      confidence: 1.0,
      entities: {},
      requiresTripGeneration: false,
    }
  }

  const systemPrompt = `You are the Intent and Entity Classifier for AERIS, an AI travel concierge platform.
Analyze the user's latest query in the context of ongoing travel planning.

POSSIBLE INTENTS:
- "general_conversation": Greetings, hospitality remarks, broad questions about AERIS, small talk. NEVER generate a trip.
- "destination_information": Asking to learn about a city, country, or region (e.g. "Tell me about Japan", "What is Kyoto known for?", "Find a small peaceful destination near Satara"). Provide cultural, geographical, and travel insights. NEVER generate a full itinerary.
- "weather_information": Asking about weather, seasons, temperatures, or rain (e.g. "What is the weather there?", "Is it cold in December?").
- "budget_estimation": Asking about trip costs, expenses, or budgets (e.g. "How much will this trip cost?", "Can I do this under $100 a day?").
- "route_research": Asking about distances, drive times, transit, or walking between locations (e.g. "How far is it?", "Route from X to Y").
- "itinerary_modification": Modifying an existing trip in context (e.g. "Change the second day to include more nature", "Less walking on day 2", "Add a dinner thali spot").
- "trip_planning": User explicitly requests planning or curating a multi-day itinerary (e.g. "Plan a 3-day trip to Mahabaleshwar", "Build a 5-day itinerary for Tokyo").
- "accommodation_research": Inquiring specifically about hotels, boutique villas, or neighborhoods to stay in.
- "transport_research": Inquiring about trains, rental cars, flights, or transit passes.

CURRENT CONTEXT:
- Active Destination: ${currentItineraryName || "None"}

You MUST return a strict JSON object:
{
  "intent": "one of the intent strings above",
  "confidence": 0.95,
  "requiresTripGeneration": false (ONLY true if intent is "trip_planning"),
  "entities": {
    "destination": "Extracted location name or null",
    "origin": "Starting point if mentioned or null",
    "durationDays": 3 (integer or null),
    "travelers": 2 (integer or null),
    "budgetTier": "moderate" (or budget, luxury, ultra-luxury, or null),
    "pace": "balanced" (or relaxed, intensive, or null),
    "interests": ["nature", "sightseeing"],
    "targetDay": 2 (if modifying a specific day like Day 2),
    "modificationRequest": "Summary of modification if applicable"
  }
}`

  try {
    const geminiRes = await callGemini({
      systemPrompt,
      userMessage: query,
      history: recentHistory?.slice(-4),
      responseMimeType: "application/json",
      temperature: 0.1,
      maxOutputTokens: 1000,
      timeoutMs: 8000,
    })

    const clean = geminiRes.text.replace(/```json/gi, "").replace(/```/g, "").trim()
    const parsed = JSON.parse(clean)

    return {
      intent: parsed.intent || "general_conversation",
      confidence: parsed.confidence || 0.8,
      requiresTripGeneration: parsed.intent === "trip_planning",
      entities: parsed.entities || {},
    }
  } catch (err) {
    // Deterministic fallback intent heuristic
    if (lower.startsWith("plan ") || lower.includes("plan a ") || lower.includes("day trip to") || lower.includes("itinerary for")) {
      return {
        intent: "trip_planning",
        confidence: 0.7,
        requiresTripGeneration: true,
        entities: {},
      }
    }
    if (lower.includes("weather") || lower.includes("temperature") || lower.includes("rain") || lower.includes("climate")) {
      return {
        intent: "weather_information",
        confidence: 0.8,
        requiresTripGeneration: false,
        entities: {},
      }
    }
    if (lower.includes("cost") || lower.includes("budget") || lower.includes("price") || lower.includes("how much")) {
      return {
        intent: "budget_estimation",
        confidence: 0.8,
        requiresTripGeneration: false,
        entities: {},
      }
    }
    if (lower.includes("day 2") || lower.includes("second day") || lower.includes("day 1") || lower.includes("modify") || lower.includes("change")) {
      return {
        intent: "itinerary_modification",
        confidence: 0.8,
        requiresTripGeneration: false,
        entities: {},
      }
    }
    if (lower.startsWith("tell me about") || lower.includes("what is") || lower.includes("find a")) {
      return {
        intent: "destination_information",
        confidence: 0.8,
        requiresTripGeneration: false,
        entities: {},
      }
    }
    return {
      intent: "general_conversation",
      confidence: 0.6,
      requiresTripGeneration: false,
      entities: {},
    }
  }
}

