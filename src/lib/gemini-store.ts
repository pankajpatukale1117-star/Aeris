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
        localStorage.setItem("aeris_gemini_key", trimmed)
        localStorage.setItem("roveo_gemini_key", trimmed)
      } else {
        localStorage.removeItem("aeris_gemini_key")
        localStorage.removeItem("roveo_gemini_key")
      }
    }
    set({ apiKey: trimmed, hasKey: Boolean(trimmed) })
  },

  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),

  removeApiKey: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("aeris_gemini_key")
      localStorage.removeItem("roveo_gemini_key")
    }
    set({ apiKey: "", hasKey: false })
  },

  initialize: async () => {
    if (typeof window !== "undefined") {
      const stored =
        localStorage.getItem("aeris_gemini_key") ||
        localStorage.getItem("roveo_gemini_key") ||
        ""
      if (stored) {
        set({ apiKey: stored, hasKey: true })
        return
      }

      // Check if server environment has GEMINI_API_KEY configured securely
      try {
        const res = await fetch("/api/gemini/status")
        if (res.ok) {
          const data = await res.json()
          if (data.configured) {
            set({ hasKey: true })
            return
          }
        }
      } catch {
        // network or offline
      }
      set({ apiKey: "", hasKey: false })
    }
  },
}))

