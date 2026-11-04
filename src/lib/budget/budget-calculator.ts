/**
 * AERIS Deterministic Travel Budget Engine
 * Single Source of Truth for Travel Budget Calculations.
 *
 * Guarantees Mathematical Invariants:
 * 1. dailyCostPerPerson = Math.round(baseDailyUsd * regionalMultiplier * fxRate)
 * 2. totalPerPerson = dailyCostPerPerson * durationDays
 * 3. totalTripCost = totalPerPerson * travelers
 * 4. dailyCostGroup = dailyCostPerPerson * travelers
 * 5. totalTripCost / travelers === totalPerPerson
 * 6. totalPerPerson / durationDays === dailyCostPerPerson
 * 7. Sum of category amounts === totalTripCost (exact to the last cent/rupee)
 * 8. Category percentages sum to 100% exactly ([42, 28, 18, 12])
 * 9. Daily range: dailyMinPerPerson and dailyMaxPerPerson for daily cadence
 * 10. Total range: totalMinGroup and totalMaxGroup for overall trip
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

// Exchange rates relative to 1 USD (Updated Q1 2026 baseline)
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

// Regional Purchasing Power Parity (PPP) & Cost of Living Index relative to US baseline (1.0)
export function getRegionalCostFactor(destination?: string): number {
  if (!destination) return 1.0
  const d = destination.toLowerCase()

  // South Asia & Indian Subcontinent
  if (
    d.includes("india") || d.includes("pune") || d.includes("mumbai") ||
    d.includes("delhi") || d.includes("kolhapur") || d.includes("goa") ||
    d.includes("mahabaleshwar") || d.includes("rajasthan") || d.includes("kerala") ||
    d.includes("jaipur") || d.includes("bengaluru") || d.includes("bangalore") ||
    d.includes("chennai") || d.includes("hyderabad") || d.includes("kolkata") ||
    d.includes("nepal") || d.includes("sri lanka") || d.includes("bangladesh")
  ) {
    if (d.includes("mumbai") || d.includes("delhi") || d.includes("bengaluru") || d.includes("bangalore")) {
      return 0.48 // Tier-1 Indian Metros
    }
    return 0.40 // Standard Indian Cultural & Nature Sanctuaries
  }

  // Southeast Asia
  if (
    d.includes("thailand") || d.includes("vietnam") || d.includes("indonesia") ||
    d.includes("bali") || d.includes("philippines") || d.includes("cambodia") ||
    d.includes("laos") || d.includes("malaysia")
  ) {
    return 0.50
  }

  // Ultra-High Cost Global Capitals & Alpine Escapes
  if (
    d.includes("switzerland") || d.includes("zürich") || d.includes("geneva") ||
    d.includes("zermatt") || d.includes("norway") || d.includes("iceland") ||
    d.includes("new york") || d.includes("san francisco") || d.includes("singapore") ||
    d.includes("dubai") || d.includes("monaco")
  ) {
    return 1.35
  }

  // Japan & East Asia
  if (
    d.includes("japan") || d.includes("tokyo") || d.includes("kyoto") ||
    d.includes("osaka") || d.includes("korea") || d.includes("seoul")
  ) {
    return 0.95
  }

  // Southern / Eastern Europe, Latin America, Middle East
  if (
    d.includes("mexico") || d.includes("peru") || d.includes("colombia") ||
    d.includes("brazil") || d.includes("argentina") || d.includes("portugal") ||
    d.includes("greece") || d.includes("turkey") || d.includes("morocco") ||
    d.includes("egypt") || d.includes("spain") || d.includes("italy")
  ) {
    return 0.85
  }

  // Western Europe / North America standard benchmark
  return 1.00
}

export interface BudgetItemDetail {
  key: "stays" | "food" | "activities" | "transit"
  category: "Stays" | "Gastronomy" | "Experiences & Entry" | "Transit & Fuel"
  title: string
  dailyPerPerson: number
  totalPerPerson: number
  totalGroup: number
  percentage: number
  assumptions: string
}

export interface DetailedTripBudget {
  currency: CurrencyCode
  symbol: string
  durationDays: number
  travelers: number
  budgetTier: BudgetTier
  regionalMultiplier: number

  // ─── Per-Person Calculations ───
  dailyCostPerPerson: number       // Base daily cadence per traveler
  dailyAveragePerPerson: number    // Alias for backwards compatibility
  totalPerPerson: number           // dailyCostPerPerson * durationDays
  dailyMinPerPerson: number        // -15% daily per person lower bound
  dailyMaxPerPerson: number        // +20% daily per person upper bound

  // ─── Group Total Calculations ───
  totalTripCost: number            // totalPerPerson * travelers
  totalGroup: number               // Alias for backwards compatibility (totalTripCost)
  dailyCostGroup: number           // dailyCostPerPerson * travelers
  totalMinGroup: number            // -15% total group lower bound
  totalMaxGroup: number            // +20% total group upper bound
  rangeMinGroup: number            // Alias for backwards compatibility (totalMinGroup)
  rangeMaxGroup: number            // Alias for backwards compatibility (totalMaxGroup)

  // ─── Categories & Visual Telemetry ───
  breakdown: BudgetItemDetail[]
  costBreakdownPercentages: [number, number, number, number] // [42, 28, 18, 12] summing to 100%

  dataSource: string
  disclaimer: string
  assumptions: string
  isEstimated: boolean
  lastUpdated: string
}

export interface BudgetInputParams {
  destination?: string
  days: number
  travelers?: number
  budgetTier?: BudgetTier | string
  currency?: CurrencyCode | string
  customDailyRateUsd?: number
}

export function calculateTripBudget(params: BudgetInputParams): DetailedTripBudget {
  const {
    destination = "",
    days = 3,
    travelers = 2,
    budgetTier: rawTier = "moderate",
    currency = "USD",
    customDailyRateUsd,
  } = params

  const durationDays = Math.max(1, Math.min(30, Math.round(Number(days)) || 3))
  const travelerCount = Math.max(1, Math.min(20, Math.round(Number(travelers)) || 2))

  const tier: BudgetTier =
    rawTier === "budget" || rawTier === "luxury" || rawTier === "ultra-luxury"
      ? (rawTier as BudgetTier)
      : "moderate"

  // 1. Base USD daily benchmark per tier
  let tierBaseUsd: number
  if (customDailyRateUsd && customDailyRateUsd > 10) {
    tierBaseUsd = customDailyRateUsd
  } else {
    switch (tier) {
      case "budget":
        tierBaseUsd = 50
        break
      case "moderate":
        tierBaseUsd = 120
        break
      case "luxury":
        tierBaseUsd = 320
        break
      case "ultra-luxury":
        tierBaseUsd = 750
        break
    }
  }

  // 2. Adjust for destination cost of living / regional parity index
  const regionalMultiplier = getRegionalCostFactor(destination)
  const effectiveDailyUsd = tierBaseUsd * regionalMultiplier

  // 3. FX Rate Conversion
  const validCurrency: CurrencyCode = FX_RATES_FROM_USD[currency as CurrencyCode]
    ? (currency as CurrencyCode)
    : "USD"
  const fxRate = FX_RATES_FROM_USD[validCurrency]
  const symbol = CURRENCY_SYMBOLS[validCurrency]

  // 4. Exact Integer Per-Person Calculations in Target Currency
  const dailyCostPerPerson = Math.max(1, Math.round(effectiveDailyUsd * fxRate))
  const totalPerPerson = dailyCostPerPerson * durationDays

  // 5. Exact Integer Group Total Calculations
  const totalTripCost = totalPerPerson * travelerCount
  const dailyCostGroup = dailyCostPerPerson * travelerCount

  // 6. Range bounds: explicit daily bounds for daily display, total bounds for trip summary
  const dailyMinPerPerson = Math.max(1, Math.round(dailyCostPerPerson * 0.85))
  const dailyMaxPerPerson = Math.max(dailyMinPerPerson + 1, Math.round(dailyCostPerPerson * 1.20))
  const totalMinGroup = Math.max(1, Math.round(totalTripCost * 0.85))
  const totalMaxGroup = Math.max(totalMinGroup + 1, Math.round(totalTripCost * 1.20))

  // 7. Category Allocations (Stays: 42%, Food: 28%, Experiences: 18%, Transit: 12%)
  // Residual allocation on Transit guarantees exact sum === totalTripCost with 0 rounding drift
  const staysPct = 42
  const foodPct = 28
  const expPct = 18
  const transitPct = 12

  const staysGroup = Math.round((totalTripCost * staysPct) / 100)
  const foodGroup = Math.round((totalTripCost * foodPct) / 100)
  const expGroup = Math.round((totalTripCost * expPct) / 100)
  const transitGroup = totalTripCost - (staysGroup + foodGroup + expGroup)

  const breakdown: BudgetItemDetail[] = [
    {
      key: "stays",
      category: "Stays",
      title:
        tier === "ultra-luxury"
          ? "Palatial Heritage Villas & 5★ Sanctuaries"
          : tier === "luxury"
          ? "Boutique Heritage Suites & Luxury Resorts"
          : tier === "budget"
          ? "Clean Boutique Hostels & Heritage Guesthouses"
          : "Selected 3–4★ Curated Hotels",
      dailyPerPerson: Math.round(staysGroup / travelerCount / durationDays),
      totalPerPerson: Math.round(staysGroup / travelerCount),
      totalGroup: staysGroup,
      percentage: staysPct,
      assumptions: "Double-occupancy room basis with breakfast and amenities included.",
    },
    {
      key: "food",
      category: "Gastronomy",
      title: "Daily Meals, Authentic Cafes & Street Salons",
      dailyPerPerson: Math.round(foodGroup / travelerCount / durationDays),
      totalPerPerson: Math.round(foodGroup / travelerCount),
      totalGroup: foodGroup,
      percentage: foodPct,
      assumptions: "Three daily meals featuring authentic regional specialties, tea/coffee stops, and snacks.",
    },
    {
      key: "activities",
      category: "Experiences & Entry",
      title: "Attraction Admissions, Temple Permits & Guides",
      dailyPerPerson: Math.round(expGroup / travelerCount / durationDays),
      totalPerPerson: Math.round(expGroup / travelerCount),
      totalGroup: expGroup,
      percentage: expPct,
      assumptions: "Standard adult entry passes for core viewpoint parks, heritage forts, museums, and shrines.",
    },
    {
      key: "transit",
      category: "Transit & Fuel",
      title: "Local Cabs, Fuel, Tolls & Transfers",
      dailyPerPerson: Math.round(transitGroup / travelerCount / durationDays),
      totalPerPerson: Math.round(transitGroup / travelerCount),
      totalGroup: transitGroup,
      percentage: transitPct,
      assumptions: "Local transfers, auto/cab fares, parking fees, and route tolls.",
    },
  ]

  return {
    currency: validCurrency,
    symbol,
    durationDays,
    travelers: travelerCount,
    budgetTier: tier,
    regionalMultiplier,
    dailyCostPerPerson,
    dailyAveragePerPerson: dailyCostPerPerson,
    totalPerPerson,
    dailyMinPerPerson,
    dailyMaxPerPerson,
    totalTripCost,
    totalGroup: totalTripCost,
    dailyCostGroup,
    totalMinGroup,
    totalMaxGroup,
    rangeMinGroup: totalMinGroup,
    rangeMaxGroup: totalMaxGroup,
    breakdown,
    costBreakdownPercentages: [staysPct, foodPct, expPct, transitPct],
    dataSource: "AERIS Curated Telemetry & Statistical Norms",
    disclaimer:
      "All figures represent realistic market estimates. Actual expenses fluctuate with seasonal demand, advance bookings, and local choices. Not a confirmed reservation price.",
    assumptions: `Based on ${travelerCount} traveler(s) for ${durationDays} day(s) at ${tier} tier with double occupancy.`,
    isEstimated: true,
    lastUpdated: new Date().toISOString().split("T")[0],
  }
}

/**
 * Deterministically converts a DetailedTripBudget to another currency.
 * Guarantees zero float drift and prevents double multiplication.
 */
export function convertBudget(
  sourceBudget: DetailedTripBudget,
  targetCurrency: CurrencyCode | string,
  destination?: string
): DetailedTripBudget {
  const validTarget: CurrencyCode = FX_RATES_FROM_USD[targetCurrency as CurrencyCode]
    ? (targetCurrency as CurrencyCode)
    : "USD"

  if (sourceBudget.currency === validTarget) {
    return sourceBudget
  }

  return calculateTripBudget({
    destination,
    days: sourceBudget.durationDays,
    travelers: sourceBudget.travelers,
    budgetTier: sourceBudget.budgetTier,
    currency: validTarget,
  })
}
