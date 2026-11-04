"use client"

import * as React from "react"
import {
  Calculator as CalcIcon,
  X,
  Copy,
  Check,
  RotateCcw,
  Users,
  Calendar,
  DollarSign,
  ArrowRight,
  Sparkles,
  Percent,
  Plus,
  Minus,
} from "lucide-react"
import {
  formatCurrency,
  CurrencyCode,
  CURRENCY_SYMBOLS,
  FX_RATES_FROM_USD,
} from "@/lib/budget/budget-calculator"
import { useToast } from "@/hooks/use-toast"

export interface TripCalculatorProps {
  isOpen: boolean
  onClose: () => void
  currency?: CurrencyCode
  currentPlannedTotal?: number
  currentTargetBudget?: number
  daysCount?: number
  onApplyCost?: (amount: number) => void
  onApplyTargetBudget?: (amount: number) => void
}

function evaluateMath(expr: string): number | null {
  try {
    const sanitized = expr
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/[^0-9.+\-*/]/g, "")
    if (!sanitized) return null
    // eslint-disable-next-line no-new-func
    const result = new Function(`return (${sanitized})`)()
    if (typeof result === "number" && !isNaN(result) && isFinite(result)) {
      return Math.round(result * 100) / 100
    }
    return null
  } catch {
    return null
  }
}

