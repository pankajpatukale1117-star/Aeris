import { calculateTripBudget, recalculateBudget } from "./budget-calculator"
import type { CurrencyCode, BudgetTier } from "./budget-calculator"

interface TestCase {
  name: string
  destination: string
  days: number
  travelers: number
  budgetTier: BudgetTier
  currency: CurrencyCode
}

const testCases: TestCase[] = [
  // 1. One-day Pune trip (1 traveler & 2 travelers)
  {
    name: "1-day Pune trip (Solo)",
    destination: "Pune, Maharashtra, India",
    days: 1,
    travelers: 1,
    budgetTier: "moderate",
    currency: "INR",
  },
  {
    name: "1-day Pune trip (Couple)",
    destination: "Pune, Maharashtra, India",
    days: 1,
    travelers: 2,
    budgetTier: "moderate",
    currency: "INR",
  },
  // 2. Three-day Pune trip (2 travelers & 4 travelers)
  {
    name: "3-day Pune trip (Couple - Bug scenario)",
    destination: "Pune, Maharashtra",
    days: 3,
    travelers: 2,
    budgetTier: "moderate",
    currency: "INR",
  },
  {
    name: "3-day Pune trip (Group of 4)",
    destination: "Pune, Maharashtra",
    days: 3,
    travelers: 4,
    budgetTier: "budget",
    currency: "INR",
  },
  // 3. Five-day Mumbai trip (2 travelers, luxury)
  {
    name: "5-day Mumbai trip (Couple, Luxury)",
    destination: "Mumbai, India",
    days: 5,
    travelers: 2,
    budgetTier: "luxury",
    currency: "INR",
  },
  {
    name: "5-day Mumbai trip (Solo, Moderate)",
    destination: "Mumbai, Maharashtra",
    days: 5,
    travelers: 1,
    budgetTier: "moderate",
    currency: "INR",
  },
  // 4. Seven-day international trip (Tokyo, Paris, Zurich)
  {
    name: "7-day Tokyo trip (Couple, Moderate, JPY)",
    destination: "Tokyo, Japan",
    days: 7,
    travelers: 2,
    budgetTier: "moderate",
    currency: "JPY",
  },
  {
    name: "7-day Paris trip (Family of 4, Luxury, EUR)",
    destination: "Paris, France",
    days: 7,
    travelers: 4,
    budgetTier: "luxury",
    currency: "EUR",
  },
  {
    name: "7-day New York trip (Solo, Ultra-Luxury, USD)",
    destination: "New York, USA",
    days: 7,
    travelers: 1,
    budgetTier: "ultra-luxury",
    currency: "USD",
  },
]

export function runBudgetTests() {
  console.log("================================================================================")
  console.log("       AERIS DETERMINISTIC BUDGET ENGINE — MATHEMATICAL AUDIT VERIFICATION       ")
  console.log("================================================================================\n")

  let passedAll = true

  for (const tc of testCases) {
    const budget = calculateTripBudget({
      destination: tc.destination,
      days: tc.days,
      travelers: tc.travelers,
      budgetTier: tc.budgetTier,
      currency: tc.currency,
    })

    // 1. Sum of expense categories must equal total trip cost
    const sumCategories = budget.breakdown.reduce((sum, item) => sum + item.totalGroup, 0)
    const rule1 = sumCategories === budget.totalGroup

    // 2. Total trip cost / travellers must equal per-person trip cost
    const rule2 = Math.round(budget.totalGroup / budget.travelers) === budget.totalPerPerson

    // 3. Per-person trip cost / durationDays must equal daily cost per person
    const rule3 = Math.round(budget.totalPerPerson / budget.durationDays) === budget.dailyAveragePerPerson

    // 4. Doughnut percentages must add up to exactly 100%
    const sumPercentages = budget.costBreakdownPercentages.reduce((sum, p) => sum + p, 0)
    const rule4 = sumPercentages === 100

    // 5. Sum of daily per-person breakdown must equal dailyAveragePerPerson
    const sumDailyPerPerson = budget.breakdown.reduce((sum, item) => sum + item.dailyPerPerson, 0)
    const rule5 = sumDailyPerPerson === budget.dailyAveragePerPerson

    // 6. Test seamless currency recalculation without compounding drift
    const convertedToUsd = recalculateBudget(budget, "USD")
    const convertedBack = recalculateBudget(convertedToUsd, tc.currency)
    const rule6 = convertedBack.dailyAveragePerPerson === budget.dailyAveragePerPerson

    const testPassed = rule1 && rule2 && rule3 && rule4 && rule5 && rule6
    if (!testPassed) passedAll = false

    console.log(`[${testPassed ? "PASS" : "FAIL"}] ${tc.name}`)
    console.log(`       Destination: ${budget.destination} | Days: ${budget.durationDays} | Travelers: ${budget.travelers} | Tier: ${budget.budgetTier}`)
    console.log(`       Daily / Person: ${budget.symbol}${budget.dailyAveragePerPerson.toLocaleString()}`)
    console.log(`       Total / Person: ${budget.symbol}${budget.totalPerPerson.toLocaleString()}`)
    console.log(`       Total Group:    ${budget.symbol}${budget.totalGroup.toLocaleString()} (Category Sum: ${budget.symbol}${sumCategories.toLocaleString()})`)
    console.log(`       Daily Range:    ${budget.symbol}${budget.rangeMinDailyPerPerson.toLocaleString()} — ${budget.symbol}${budget.rangeMaxDailyPerPerson.toLocaleString()} / day`)
    console.log(`       Group Range:    ${budget.symbol}${budget.rangeMinGroup.toLocaleString()} — ${budget.symbol}${budget.rangeMaxGroup.toLocaleString()}`)
    console.log(`       Percentages:    ${budget.costBreakdownPercentages.join("% + ")}% = ${sumPercentages}%`)
    console.log(`       Rules Check:    SumMatch=${rule1} | PerPersonMatch=${rule2} | DailyMatch=${rule3} | 100%Sum=${rule4} | NoDriftFX=${rule6}\n`)
  }

  console.log("================================================================================")
  if (passedAll) {
    console.log(" RESULT: ALL 9 COMPREHENSIVE TEST SUITES PASSED WITH 100% MATHEMATICAL PRECISION ")
  } else {
    console.log(" RESULT: ONE OR MORE TESTS FAILED ")
  }
  console.log("================================================================================")
}

// Run tests
runBudgetTests()
