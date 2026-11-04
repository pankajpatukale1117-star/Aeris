import { calculateEndTimeFromDuration } from "@/components/trip/activity-card"

export interface ParsedActivity {
  title: string
  startTime: string
  endTime: string
  duration: string
  estimatedCost: string
  category: string
  location?: string
  description?: string
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Dining: [
    "dinner", "lunch", "breakfast", "brunch", "cafe", "coffee", "restaurant",
    "osteria", "trattoria", "gelato", "bakery", "bar", "drinks", "wine",
    "cocktail", "tasting", "supper", "feast", "eatery", "pizza", "sushi", "dining"
  ],
  Stay: [
    "hotel", "check-in", "checkin", "check in", "check-out", "checkout", "check out",
    "resort", "villa", "airbnb", "hostel", "lodge", "suite", "room", "inn"
  ],
  Transport: [
    "flight", "train", "transit", "taxi", "uber", "ferry", "bus", "drive",
    "transfer", "shuttle", "airport", "station", "subway", "metro", "ride"
  ],
  Adventure: [
    "hike", "hiking", "trek", "climb", "climbing", "boat", "kayak", "kayaking",
    "dive", "diving", "snorkel", "snorkeling", "surf", "surfing", "bike", "biking",
    "safari", "sail", "sailing", "swim", "swimming", "trail"
  ],
  Culture: [
    "museum", "gallery", "temple", "shrine", "palace", "cathedral", "church",
    "castle", "ruin", "ruins", "monument", "tour", "theater", "theatre",
    "concert", "opera", "club", "exhibition", "history"
  ],
}

/**
 * Parses freeform natural language text into a structured Activity object.
 * Examples:
 *   "Dinner at Osteria 8:00 PM $80 (1.5h)"
 *   "Morning Hike Sentiero degli Dei 08:30 2h Free"
 *   "Check in at Cliffside Villa 2pm 1h $350"
 *   "Coffee at Piazza 9:30am 45m €15"
 */
export function parseQuickAdd(text: string, defaultStartTime: string = "10:00"): ParsedActivity {
  let cleaned = text.trim()
  if (!cleaned) {
    return {
      title: "New Activity",
      startTime: defaultStartTime,
      endTime: calculateEndTimeFromDuration(defaultStartTime, "1.5h"),
      duration: "1.5h",
      estimatedCost: "Free",
      category: "Sightseeing",
    }
  }

  // 1. Extract Time (12h or 24h)
  // Matches: 8:00pm, 8pm, 8:30 am, 14:30, 20:00, 09:00, @ 8pm
  let startTime = defaultStartTime
  const timeRegex12 = /(?:@\s*|at\s*)?(\b\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i
  const timeRegex24 = /(?:@\s*|at\s*)?\b([01]?\d|2[0-3]):([0-5]\d)\b/

  const match12 = cleaned.match(timeRegex12)
  if (match12) {
    let hour = parseInt(match12[1], 10)
    const minute = match12[2] ? match12[2] : "00"
    const meridiem = match12[3].toLowerCase()
    if (meridiem === "pm" && hour < 12) hour += 12
    if (meridiem === "am" && hour === 12) hour = 0
    startTime = `${String(hour).padStart(2, "0")}:${minute}`
    cleaned = cleaned.replace(match12[0], " ")
  } else {
    const match24 = cleaned.match(timeRegex24)
    if (match24) {
      startTime = `${String(match24[1]).padStart(2, "0")}:${match24[2]}`
      cleaned = cleaned.replace(match24[0], " ")
    }
  }

  // 2. Extract Duration (e.g. 1.5h, 2h, 45m, 90 mins, half day)
  let duration = "1.5h"
  const durationRegex = /\(?\b(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b\)?/i
  const minuteDurationRegex = /\(?\b(\d+)\s*(?:minutes?|mins?|m)\b\)?/i
  const halfDayRegex = /\(?\b(?:half\s*day)\b\)?/i
  const fullDayRegex = /\(?\b(?:full\s*day)\b\)?/i

  if (halfDayRegex.test(cleaned)) {
    duration = "Half Day"
    cleaned = cleaned.replace(halfDayRegex, " ")
  } else if (fullDayRegex.test(cleaned)) {
    duration = "Full Day"
    cleaned = cleaned.replace(fullDayRegex, " ")
  } else {
    const dMatch = cleaned.match(durationRegex)
    if (dMatch) {
      duration = `${dMatch[1]}h`
      cleaned = cleaned.replace(dMatch[0], " ")
    } else {
      const mMatch = cleaned.match(minuteDurationRegex)
      if (mMatch) {
        duration = `${mMatch[1]}m`
        cleaned = cleaned.replace(mMatch[0], " ")
      }
    }
  }

  const endTime = calculateEndTimeFromDuration(startTime, duration)

  // 3. Extract Cost (e.g. $80, €50, ₹3000, 80$, Free)
  let estimatedCost = "Free"
  const costRegex = /(?:[\$€£₹¥]\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*[\$€£₹¥]|\b(\d+(?:\.\d+)?)\s*(?:usd|eur|inr|jpy)\b)/i
  const freeRegex = /\b(?:free|no cost)\b/i

  if (freeRegex.test(cleaned)) {
    estimatedCost = "Free"
    cleaned = cleaned.replace(freeRegex, " ")
  } else {
    const cMatch = cleaned.match(costRegex)
    if (cMatch) {
      const amount = cMatch[1] || cMatch[2] || cMatch[3]
      estimatedCost = amount ? String(amount) : "Free"
      cleaned = cleaned.replace(cMatch[0], " ")
    }
  }

  // 4. Infer Category from original text
  let category = "Sightseeing"
  const lowerOriginal = text.toLowerCase()
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => lowerOriginal.includes(k))) {
      category = cat
      break
    }
  }

  // 5. Clean Title & Extract optional Location
  let title = cleaned.replace(/\s+/g, " ").trim()
  let location: string | undefined = undefined

  // Match "Activity at Location" or "Activity in Location"
  const atMatch = title.match(/^(.+?)\s+(?:at|in)\s+([^,]+(?:,\s*[^,]+)*)$/i)
  if (atMatch && atMatch[1].length > 2 && atMatch[2].length > 2) {
    title = atMatch[1].trim()
    location = atMatch[2].trim()
  }

  // Fallback title if everything was stripped
  if (!title || title.length < 2) {
    title = category === "Dining" ? "Dining Experience" : "Custom Activity"
  }

  return {
    title,
    startTime,
    endTime,
    duration,
    estimatedCost,
    category,
    location,
  }
}