export function TripCalculator({
  isOpen,
  onClose,
  currency = "USD",
  currentPlannedTotal = 0,
  currentTargetBudget = 0,
  daysCount = 3,
  onApplyCost,
  onApplyTargetBudget,
}: TripCalculatorProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = React.useState<"standard" | "splitter">("standard")

  // ─── Standard Calculator State ──────────────────────────────────────────
  const [display, setDisplay] = React.useState("0")
  const [equation, setEquation] = React.useState("")
  const [tapeHistory, setTapeHistory] = React.useState<string[]>([])
  const [isNewInput, setIsNewInput] = React.useState(true)

  // ─── Travel Splitter State ──────────────────────────────────────────────
  const [splitBaseAmount, setSplitBaseAmount] = React.useState<number>(
    currentPlannedTotal > 0 ? currentPlannedTotal : currentTargetBudget > 0 ? currentTargetBudget : 1500
  )
  const [splitTravelers, setSplitTravelers] = React.useState<number>(2)
  const [splitDays, setSplitDays] = React.useState<number>(daysCount > 0 ? daysCount : 3)
  const [tipPercent, setTipPercent] = React.useState<number>(0)

  // Sync initial amounts when opened
  React.useEffect(() => {
    if (isOpen) {
      if (currentPlannedTotal > 0) {
        setSplitBaseAmount(currentPlannedTotal)
      } else if (currentTargetBudget > 0) {
        setSplitBaseAmount(currentTargetBudget)
      }
      if (daysCount > 0) {
        setSplitDays(daysCount)
      }
    }
  }, [isOpen, currentPlannedTotal, currentTargetBudget, daysCount])

  if (!isOpen) return null

  const currencySymbol = CURRENCY_SYMBOLS[currency] || "$"

  // ─── Standard Calc Handlers ─────────────────────────────────────────────
  const handleDigit = (digit: string) => {
    if (isNewInput) {
      setDisplay(digit === "." ? "0." : digit)
      setIsNewInput(false)
    } else {
      if (digit === "." && display.includes(".")) return
      if (display === "0" && digit !== ".") {
        setDisplay(digit)
      } else {
        setDisplay((prev) => prev + digit)
      }
    }
  }

  const handleOperator = (op: string) => {
    const currentVal = parseFloat(display) || 0
    if (equation && !isNewInput) {
      const fullExpr = `${equation} ${currentVal}`
      const intermediate = evaluateMath(fullExpr)
      if (intermediate !== null) {
        setDisplay(String(intermediate))
        setEquation(`${intermediate} ${op}`)
      } else {
        setEquation(`${currentVal} ${op}`)
      }
    } else {
      setEquation(`${currentVal} ${op}`)
    }
    setIsNewInput(true)
  }

  const handleEquals = () => {
    if (!equation) return
    const currentVal = parseFloat(display) || 0
    const fullExpr = `${equation} ${currentVal}`
    const result = evaluateMath(fullExpr)
    if (result !== null) {
      const tapeEntry = `${fullExpr} = ${result}`
      setTapeHistory((prev) => [tapeEntry, ...prev.slice(0, 4)])
      setDisplay(String(result))
      setEquation("")
      setIsNewInput(true)
    }
  }

  const handleClear = () => {
    setDisplay("0")
    setEquation("")
    setIsNewInput(true)
  }

  const handleBackspace = () => {
    if (isNewInput) return
    if (display.length <= 1) {
      setDisplay("0")
      setIsNewInput(true)
    } else {
      setDisplay((prev) => prev.slice(0, -1))
    }
  }

  const handlePercent = () => {
    const currentVal = parseFloat(display) || 0
    const percentVal = Math.round((currentVal / 100) * 100) / 100
    setDisplay(String(percentVal))
  }

  const handleNegate = () => {
    const currentVal = parseFloat(display) || 0
    setDisplay(String(-currentVal))
  }

  const handleQuickTip = (pct: number) => {
    const currentVal = parseFloat(display) || 0
    const tipAmount = (currentVal * pct) / 100
    const total = Math.round((currentVal + tipAmount) * 100) / 100
    setEquation(`${currentVal} + ${pct}% tip`)
    setDisplay(String(total))
    setIsNewInput(true)
  }

  const handleCopyCurrent = (val: string | number) => {
    navigator.clipboard.writeText(String(val))
    toast({
      title: "Copied to Clipboard",
      description: `${currencySymbol}${val} copied.`,
    })
  }

  // ─── Splitter Calculations ──────────────────────────────────────────────
  const baseWithTip = splitBaseAmount + (splitBaseAmount * tipPercent) / 100
  const perPersonTotal = Math.round((baseWithTip / Math.max(1, splitTravelers)) * 100) / 100
  const perPersonDaily = Math.round((perPersonTotal / Math.max(1, splitDays)) * 100) / 100
  const groupDaily = Math.round((baseWithTip / Math.max(1, splitDays)) * 100) / 100

  // Quick Currency Conversions for baseWithTip
  // Convert from active currency to USD, then to targets
  const activeRate = FX_RATES_FROM_USD[currency] || 1.0
  const amountInUsd = baseWithTip / activeRate

  const previewCurrencies: CurrencyCode[] = ["USD", "EUR", "INR", "JPY"]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050a10]/80 backdrop-blur-md animate-in fade-in duration-300">
      <div
        className="glass-shell w-full max-w-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col space-y-4 p-6 relative max-h-[90vh] overflow-y-auto scrollbar-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow backdrop element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#38bdf8]/15 via-[#e8d5b5]/10 to-transparent blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full glass-pill flex items-center justify-center text-[#38bdf8] shadow-[0_0_12px_rgba(56,189,248,0.3)]">
              <CalcIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
                <span>Trip Financial Calculator</span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#e8d5b5] glass-pill px-2 py-0.5 rounded-full">
                  {currency}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-light">
                Compute expenses, add tips, and calculate per-person and daily shares.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full glass-pill text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Close Calculator (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Mode Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10 relative z-10 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("standard")}
            className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "standard"
                ? "bg-[#e8d5b5] text-[#050a10] shadow-[0_0_10px_rgba(232,213,181,0.3)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <CalcIcon className="w-3.5 h-3.5" />
            <span>Numpad Math</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("splitter")}
            className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "splitter"
                ? "bg-[#38bdf8] text-[#050a10] shadow-[0_0_10px_rgba(56,189,248,0.3)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Split & Daily Rate</span>
          </button>
        </div>

        {/* ─── TAB 1: STANDARD / EXPENSE CALCULATOR ─────────────────────────── */}
        {activeTab === "standard" && (
          <div className="space-y-4 relative z-10">
            {/* Display Screen */}
            <div className="glass-card p-4 rounded-2xl border border-white/15 space-y-1 text-right">
              <div className="text-[11px] text-slate-400 font-mono h-4 overflow-hidden truncate">
                {equation || (tapeHistory[0] ? `Last: ${tapeHistory[0]}` : "0")}
              </div>
              <div className="text-3xl sm:text-4xl font-mono font-bold text-white tracking-tight flex items-baseline justify-end gap-1 overflow-x-auto scrollbar-none">
                <span className="text-sm font-semibold text-[#38bdf8]">{currencySymbol}</span>
                <span>{display}</span>
              </div>
            </div>

            {/* Quick Tip / Tax Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
              <span className="text-[10px] uppercase text-slate-400 shrink-0">Quick Tip:</span>
              {[10, 15, 18, 20].map((tip) => (
                <button
                  key={tip}
                  type="button"
                  onClick={() => handleQuickTip(tip)}
                  className="glass-pill px-2.5 py-1 text-[11px] font-mono text-slate-300 hover:text-white hover:border-[#38bdf8]/40 transition-all cursor-pointer shrink-0"
                >
                  +{tip}%
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleDigit("00")}
                className="glass-pill px-2.5 py-1 text-[11px] font-mono text-slate-300 hover:text-white shrink-0 ml-auto"
              >
                00
              </button>
            </div>

            {/* Numpad Keypad Grid */}
            <div className="grid grid-cols-4 gap-2 text-sm font-mono">
              <button
                type="button"
                onClick={handleClear}
                className="p-3.5 rounded-2xl glass-card text-rose-400 hover:text-rose-200 hover:bg-rose-500/10 font-bold transition-all cursor-pointer"
              >
                AC
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="p-3.5 rounded-2xl glass-card text-slate-300 hover:text-white font-bold transition-all cursor-pointer"
              >
                DEL
              </button>
              <button
                type="button"
                onClick={handlePercent}
                className="p-3.5 rounded-2xl glass-card text-slate-300 hover:text-white font-bold transition-all cursor-pointer"
              >
                %
              </button>
              <button
                type="button"
                onClick={() => handleOperator("÷")}
                className="p-3.5 rounded-2xl glass-pill text-[#38bdf8] hover:text-white font-bold transition-all cursor-pointer text-base"
              >
                ÷
              </button>

              <button
                type="button"
                onClick={() => handleDigit("7")}
                className="p-3.5 rounded-2xl glass-card text-white hover:bg-white/10 font-bold transition-all cursor-pointer"
              >
                7
              </button>
              <button
                type="button"
                onClick={() => handleDigit("8")}
                className="p-3.5 rounded-2xl glass-card text-white hover:bg-white/10 font-bold transition-all cursor-pointer"
              >
                8
              </button>
              <button
                type="button"
                onClick={() => handleDigit("9")}
                className="p-3.5 rounded-2xl glass-card text-white hover:bg-white/10 font-bold transition-all cursor-pointer"
              >
                9
              </button>
              <button
                type="button"
                onClick={() => handleOperator("×")}
                className="p-3.5 rounded-2xl glass-pill text-[#38bdf8] hover:text-white font-bold transition-all cursor-pointer text-base"
              >
                ×
              </button>

              <button
                type="button"
                onClick={() => handleDigit("4")}
                className="p-3.5 rounded-2xl glass-card text-white hover:bg-white/10 font-bold transition-all cursor-pointer"
              >
                4
              </button>
              <button
                type="button"
                onClick={() => handleDigit("5")}
                className="p-3.5 rounded-2xl glass-card text-white hover:bg-white/10 font-bold transition-all cursor-pointer"
              >
                5
              </button>
              <button
                type="button"
                onClick={() => handleDigit("6")}
                className="p-3.5 rounded-2xl glass-card text-white hover:bg-white/10 font-bold transition-all cursor-pointer"
              >
                6
              </button>
              <button
                type="button"
                onClick={() => handleOperator("-")}
                className="p-3.5 rounded-2xl glass-pill text-[#38bdf8] hover:text-white font-bold transition-all cursor-pointer text-base"
              >
                -
              </button>

              <button
                type="button"
                onClick={() => handleDigit("1")}
                className="p-3.5 rounded-2xl glass-card text-white hover:bg-white/10 font-bold transition-all cursor-pointer"
              >
                1
              </button>
              <button
                type="button"
                onClick={() => handleDigit("2")}
                className="p-3.5 rounded-2xl glass-card text-white hover:bg-white/10 font-bold transition-all cursor-pointer"
              >
                2
              </button>
              <button
                type="button"
                onClick={() => handleDigit("3")}
                className="p-3.5 rounded-2xl glass-card text-white hover:bg-white/10 font-bold transition-all cursor-pointer"
              >
                3
              </button>
              <button
                type="button"
                onClick={() => handleOperator("+")}
                className="p-3.5 rounded-2xl glass-pill text-[#38bdf8] hover:text-white font-bold transition-all cursor-pointer text-base"
              >
                +
              </button>

              <button
                type="button"
                onClick={handleNegate}
                className="p-3.5 rounded-2xl glass-card text-slate-300 hover:text-white font-bold transition-all cursor-pointer"
              >
                ±
              </button>
              <button
                type="button"
                onClick={() => handleDigit("0")}
                className="p-3.5 rounded-2xl glass-card text-white hover:bg-white/10 font-bold transition-all cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleDigit(".")}
                className="p-3.5 rounded-2xl glass-card text-white hover:bg-white/10 font-bold transition-all cursor-pointer"
              >
                .
              </button>
              <button
                type="button"
                onClick={handleEquals}
                className="p-3.5 rounded-2xl btn-luxe font-bold transition-all cursor-pointer text-base flex items-center justify-center shadow-lg"
              >
                =
              </button>
            </div>

            {/* Insertion & Actions Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/10">
              {onApplyCost && (
                <button
                  type="button"
                  onClick={() => {
                    const num = parseFloat(display) || 0
                    onApplyCost(num)
                    onClose()
                    toast({
                      title: "Cost Applied",
                      description: `Set experience cost to ${currencySymbol}${num}.`,
                    })
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl btn-luxe text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-[#050a10]" />
                  <span>Insert as Experience Cost</span>
                </button>
              )}

              {onApplyTargetBudget && (
                <button
                  type="button"
                  onClick={() => {
                    const num = parseFloat(display) || 0
                    onApplyTargetBudget(num)
                    onClose()
                    toast({
                      title: "Budget Updated",
                      description: `Target budget set to ${currencySymbol}${num}.`,
                    })
                  }}
                  className="py-2.5 px-3.5 rounded-xl glass-pill text-xs font-semibold text-white hover:text-[#e8d5b5] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>Set as Target Budget</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleCopyCurrent(display)}
                className="p-2.5 rounded-xl glass-pill text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Copy calculated number"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ─── TAB 2: PER-PERSON & PER-DAY SPLITTER ──────────────────────────── */}
        {activeTab === "splitter" && (
          <div className="space-y-4 relative z-10 text-xs">
            {/* Input Controls Grid */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="editorial-tag text-[9px] text-[#e8d5b5]">
                  Base Amount ({currencySymbol})
                </label>
                <input
                  type="number"
                  value={splitBaseAmount}
                  onChange={(e) => setSplitBaseAmount(parseFloat(e.target.value) || 0)}
                  className="w-full glass-input rounded-2xl h-10 px-3 text-sm text-white font-mono"
                  placeholder="Total amount to split"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="editorial-tag text-[9px] text-[#e8d5b5]">Travelers</label>
                    <span className="font-mono text-[#38bdf8] font-bold text-xs">{splitTravelers}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[1, 2, 4, 6].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSplitTravelers(num)}
                        className={`py-1.5 rounded-xl font-mono text-xs border transition-all cursor-pointer ${
                          splitTravelers === num
                            ? "bg-[#38bdf8]/20 border-[#38bdf8] text-white"
                            : "glass-card text-slate-400 hover:text-white"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="editorial-tag text-[9px] text-[#e8d5b5]">Duration</label>
                    <span className="font-mono text-[#38bdf8] font-bold text-xs">{splitDays} Days</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[2, 3, 5, 7].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSplitDays(num)}
                        className={`py-1.5 rounded-xl font-mono text-xs border transition-all cursor-pointer ${
                          splitDays === num
                            ? "bg-[#38bdf8]/20 border-[#38bdf8] text-white"
                            : "glass-card text-slate-400 hover:text-white"
                        }`}
                      >
                        {num}d
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Optional Tip / Tax Adjustment */}
              <div className="space-y-1">
                <label className="editorial-tag text-[9px] text-[#e8d5b5]">
                  Add Tip or Service Surcharge
                </label>
                <div className="flex items-center gap-1.5">
                  {[0, 10, 15, 18, 20].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setTipPercent(pct)}
                      className={`flex-1 py-1 rounded-xl font-mono text-[11px] border transition-all cursor-pointer ${
                        tipPercent === pct
                          ? "bg-[#e8d5b5] text-[#050a10] font-bold border-[#e8d5b5]"
                          : "glass-pill text-slate-400 hover:text-white"
                      }`}
                    >
                      {pct === 0 ? "0%" : `+${pct}%`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Split Output Results Showcase */}
            <div className="glass-card p-4 rounded-2xl border border-white/15 space-y-3">
              <div className="text-[10px] uppercase tracking-wider text-[#e8d5b5] font-semibold border-b border-white/10 pb-2 flex items-center justify-between">
                <span>Calculated Breakdown</span>
                {tipPercent > 0 && (
                  <span className="text-emerald-400 font-mono">Includes +{tipPercent}% tip</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="glass-dock p-3 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Per Traveler Total
                  </span>
                  <div className="text-lg font-bold text-[#38bdf8]">
                    {formatCurrency(perPersonTotal, currency)}
                  </div>
                  <span className="text-[9px] text-slate-400">For whole {splitDays}-day trip</span>
                </div>

                <div className="glass-dock p-3 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Per Traveler Daily
                  </span>
                  <div className="text-lg font-bold text-emerald-400">
                    {formatCurrency(perPersonDaily, currency)}
                  </div>
                  <span className="text-[9px] text-slate-400">Daily burn per person</span>
                </div>

                <div className="glass-dock p-3 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Total Group Daily
                  </span>
                  <div className="text-base font-bold text-white">
                    {formatCurrency(groupDaily, currency)}
                  </div>
                  <span className="text-[9px] text-slate-400">Combined daily cadence</span>
                </div>

                <div className="glass-dock p-3 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Total Trip Amount
                  </span>
                  <div className="text-base font-bold text-[#e8d5b5]">
                    {formatCurrency(baseWithTip, currency)}
                  </div>
                  <span className="text-[9px] text-slate-400">Total with tip</span>
                </div>
              </div>
            </div>

            {/* Live Multi-Currency Conversion Matrix */}
            <div className="space-y-1.5 pt-1">
              <span className="editorial-tag text-[9px] text-[#e8d5b5]">
                Equivalent In Other Currencies
              </span>
              <div className="grid grid-cols-4 gap-2 text-center font-mono text-[11px]">
                {previewCurrencies.map((c) => {
                  const rate = FX_RATES_FROM_USD[c] || 1.0
                  const converted = Math.round(amountInUsd * rate)
                  const sym = CURRENCY_SYMBOLS[c] || "$"
                  return (
                    <div key={c} className="glass-card p-2 rounded-xl">
                      <span className="text-[9px] text-slate-400 block">{c}</span>
                      <span className="font-bold text-white">
                        {sym}{converted.toLocaleString()}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Apply to Target Budget */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              {onApplyTargetBudget && (
                <button
                  type="button"
                  onClick={() => {
                    onApplyTargetBudget(baseWithTip)
                    onClose()
                    toast({
                      title: "Budget Updated",
                      description: `Target budget set to ${currencySymbol}${baseWithTip}.`,
                    })
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl btn-luxe text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <DollarSign className="w-3.5 h-3.5 text-[#050a10]" />
                  <span>Set as Target Budget ({formatCurrency(baseWithTip, currency)})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  const summary = `Trip Cost Split (${currency}): Total ${currencySymbol}${baseWithTip} for ${splitTravelers} travelers over ${splitDays} days. Per person: ${currencySymbol}${perPersonTotal} total (${currencySymbol}${perPersonDaily}/day).`
                  navigator.clipboard.writeText(summary)
                  toast({
                    title: "Split Summary Copied",
                    description: "Details copied to clipboard.",
                  })
                }}
                className="py-2.5 px-3 rounded-xl glass-pill text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Summary</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

