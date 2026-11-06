/**
 * AERIS Deterministic Travel Budget Engine
 * Single Source of Truth for all budget telemetry, daily cadences,
 * itemized category breakdowns, and currency conversions.
 *
 * Guarantees 100% mathematical consistency:
 * 1. Sum of category amounts === Total trip cost
 * 2. Total trip cost / travelers === Per-person trip cost
 * 3. Per-person trip cost / durationDays === Daily cost per person
 * 4. Sum of category percentages === 100%
 * 5. Deterministic currency conversion without compounding drift
 */

export type BudgetTier = "budget" | "moderate" | "luxury" | "ultra-luxury"

export type CurrencyCode = "USD" | "EUR" | "GBP" | "JPY" | "INR" | "AUD" | "CAD" | "CHF"

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  INR: "₹",
  AUD: "A$",
  CAD: "C$",
  CHF: "CHF ",
}

// Canonical exchange rates relative to 1 USD (Baseline)
export const FX_RATES_FROM_USD: Record<CurrencyCode, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 152.0,
  INR: 86.5,
  AUD: 1.55,
  CAD: 1.40,
  CHF: 0.90,
}

export interface BudgetItemDetail {
  category: "Stays" | "Gastronomy" | "Experiences & Entry" | "Transit & Fuel"
  title: string
  dailyPerPerson: number
  totalPerPerson: number
  totalGroup: number
  percentage: number
  assumptions: string
}

export interface DetailedTripBudget {
  destination?: string
  currency: CurrencyCode
  symbol: string
  durationDays: number
  travelers: number
  budgetTier: BudgetTier
  // Per-person figures
  dailyAveragePerPerson: number
  totalPerPerson: number
  rangeMinDailyPerPerson: number
  rangeMaxDailyPerPerson: number
  // Group figures
  dailyGroup: number
  totalGroup: number
  rangeMinGroup: number
  rangeMaxGroup: number
  // Itemized breakdown (Sum of category totalGroup === totalGroup exactly)
  breakdown: BudgetItemDetail[]
  costBreakdownPercentages: [number, number, number, number] // [Stays, Food, Experiences, Transit] sum to 100
  // Telemetry metadata
  baseDailyUsd: number
  fxRate: number
  isEstimate: boolean
  dataSource: string
  disclaimer: string
  lastUpdated: string
}

export interface BudgetInputParams {
  destination?: string
  days: number
  travelers?: number
  budgetTier?: BudgetTier | string
  currency?: CurrencyCode
  customDailyRateUsd?: number
}

export interface DestinationEconomicProfile {
  regionId: "india_south_asia" | "southeast_asia" | "mediterranean_southern_europe" | "east_asia" | "western_europe_americas"
  regionLabel: string
  purchasingPowerLabel: string
  badgeColor: string
  baseRatesUsd: {
    budget: number
    balanced: number
    luxury: number
  }
  dailyRates: {
    budget: number
    balanced: number
    luxury: number
  }
  description: string
}

/**
 * Real-Time Purchasing Power Parity (PPP) & Destination Economics Engine.
 * Accurately analyzes regional travel cost structures so prices reflect realistic,
 * ground-truth expenses rather than inflated Western generic numbers.
 */
