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
import { DollarSign, PieChart, Sparkles } from "lucide-react"

// Register required Chart.js controllers and elements
if (typeof window !== "undefined") {
  ChartJS.register(ArcElement, Tooltip, Legend, DoughnutController)
}

interface BudgetDoughnutProps {
  costBreakdown: [number, number, number, number] // [Stays, Gastronomy, Experiences, Transit]
  dailyCost: number
  budgetMin: number
  budgetMax: number
  currency?: "USD" | "INR" | "EUR" | "JPY"
  currencySymbol?: string
}

export function BudgetDoughnutChart({
  costBreakdown = [45, 30, 15, 10],
  dailyCost = 130,
  budgetMin = 80,
  budgetMax = 200,
  currency = "USD",
  currencySymbol = "$",
}: BudgetDoughnutProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const chartInstanceRef = React.useRef<ChartJS<"doughnut"> | null>(null)

  const labels = ["Boutique Stays", "Gastronomy & Salons", "Private Access", "Transit & Rail"]
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

  // Calculate approximate daily amount per category
  const categoryAmounts = costBreakdown.map((percent) =>
    Math.round((dailyCost * percent) / 100)
  )

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
              return ` ${percent}% (${currencySymbol}${amount} / day)`
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
  }, [costBreakdown, dailyCost, currencySymbol])

  return (
    <div className="glass-shell rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
      {/* Title & Telemetry Range */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-[#38bdf8]" />
          <span className="text-xs font-semibold text-white uppercase tracking-wider">
            Budget Telemetry Doughnut
          </span>
        </div>
        <span className="text-[11px] font-mono text-[#e8d5b5]">
          {currencySymbol}{budgetMin} — {currencySymbol}{budgetMax} / day
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
            {currencySymbol}{dailyCost}
          </div>
          <span className="text-[10px] text-[#38bdf8] font-mono">
            per traveler
          </span>
        </div>
      </div>

      {/* Segment Legend with Percentages & Dollar Amounts */}
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
                {currencySymbol}{categoryAmounts[idx]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

