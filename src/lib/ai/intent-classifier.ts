import { callGemini } from "./gemini-client"

export type IntentType =
  | "general_conversation"
  | "destination_information"
  | "trip_discovery"
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

export function extractDestinationFromText(text: string): string | undefined {
  if (!text) return undefined
  const cleaned = text.trim()
  const patterns = [
    /(?:i want to go to|i want to visit|take me to|trip to|let's go to|let's visit|travel to|explore|visit|plan a trip to|plan an expedition to|plan to visit)\s+([a-zA-Z\s,.-]+?)(?:\s+for\b|\s+with\b|\s+in\b|\s*$|\?|!|\.)/i,
    /(?:about|visiting|going to)\s+([a-zA-Z\s,.-]+?)(?:\s+for\b|\s+with\b|\s+in\b|\s*$|\?|!|\.)/i,
  ]
  for (const pat of patterns) {
    const match = cleaned.match(pat)
    if (match && match[1] && match[1].trim().length > 1) {
      const dest = match[1].trim()
      // Filter common words
      if (!["a", "an", "the", "there", "somewhere", "anywhere"].includes(dest.toLowerCase())) {
        return dest
      }
    }
  }
  return undefined
}

export function findDestinationInHistory(
  history?: Array<{ role: "user" | "model"; text: string }>,
  currentItineraryName?: string
): string | undefined {
  if (currentItineraryName && currentItineraryName !== "None") return currentItineraryName
  if (!history || history.length === 0) return undefined

  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i]
    const found = extractDestinationFromText(msg.text)
    if (found) return found
  }
  return undefined
}

export function extractDays(text: string): number | undefined {
  const m = text.match(/\b(\d+)\s*(?:day|night)/i)
  if (m) {
    const n = parseInt(m[1], 10)
    if (!isNaN(n) && n > 0 && n <= 30) return n
  }
  if (/\bweekend\b/i.test(text)) return 2
  if (/\bweek\b/i.test(text)) return 7
  return undefined
}

export function extractTravelers(text: string): number | undefined {
  const lower = text.toLowerCase()
  if (lower.includes("solo") || lower.includes("alone") || lower.includes("myself")) return 1
  if (lower.includes("couple") || lower.includes("partner") || lower.includes("wife") || lower.includes("husband") || lower.includes("two of us") || lower.includes("2 people")) return 2
  const m = lower.match(/\b(\d+)\s*(?:people|travelers|adults|persons|pax|friends)\b/i)
  if (m) return parseInt(m[1], 10)
  if (lower.includes("family of 4") || lower.includes("family of four")) return 4
  if (lower.includes("family of 3") || lower.includes("family of three")) return 3
  if (lower.includes("family of 5") || lower.includes("family of five")) return 5
  if (lower.includes("family")) return 4
  return undefined
}

