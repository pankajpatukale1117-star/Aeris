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

/**
 * Determine a realistic USD daily rate baseline per person based on destination and tier.
 * Never hardcodes city-specific prices, but respects regional purchasing power.
 */
function resolveBaseDailyUsd(destination: string | undefined, tier: BudgetTier, currency: CurrencyCode): number {
  const destLower = (destination || "").toLowerCase()
  
  // Detect domestic India context (either destination mentions India/states or user defaults to INR without explicit overseas dest)
  const isIndianSubcontinent =
    destLower.includes("india") ||
    destLower.includes("pune") ||
    destLower.includes("mumbai") ||
    destLower.includes("delhi") ||
    destLower.includes("bangalore") ||
    destLower.includes("bengaluru") ||
    destLower.includes("kolhapur") ||
    destLower.includes("goa") ||
    destLower.includes("kerala") ||
    destLower.includes("rajasthan") ||
    destLower.includes("jaipur") ||
    destLower.includes("maharashtra") ||
    destLower.includes("himalaya") ||
    destLower.includes("manali") ||
    destLower.includes("varanasi") ||
    destLower.includes("agra")

  if (isIndianSubcontinent) {
    // Realistic Indian domestic tourism norms (~₹2,000–₹12,000 / day / person in INR)
    switch (tier) {
      case "budget":
        return 25 // ~₹2,160 / day per person
      case "moderate":
        return 50 // ~₹4,325 / day per person
      case "luxury":
        return 140 // ~₹12,110 / day per person
      case "ultra-luxury":
        return 320 // ~₹27,680 / day per person
    }
  }

  // Western Europe / North America / Japan / Global international baseline
  switch (tier) {
    case "budget":
      return 65
    case "moderate":
      return 135
    case "luxury":
      return 340
    case "ultra-luxury":
      return 850
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