export function resolveDestinationEconomicProfile(
  destination?: string,
  currency: CurrencyCode = "USD"
): DestinationEconomicProfile {
  const dest = (destination || "").toLowerCase()
  const fx = FX_RATES_FROM_USD[currency] || 1.0

  // 1. Domestic India & South Asian Subcontinent
  const isSouthAsia =
    dest.includes("india") ||
    dest.includes("pune") ||
    dest.includes("mumbai") ||
    dest.includes("delhi") ||
    dest.includes("bangalore") ||
    dest.includes("bengaluru") ||
    dest.includes("kolhapur") ||
    dest.includes("goa") ||
    dest.includes("kerala") ||
    dest.includes("rajasthan") ||
    dest.includes("jaipur") ||
    dest.includes("udaipur") ||
    dest.includes("jodhpur") ||
    dest.includes("agra") ||
    dest.includes("varanasi") ||
    dest.includes("manali") ||
    dest.includes("shimla") ||
    dest.includes("rishikesh") ||
    dest.includes("ladakh") ||
    dest.includes("kashmir") ||
    dest.includes("himalaya") ||
    dest.includes("maharashtra") ||
    dest.includes("gujarat") ||
    dest.includes("tamil nadu") ||
    dest.includes("chennai") ||
    dest.includes("hyderabad") ||
    dest.includes("kolkata") ||
    dest.includes("nepal") ||
    dest.includes("kathmandu") ||
    dest.includes("sri lanka") ||
    (!dest && currency === "INR")

  if (isSouthAsia) {
    const baseRatesUsd = { budget: 16, balanced: 36, luxury: 98 }
    const formatTier = (valUsd: number) => {
      if (currency === "INR") {
        // Authentic Indian market norms: ~₹1,400 (budget), ~₹3,200 (balanced), ~₹8,500 (luxury)
        return Math.round((valUsd * fx) / 100) * 100
      }
      return Math.max(5, Math.round((valUsd * fx) / 5) * 5)
    }

    return {
      regionId: "india_south_asia",
      regionLabel: "India & South Asia",
      purchasingPowerLabel: "High Value Index (Realistically Calibrated)",
      badgeColor: "emerald",
      baseRatesUsd,
      dailyRates: {
        budget: formatTier(baseRatesUsd.budget),
        balanced: formatTier(baseRatesUsd.balanced),
        luxury: formatTier(baseRatesUsd.luxury),
      },
      description: "Real-world Indian travel benchmarks: boutique heritage stays, authentic local cuisine, intercity cabs & entry.",
    }
  }

  // 2. Southeast Asia (Tropical Sanctuaries)
  const isSoutheastAsia =
    dest.includes("bali") ||
    dest.includes("indonesia") ||
    dest.includes("thailand") ||
    dest.includes("bangkok") ||
    dest.includes("phuket") ||
    dest.includes("chiang mai") ||
    dest.includes("vietnam") ||
    dest.includes("hanoi") ||
    dest.includes("ho chi minh") ||
    dest.includes("da nang") ||
    dest.includes("cambodia") ||
    dest.includes("siem reap") ||
    dest.includes("philippines") ||
    dest.includes("malaysia") ||
    dest.includes("laos")

  if (isSoutheastAsia) {
    const baseRatesUsd = { budget: 25, balanced: 55, luxury: 150 }
    const formatTier = (valUsd: number) => {
      if (currency === "INR") return Math.round((valUsd * fx) / 100) * 100
      return Math.max(5, Math.round((valUsd * fx) / 5) * 5)
    }

    return {
      regionId: "southeast_asia",
      regionLabel: "Southeast Asia",
      purchasingPowerLabel: "High Value Index",
      badgeColor: "sky",
      baseRatesUsd,
      dailyRates: {
        budget: formatTier(baseRatesUsd.budget),
        balanced: formatTier(baseRatesUsd.balanced),
        luxury: formatTier(baseRatesUsd.luxury),
      },
      description: "Optimized for SE Asia: lush boutique villas, scooter/cabs, vibrant night markets & island ferries.",
    }
  }

  // 3. Mediterranean & Southern Europe
  const isMediterranean =
    dest.includes("italy") ||
    dest.includes("amalfi") ||
    dest.includes("rome") ||
    dest.includes("florence") ||
    dest.includes("venice") ||
    dest.includes("milan") ||
    dest.includes("sicily") ||
    dest.includes("greece") ||
    dest.includes("santorini") ||
    dest.includes("mykonos") ||
    dest.includes("athens") ||
    dest.includes("crete") ||
    dest.includes("spain") ||
    dest.includes("barcelona") ||
    dest.includes("madrid") ||
    dest.includes("portugal") ||
    dest.includes("lisbon") ||
    dest.includes("porto") ||
    dest.includes("turkey") ||
    dest.includes("croatia")

  if (isMediterranean) {
    const baseRatesUsd = { budget: 48, balanced: 110, luxury: 260 }
    const formatTier = (valUsd: number) => {
      if (currency === "INR") return Math.round((valUsd * fx) / 500) * 500
      if (currency === "EUR") return Math.round((valUsd * fx) / 5) * 5
      return Math.max(5, Math.round((valUsd * fx) / 5) * 5)
    }

    return {
      regionId: "mediterranean_southern_europe",
      regionLabel: "Mediterranean & Southern Europe",
      purchasingPowerLabel: "Moderate European Index",
      badgeColor: "amber",
      baseRatesUsd,
      dailyRates: {
        budget: formatTier(baseRatesUsd.budget),
        balanced: formatTier(baseRatesUsd.balanced),
        luxury: formatTier(baseRatesUsd.luxury),
      },
      description: "Calibrated for coastal Mediterranean living: cliffside B&Bs, trattorias, coastal transit & museum entry.",
    }
  }

  // 4. Japan & East Asia
  const isEastAsia =
    dest.includes("japan") ||
    dest.includes("tokyo") ||
    dest.includes("kyoto") ||
    dest.includes("osaka") ||
    dest.includes("hokkaido") ||
    dest.includes("korea") ||
    dest.includes("seoul") ||
    dest.includes("taiwan") ||
    dest.includes("taipei")

  if (isEastAsia) {
    const baseRatesUsd = { budget: 46, balanced: 115, luxury: 275 }
    const formatTier = (valUsd: number) => {
      if (currency === "JPY") return Math.round((valUsd * fx) / 500) * 500
      if (currency === "INR") return Math.round((valUsd * fx) / 500) * 500
      return Math.max(5, Math.round((valUsd * fx) / 5) * 5)
    }

    return {
      regionId: "east_asia",
      regionLabel: "Japan & East Asia",
      purchasingPowerLabel: "Mid-High Index",
      badgeColor: "purple",
      baseRatesUsd,
      dailyRates: {
        budget: formatTier(baseRatesUsd.budget),
        balanced: formatTier(baseRatesUsd.balanced),
        luxury: formatTier(baseRatesUsd.luxury),
      },
      description: "Authentic East Asian indices: traditional ryokans, high-speed rail, artisan gastronomy & cultural permits.",
    }
  }

  // 5. Western Europe & Global Premium Destinations
  const baseRatesUsd = { budget: 60, balanced: 135, luxury: 320 }
  const formatTier = (valUsd: number) => {
    if (currency === "INR") return Math.round((valUsd * fx) / 500) * 500
    if (currency === "JPY") return Math.round((valUsd * fx) / 500) * 500
    return Math.max(5, Math.round((valUsd * fx) / 5) * 5)
  }

  return {
    regionId: "western_europe_americas",
    regionLabel: "Western Europe & Global Destinations",
    purchasingPowerLabel: "Standard International Index",
    badgeColor: "rose",
    baseRatesUsd,
    dailyRates: {
      budget: formatTier(baseRatesUsd.budget),
      balanced: formatTier(baseRatesUsd.balanced),
      luxury: formatTier(baseRatesUsd.luxury),
    },
    description: "Realistic international standards: centrally located hotels, curated dining, panoramic rail & tours.",
  }
}