export function extractBudgetTier(text: string): "budget" | "moderate" | "luxury" | "ultra-luxury" | undefined {
  const lower = text.toLowerCase()
  if (lower.includes("ultra-luxury") || lower.includes("ultra luxury") || lower.includes("billionaire") || lower.includes("presidential")) return "ultra-luxury"
  if (lower.includes("luxury") || lower.includes("5-star") || lower.includes("five-star") || lower.includes("michelin") || lower.includes("high-end") || lower.includes("high end")) return "luxury"
  if (lower.includes("budget") || lower.includes("cheap") || lower.includes("affordable") || lower.includes("backpacker") || lower.includes("economical")) return "budget"
  if (lower.includes("moderate") || lower.includes("boutique") || lower.includes("heritage") || lower.includes("mid-range") || lower.includes("balanced")) return "moderate"
  return undefined
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

  const systemPrompt = `You are the Intent and Entity Classifier for ROVEO, an art-directed luxury travel concierge platform.
Analyze the user's latest query in the context of ongoing multi-turn travel planning.

POSSIBLE INTENTS:
- "general_conversation": Greetings, hospitality remarks, broad questions about ROVEO, small talk. NEVER generate a trip.
- "destination_information": Asking to learn about a city, country, or region (e.g. "Tell me about Japan", "What is Kyoto known for?", "Is Kolhapur safe to visit?"). NEVER generate an itinerary.
- "weather_information": Asking about weather, seasons, temperatures, or rain (e.g. "What is the weather there?").
- "budget_estimation": Asking about trip costs, expenses, or budgets (e.g. "How much will this trip cost?").
- "route_research": Asking about distances, drive times, transit, or walking between locations.
- "itinerary_modification": Modifying an existing trip in context (e.g. "Change day 2 to include more nature", "Add a dinner spot").
- "trip_discovery": The user wants to visit, explore, or travel to a place (e.g. "I want to go to Rome", "Take me to Bali", "Let's visit Switzerland", "Plan a trip to Tokyo", "Visit Kolhapur"), BUT key parameters (duration/nights, budget/style, or number of travelers) have NOT yet been provided. In this case, the concierge must ask consultative questions first before generating an itinerary. requiresTripGeneration MUST BE FALSE.
- "trip_planning": User wants an itinerary synthesized AND either:
  1. Has provided duration/days, budget/style, or travelers (either in the current message or across recent history turns), OR
  2. Has explicitly instructed to build/generate (e.g. "Just plan it", "Surprise me", "Standard 3 days", "Generate blueprint").
  requiresTripGeneration MUST BE TRUE.
- "accommodation_research": Inquiring specifically about hotels, boutique villas, or neighborhoods to stay in.
- "transport_research": Inquiring about trains, rental cars, flights, or transit passes.

CONVERSATION CONTEXT:
- Active Destination: ${currentItineraryName || "None"}

ENTITY RESOLUTION & DISCOVERY RULES:
- If a destination was mentioned in previous assistant or user turns in history, carry it forward if the user is answering questions (e.g., user answers "4 days, couple, luxury budget" after discussing Kyoto -> destination: "Kyoto").
- If the user only names or expresses interest in a place (e.g. "I want to go to Rome") without specifying days/nights or budget, classify as "trip_discovery" with requiresTripGeneration: false.
- If the user provides at least duration (days/nights) or budget or says "just plan it", classify as "trip_planning" with requiresTripGeneration: true.
- If duration is mentioned as nights (e.g. "3 nights"), convert to days (durationDays: 4).
- Parse travelers ("couple" -> 2, "solo" -> 1, "family of 4" -> 4).
- Parse budget ("luxury", "5-star", "Michelin" -> "luxury"; "backpacker", "cheap" -> "budget"; "boutique", "moderate" -> "moderate").

You MUST return a strict JSON object:
{
  "intent": "one of the intent strings above",
  "confidence": 0.95,
  "requiresTripGeneration": boolean,
  "entities": {
    "destination": "Extracted location name or null",
    "origin": "Starting point if mentioned or null",
    "durationDays": 4 (integer or null),
    "travelers": 2 (integer or null),
    "budgetTier": "moderate" (or budget, luxury, ultra-luxury, or null),
    "pace": "balanced" (or relaxed, intensive, or null),
    "interests": ["nature", "food"],
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

    let intent = (parsed.intent || "general_conversation") as IntentType
    const entities: ExtractedEntities = parsed.entities || {}

    // Augment with fallback extractors if fields are missing
    if (!entities.destination) {
      entities.destination = findDestinationInHistory(recentHistory, currentItineraryName) || extractDestinationFromText(query)
    }
    if (!entities.durationDays) {
      const d = extractDays(query)
      if (d) entities.durationDays = d
    }
    if (!entities.travelers) {
      const t = extractTravelers(query)
      if (t) entities.travelers = t
    }
    if (!entities.budgetTier) {
      const b = extractBudgetTier(query)
      if (b) entities.budgetTier = b
    }

    const isExplicitBypass =
      lower.includes("just plan") ||
      lower.includes("surprise me") ||
      lower.includes("standard 3") ||
      lower.includes("standard blueprint") ||
      lower.includes("standard") ||
      lower.includes("curate a ") ||
      lower.includes("generate blueprint")

    // If intent is trip_discovery but user gave duration/budget or requested immediate bypass -> promote to trip_planning
    if (intent === "trip_discovery" && (entities.durationDays || isExplicitBypass)) {
      intent = "trip_planning"
    }

    // If intent is trip_planning but user provided NO durationDays AND NO budget AND NO travelers AND did not bypass -> demote to trip_discovery
    if (intent === "trip_planning" && !entities.durationDays && !entities.budgetTier && !entities.travelers && !isExplicitBypass) {
      intent = "trip_discovery"
    }

    const requiresGen = Boolean(intent === "trip_planning" && (Boolean(entities.durationDays) || isExplicitBypass))

    return {
      intent,
      confidence: parsed.confidence || 0.85,
      requiresTripGeneration: requiresGen,
      entities,
    }
  } catch (err) {
    // Deterministic fallback intent heuristic
    const isExplicitBypass =
      lower.includes("just plan") ||
      lower.includes("surprise me") ||
      lower.includes("standard 3") ||
      lower.includes("standard blueprint") ||
      lower.includes("standard") ||
      lower.includes("curate a ") ||
      lower.includes("generate blueprint")

    const fallbackDest = extractDestinationFromText(query) || findDestinationInHistory(recentHistory, currentItineraryName)
    const fallbackDays = extractDays(query)
    const fallbackTravelers = extractTravelers(query)
    const fallbackBudget = extractBudgetTier(query)

    const entities: ExtractedEntities = {
      destination: fallbackDest,
      durationDays: fallbackDays,
      travelers: fallbackTravelers,
      budgetTier: fallbackBudget,
    }

    if (
      lower.startsWith("plan ") ||
      lower.includes("plan a ") ||
      lower.includes("day trip to") ||
      lower.includes("itinerary for") ||
      lower.startsWith("i want to go to") ||
      lower.startsWith("i want to visit") ||
      lower.startsWith("take me to") ||
      lower.includes("visit ") ||
      lower.includes("trip to") ||
      lower.includes("travel to") ||
      lower.includes("explore ")
    ) {
      const hasDays = Boolean(fallbackDays) || isExplicitBypass
      return {
        intent: hasDays ? "trip_planning" : "trip_discovery",
        confidence: 0.8,
        requiresTripGeneration: hasDays,
        entities,
      }
    }

    // Answering questions in multi-turn (e.g. "4 days, couple, luxury budget")
    if (fallbackDays || (fallbackDest && (fallbackTravelers || fallbackBudget))) {
      return {
        intent: "trip_planning",
        confidence: 0.85,
        requiresTripGeneration: Boolean(fallbackDays || isExplicitBypass),
        entities,
      }
    }

    if (lower.includes("weather") || lower.includes("temperature") || lower.includes("rain") || lower.includes("climate")) {
      return {
        intent: "weather_information",
        confidence: 0.8,
        requiresTripGeneration: false,
        entities,
      }
    }
    if (lower.includes("cost") || lower.includes("budget") || lower.includes("price") || lower.includes("how much")) {
      return {
        intent: "budget_estimation",
        confidence: 0.8,
        requiresTripGeneration: false,
        entities,
      }
    }
    if (lower.includes("day 2") || lower.includes("second day") || lower.includes("day 1") || lower.includes("modify") || lower.includes("change")) {
      return {
        intent: "itinerary_modification",
        confidence: 0.8,
        requiresTripGeneration: false,
        entities,
      }
    }
    if (lower.startsWith("tell me about") || lower.includes("what is") || lower.includes("find a")) {
      return {
        intent: "destination_information",
        confidence: 0.8,
        requiresTripGeneration: false,
        entities,
      }
    }
    return {
      intent: "general_conversation",
      confidence: 0.6,
      requiresTripGeneration: false,
      entities,
    }
  }
}


