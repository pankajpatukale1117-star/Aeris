"use client"

import * as React from "react"
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  DoughnutController,
  ChartData,
  ChartOptions,
} from "chart.js"
import { PieChart } from "lucide-react"
import { DetailedTripBudget } from "@/lib/budget/budget-calculator"

// Register required Chart.js controllers and elements
if (typeof window !== "undefined") {
  ChartJS.register(ArcElement, Tooltip, Legend, DoughnutController)
}

interface BudgetDoughnutProps {
  budgetTelemetry?: DetailedTripBudget
  costBreakdown?: [number, number, number, number] // [Stays, Gastronomy, Experiences, Transit]
  dailyCost?: number
  budgetMin?: number
  budgetMax?: number
  currency?: string
  currencySymbol?: string
}

export function BudgetDoughnutChart({
  budgetTelemetry,
  costBreakdown: propBreakdown = [42, 28, 18, 12],
  dailyCost: propDaily = 130,
  budgetMin: propMin = 80,
  budgetMax: propMax = 200,
  currency: propCurrency = "USD",
  currencySymbol: propSymbol = "$",
}: BudgetDoughnutProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const chartInstanceRef = React.useRef<ChartJS<"doughnut"> | null>(null)

  // Derive all data from single source of truth budgetTelemetry if available
  const dailyCost = budgetTelemetry?.dailyAveragePerPerson ?? propDaily
  const budgetMin = budgetTelemetry?.rangeMinDailyPerPerson ?? propMin
  const budgetMax = budgetTelemetry?.rangeMaxDailyPerPerson ?? propMax
  const costBreakdown = budgetTelemetry?.costBreakdownPercentages ?? propBreakdown
  const currencySymbol = budgetTelemetry?.symbol ?? propSymbol

  const labels = ["Boutique Stays", "Gastronomy & Dining", "Admissions & Entry", "Transit & Rail"]
  const colors = [
    "rgba(232, 213, 181, 0.95)", // Champagne Gold
    "rgba(56, 189, 248, 0.92)",  // Sky Cyan
    "rgba(52, 211, 153, 0.88)",  // Emerald Luxe
    "rgba(148, 163, 184, 0.75)", // Slate Silver
  ]
  const hoverColors = [
    "#f5ebd7",
    "#7dd3fc",
    "#6ee7b7",
    "#cbd5e1",
  ]

  // Category daily amounts per person (exact from breakdown if telemetry provided, else proportional)
  const categoryAmounts = budgetTelemetry?.breakdown
    ? budgetTelemetry.breakdown.map((b) => b.dailyPerPerson)
    : costBreakdown.map((percent) => Math.round((dailyCost * percent) / 100))

  React.useEffect(() => {
    if (!canvasRef.current) return

    // Destroy existing instance to prevent canvas overlap
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy()
    }

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    const data: ChartData<"doughnut"> = {
      labels,
      datasets: [
        {
          data: costBreakdown,
          backgroundColor: colors,
          hoverBackgroundColor: hoverColors,
          borderWidth: 2,
          borderColor: "rgba(5, 10, 16, 0.8)",
          hoverBorderColor: "#ffffff",
          hoverOffset: 6,
        },
      ],
    }

    const options: ChartOptions<"doughnut"> = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "74%",
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 850,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "rgba(10, 18, 30, 0.92)",
          titleColor: "#f1f5f9",
          bodyColor: "#e8d5b5",
          borderColor: "rgba(255, 255, 255, 0.15)",
          borderWidth: 1,
          padding: 10,
          cornerRadius: 12,
          boxPadding: 4,
          callbacks: {
            label: (context) => {
              const idx = context.dataIndex
              const percent = costBreakdown[idx]
              const amount = categoryAmounts[idx]
              return ` ${percent}% (${currencySymbol}${amount.toLocaleString()} / day)`
            },
          },
        },
      },
    }

    chartInstanceRef.current = new ChartJS(ctx, {
      type: "doughnut",
      data,
      options,
    })

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
      }
    }
  }, [costBreakdown, dailyCost, currencySymbol, categoryAmounts])

  return (
    <div className="glass-shell rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
      {/* Title & Telemetry Daily Range */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-[#38bdf8]" />
          <span className="text-xs font-semibold text-white uppercase tracking-wider">
            Budget Telemetry Doughnut
          </span>
        </div>
        <span className="text-[11px] font-mono text-[#e8d5b5]">
          {currencySymbol}{budgetMin.toLocaleString()} — {currencySymbol}{budgetMax.toLocaleString()} / day
        </span>
      </div>

      {/* Doughnut Chart Canvas with Center Cutout Display */}
      <div className="relative w-full h-48 sm:h-52 flex items-center justify-center">
        <canvas ref={canvasRef} />

        {/* Center Cutout Floating Telemetry */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-medium">
            Est. Daily Cadence
          </span>
          <div className="font-editorial text-2xl sm:text-3xl font-bold text-white mt-0.5 tracking-tight">
            {currencySymbol}{dailyCost.toLocaleString()}
          </div>
          <span className="text-[10px] text-[#38bdf8] font-mono">
            per traveler
          </span>
        </div>
      </div>

      {/* Segment Legend with Percentages & Daily Amounts */}
      <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
        {labels.map((label, idx) => (
          <div
            key={label}
            className="glass-card p-2.5 rounded-xl border border-white/10 flex items-center justify-between"
          >
            <div className="flex items-center gap-2 truncate">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: colors[idx] }}
              />
              <span className="text-[11px] text-slate-300 truncate">{label}</span>
            </div>
            <div className="text-right shrink-0 pl-2">
              <span className="text-xs font-semibold text-white">
                {costBreakdown[idx]}%
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                {currencySymbol}{categoryAmounts[idx]?.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
