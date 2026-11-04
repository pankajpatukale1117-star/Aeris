"use client"

import { create } from "zustand"

interface GeminiState {
  isModalOpen: boolean
  hasKey: boolean
  openModal: () => void
  closeModal: () => void
  initialize: () => void
}

// User key editing is disabled. Gemini is permanently active on the secure backend.
export const useGeminiStore = create<GeminiState>((set) => ({
  isModalOpen: false,
  hasKey: true,
  openModal: () => {},
  closeModal: () => {},
  initialize: () => {},
}))
