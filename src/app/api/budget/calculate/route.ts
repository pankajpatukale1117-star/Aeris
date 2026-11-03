import { NextResponse } from "next/server"
import { calculateTripBudget } from "@/lib/budget/budget-calculator"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { destination, days = 3, travelers = 2, budgetTier = "moderate", currency = "USD" } = body

    const budget = calculateTripBudget({
      destination,
      days: Number(days),
      travelers: Number(travelers),
      budgetTier,
      currency,
    })

    return NextResponse.json({ success: true, budget })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to calculate budget." },
      { status: 500 }
    )
  }
}

