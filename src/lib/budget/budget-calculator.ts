/**
 * AERIS Realistic Travel Budget Engine
 * Generates transparent, itemized travel expense projections with
 * explicit assumptions, per-person rates, group totals, and currency conversion.
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

export interface BudgetItemDetail {
  category: "Stays" | "Gastronomy" | "Experiences & Entry" | "Transit & Fuel" | "Contingency"
  title: string
  dailyPerPerson: number
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
  dailyAveragePerPerson: number
  totalPerPerson: number
  totalGroup: number
  rangeMinGroup: number
  rangeMaxGroup: number
  breakdown: BudgetItemDetail[]
  costBreakdownPercentages: [number, number, number, number] // Stays, Food, Experiences, Transit
  dataSource: "AERIS Curated Telemetry & Statistical Norms"
  disclaimer: "All figures represent realistic market estimates. Actual expenses fluctuate with seasonal demand, advance bookings, and local choices. Not a confirmed reservation price."
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

export function calculateTripBudget(params: BudgetInputParams): DetailedTripBudget {
  const {
    days = 3,
    travelers = 2,
    budgetTier: rawTier = "moderate",
    currency = "USD",
    customDailyRateUsd,
  } = params

  const durationDays = Math.max(1, Math.min(30, Number(days) || 3))
  const travelerCount = Math.max(1, Math.min(20, Number(travelers) || 2))

  const tier: BudgetTier =
    rawTier === "budget" || rawTier === "luxury" || rawTier === "ultra-luxury"
      ? (rawTier as BudgetTier)
      : "moderate"

  // Base daily rate in USD per person based on tier
  let baseDailyUsd: number
  if (customDailyRateUsd && customDailyRateUsd > 20) {
    baseDailyUsd = customDailyRateUsd
  } else {
    switch (tier) {
      case "budget":
        baseDailyUsd = 65
        break
      case "moderate":
        baseDailyUsd = 135
        break
      case "luxury":
        baseDailyUsd = 340
        break
      case "ultra-luxury":
        baseDailyUsd = 850
        break
    }
  }

  const fxRate = FX_RATES_FROM_USD[currency] || 1.0
  const symbol = CURRENCY_SYMBOLS[currency] || "$"

  // Convert daily base to target currency
  const dailyPerPerson = Math.round(baseDailyUsd * fxRate)
  const totalPerPerson = Math.round(dailyPerPerson * durationDays)
  const totalGroup = Math.round(totalPerPerson * travelerCount)

  // -15% and +20% estimation bounds
  const rangeMinGroup = Math.round(totalGroup * 0.85)
  const rangeMaxGroup = Math.round(totalGroup * 1.2)

  // Category percentage allocations
  const stayPct = 42
  const foodPct = 28
  const expPct = 18
  const transitPct = 12

  const staysGroup = Math.round((totalGroup * stayPct) / 100)
  const foodGroup = Math.round((totalGroup * foodPct) / 100)
  const expGroup = Math.round((totalGroup * expPct) / 100)
  const transitGroup = Math.round((totalGroup * transitPct) / 100)

  const breakdown: BudgetItemDetail[] = [
    {
      category: "Stays",
      title: tier === "luxury" ? "Boutique Heritage Suites & Villas" : tier === "budget" ? "Comfort Hostels & Guesthouses" : "Selected 3-4★ Boutique Hotels",
      dailyPerPerson: Math.round((staysGroup / travelerCount) / durationDays),
      totalGroup: staysGroup,
      percentage: stayPct,
      assumptions: "Double-occupancy room basis with breakfast included.",
    },
    {
      category: "Gastronomy",
      title: "Daily Meals, Authentic Cafes & Beverages",
      dailyPerPerson: Math.round((foodGroup / travelerCount) / durationDays),
      totalGroup: foodGroup,
      percentage: foodPct,
      assumptions: "3 daily meals featuring authentic regional specialties and local coffee stops.",
    },
    {
      category: "Experiences & Entry",
      title: "Attraction Admissions, Permits & Shrines",
      dailyPerPerson: Math.round((expGroup / travelerCount) / durationDays),
      totalGroup: expGroup,
      percentage: expPct,
      assumptions: "Standard adult entry passes for core viewpoint parks, gardens, and heritage monuments.",
    },
    {
      category: "Transit & Fuel",
      title: "Local Cabs, Fuel, Parking & Transit",
      dailyPerPerson: Math.round((transitGroup / travelerCount) / durationDays),
      totalGroup: transitGroup,
      percentage: transitPct,
      assumptions: "Local transfers, scenic route vehicle hire, and parking tolls.",
    },
  ]

  return {
    currency,
    symbol,
    durationDays,
    travelers: travelerCount,
    budgetTier: tier,
    dailyAveragePerPerson: dailyPerPerson,
    totalPerPerson,
    totalGroup,
    rangeMinGroup,
    rangeMaxGroup,
    breakdown,
    costBreakdownPercentages: [stayPct, foodPct, expPct, transitPct],
    dataSource: "AERIS Curated Telemetry & Statistical Norms",
    disclaimer:
      "All figures represent realistic market estimates. Actual expenses fluctuate with seasonal demand, advance bookings, and local choices. Not a confirmed reservation price.",
    lastUpdated: new Date().toISOString().split("T")[0],
  }
}

