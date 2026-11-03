"use client"

import { create } from "zustand"

interface GeminiState {
  apiKey: string
  isModalOpen: boolean
  hasKey: boolean
  setApiKey: (key: string) => void
  openModal: () => void
  closeModal: () => void
  removeApiKey: () => void
  initialize: () => void
}

export const useGeminiStore = create<GeminiState>((set, get) => ({
  apiKey: "",
  isModalOpen: false,
  hasKey: false,

  setApiKey: (key: string) => {
    const trimmed = key.trim()
    if (typeof window !== "undefined") {
      if (trimmed) {
        localStorage.setItem("roveo_gemini_key", trimmed)
      } else {
        localStorage.removeItem("roveo_gemini_key")
      }
    }
    set({ apiKey: trimmed, hasKey: Boolean(trimmed) })
  },

  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),

  removeApiKey: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("roveo_gemini_key")
    }
    set({ apiKey: "", hasKey: false })
  },

  initialize: () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("roveo_gemini_key") || ""
      const envKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
      const activeKey = stored || envKey
      set({ apiKey: activeKey, hasKey: Boolean(activeKey) })
    }
  },
}))