export interface EqualSplitBreakdown {
  totalBudget: number
  travelers: number
  daysCount: number
  currency: CurrencyCode
  symbol: string
  perPersonTotal: number
  dailyPerPerson: number
  dailyGroupTotal: number
}

/**
 * Calculates equal cost division per member/traveler with 100% mathematical precision.
 */
export function calculateEqualSplit(
  totalBudget: number,
  travelers: number,
  daysCount: number,
  currency: CurrencyCode = "USD"
): EqualSplitBreakdown {
  const t = Math.max(1, Math.round(travelers || 1))
  const d = Math.max(1, Math.round(daysCount || 1))
  const total = Math.max(0, Math.round(totalBudget || 0))
  const perPersonTotal = Math.round(total / t)
  const dailyPerPerson = Math.round(total / (t * d))
  const dailyGroupTotal = Math.round(total / d)

  return {
    totalBudget: total,
    travelers: t,
    daysCount: d,
    currency,
    symbol: CURRENCY_SYMBOLS[currency] || "$",
    perPersonTotal,
    dailyPerPerson,
    dailyGroupTotal,
  }
}

/**
 * Determine a realistic USD daily rate baseline per person based on destination and tier.
 * Never hardcodes city-specific prices, but respects regional purchasing power.
 */
function resolveBaseDailyUsd(destination: string | undefined, tier: BudgetTier, currency: CurrencyCode): number {
  const profile = resolveDestinationEconomicProfile(destination, currency)
  switch (tier) {
    case "budget":
      return profile.baseRatesUsd.budget
    case "luxury":
      return profile.baseRatesUsd.luxury
    case "ultra-luxury":
      return profile.baseRatesUsd.luxury * 1.8
    case "moderate":
    default:
      return profile.baseRatesUsd.balanced
  }
}

/**
 * Deterministic Travel Budget Calculation Engine
 * Acts as the SINGLE SOURCE OF TRUTH for all budget numbers across AERIS.
 */
export function calculateTripBudget(params: BudgetInputParams): DetailedTripBudget {
  const {
    destination,
    days = 3,
    travelers = 2,
    budgetTier: rawTier = "moderate",
    currency = "USD",
    customDailyRateUsd,
  } = params

  const durationDays = Math.max(1, Math.min(60, Math.round(Number(days) || 3)))
  const travelerCount = Math.max(1, Math.min(30, Math.round(Number(travelers) || 2)))

  const tier: BudgetTier =
    rawTier === "budget" || rawTier === "luxury" || rawTier === "ultra-luxury"
      ? (rawTier as BudgetTier)
      : "moderate"

  // Base daily rate in USD per person
  let baseDailyUsd: number
  if (customDailyRateUsd && customDailyRateUsd >= 15 && customDailyRateUsd <= 5000) {
    baseDailyUsd = customDailyRateUsd
  } else {
    baseDailyUsd = resolveBaseDailyUsd(destination, tier, currency)
  }

  const fxRate = FX_RATES_FROM_USD[currency] || 1.0
  const symbol = CURRENCY_SYMBOLS[currency] || "$"

  // 1. Single core unit: Daily cost per person in target currency
  const dailyAveragePerPerson = Math.max(1, Math.round(baseDailyUsd * fxRate))

  // 2. Strict mathematical derivatives
  const totalPerPerson = dailyAveragePerPerson * durationDays
  const totalGroup = totalPerPerson * travelerCount
  const dailyGroup = dailyAveragePerPerson * travelerCount

  // 3. Proportional realistic ranges (-15% to +20%)
  const rangeMinDailyPerPerson = Math.round(dailyAveragePerPerson * 0.85)
  const rangeMaxDailyPerPerson = Math.round(dailyAveragePerPerson * 1.20)
  const rangeMinGroup = rangeMinDailyPerPerson * durationDays * travelerCount
  const rangeMaxGroup = rangeMaxDailyPerPerson * durationDays * travelerCount

  // 4. Category percentage allocations (Must strictly sum to 100%)
  const stayPct = 42
  const foodPct = 28
  const expPct = 18
  const transitPct = 12 // 42 + 28 + 18 + 12 = 100

  // 5. Category daily calculations per person
  const staysDaily = Math.round((dailyAveragePerPerson * stayPct) / 100)
  const foodDaily = Math.round((dailyAveragePerPerson * foodPct) / 100)
  const expDaily = Math.round((dailyAveragePerPerson * expPct) / 100)
  // Exact remainder guarantee for daily per person
  const transitDaily = dailyAveragePerPerson - (staysDaily + foodDaily + expDaily)

  // 6. Category group totals (Exact remainder guarantee to prevent integer drift)
  const staysGroup = staysDaily * durationDays * travelerCount
  const foodGroup = foodDaily * durationDays * travelerCount
  const expGroup = expDaily * durationDays * travelerCount
  // Exact remainder guarantee: Sum of all 4 group totals ALWAYS strictly equals totalGroup
  const transitGroup = totalGroup - (staysGroup + foodGroup + expGroup)

  const breakdown: BudgetItemDetail[] = [
    {
      category: "Stays",
      title:
        tier === "luxury" || tier === "ultra-luxury"
          ? "Boutique Heritage Suites & Villas"
          : tier === "budget"
          ? "Comfort Hostels & Guesthouses"
          : "Selected 3-4★ Boutique Hotels",
      dailyPerPerson: staysDaily,
      totalPerPerson: staysDaily * durationDays,
      totalGroup: staysGroup,
      percentage: stayPct,
      assumptions: "Double-occupancy room basis with breakfast included.",
    },
    {
      category: "Gastronomy",
      title: "Daily Meals, Authentic Cafes & Beverages",
      dailyPerPerson: foodDaily,
      totalPerPerson: foodDaily * durationDays,
      totalGroup: foodGroup,
      percentage: foodPct,
      assumptions: "3 daily meals featuring authentic regional specialties and local cafes.",
    },
    {
      category: "Experiences & Entry",
      title: "Attraction Admissions, Permits & Shrines",
      dailyPerPerson: expDaily,
      totalPerPerson: expDaily * durationDays,
      totalGroup: expGroup,
      percentage: expPct,
      assumptions: "Standard adult admissions for core viewpoints, heritage monuments, and parks.",
    },
    {
      category: "Transit & Fuel",
      title: "Local Cabs, Fuel, Parking & Transit",
      dailyPerPerson: transitDaily,
      totalPerPerson: transitDaily * durationDays,
      totalGroup: transitGroup,
      percentage: transitPct,
      assumptions: "Local transfers, scenic route vehicle hire, and parking tolls.",
    },
  ]

  return {
    destination,
    currency,
    symbol,
    durationDays,
    travelers: travelerCount,
    budgetTier: tier,
    dailyAveragePerPerson,
    totalPerPerson,
    dailyGroup,
    totalGroup,
    rangeMinDailyPerPerson,
    rangeMaxDailyPerPerson,
    rangeMinGroup,
    rangeMaxGroup,
    breakdown,
    costBreakdownPercentages: [stayPct, foodPct, expPct, transitPct],
    baseDailyUsd,
    fxRate,
    isEstimate: true,
    dataSource: "AERIS Curated Telemetry & Statistical Norms",
    disclaimer:
      "All figures represent realistic market estimates. Actual expenses fluctuate with seasonal demand, advance bookings, and local choices. Not a confirmed reservation price.",
    lastUpdated: new Date().toISOString().split("T")[0],
  }
}

/**
 * Clean universal currency formatter.
 * Strips any leading currency symbol and formats strictly from numeric value.
 */
export function formatCurrency(
  amount: number | string,
  currency: CurrencyCode = "USD"
): string {
  if (typeof amount === "string" && amount.trim().toLowerCase() === "free") {
    return "Free"
  }
  const rawNum = typeof amount === "number" ? amount : Number(String(amount).replace(/[^0-9.-]/g, ""))
  const num = isNaN(rawNum) ? 0 : rawNum
  const symbol = CURRENCY_SYMBOLS[currency] || "$"
  return `${symbol}${Math.round(num).toLocaleString()}`
}

/**
 * Seamless Currency Recalculator
 * Takes an existing DetailedTripBudget and converts it to a new target currency
 * using the preserved baseDailyUsd rate, ensuring zero compounding drift.
 */
export function recalculateBudget(
  existingBudget: DetailedTripBudget,
  targetCurrency: CurrencyCode
): DetailedTripBudget {
  return calculateTripBudget({
    destination: existingBudget.destination,
    days: existingBudget.durationDays,
    travelers: existingBudget.travelers,
    budgetTier: existingBudget.budgetTier,
    currency: targetCurrency,
    customDailyRateUsd: existingBudget.baseDailyUsd,
  })
}
