"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export interface StoredActivity {
  id: string
  time: string
  title: string
  description: string
  duration?: string
  location?: string
  estimatedCost?: string
  category?: string
  isBooked?: boolean
  lat?: number
  lng?: number
}

export interface StoredTripDay {
  dayNumber: number
  date?: string
  title: string
  description?: string
  activities: StoredActivity[]
}

export interface StoredTrip {
  id: string
  userId?: string
  title: string
  destination: string
  dates: string
  startDate?: string
  endDate?: string
  daysCount: number
  travelers: number
  budget?: string
  budgetSpent?: string
  status: "planning" | "upcoming" | "completed" | "cancelled"
  planningMode: "AI Architecture" | "Manual Studio"
  coverImage: string
  notes?: string
  coordinates?: [number, number]
  days: StoredTripDay[]
  createdAt: string
  updatedAt: string
}

export interface UserSession {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
  tier: string
  isAuthenticated: boolean
}

interface TravelStoreState {
  user: UserSession
  trips: StoredTrip[]
  savedDestinationIds: string[]
  
  // Auth Actions
  setUser: (user: Partial<UserSession>) => void
  login: (email: string, fullName?: string) => void
  signup: (email: string, fullName: string) => void
  logout: () => void

  // Trip CRUD Actions
  addTrip: (trip: Omit<StoredTrip, "createdAt" | "updatedAt"> & { createdAt?: string; updatedAt?: string }) => StoredTrip
  updateTrip: (id: string, updates: Partial<StoredTrip>) => void
  deleteTrip: (id: string) => void
  getTripById: (id: string) => StoredTrip | undefined

  // Day & Activity CRUD Actions
  addDayToTrip: (tripId: string, title?: string) => void
  deleteDayFromTrip: (tripId: string, dayNumber: number) => void
  addActivityToTrip: (tripId: string, dayNumber: number, activity: Omit<StoredActivity, "id"> & { id?: string }) => void
  updateActivityInTrip: (tripId: string, dayNumber: number, activityId: string, updates: Partial<StoredActivity>) => void
  deleteActivityFromTrip: (tripId: string, dayNumber: number, activityId: string) => void

  // Destination Bookmark Actions
  toggleSaveDestination: (destinationId: string) => boolean
  isDestinationSaved: (destinationId: string) => boolean
  
  // Reset helper
  resetToDefaults: () => void
}

// ─── Initial Curated Seed Trips ──────────────────────────────────────────────
const INITIAL_SEED_TRIPS: StoredTrip[] = [
  {
    id: "trip-kyoto-2026",
    title: "Autumn Serenity in Kyoto",
    destination: "Kyoto, Japan",
    dates: "Nov 15 — Nov 22, 2026",
    startDate: "2026-11-15",
    endDate: "2026-11-22",
    daysCount: 7,
    travelers: 2,
    budget: "$2,200",
    budgetSpent: "$1,680",
    status: "upcoming",
    planningMode: "AI Architecture",
    coverImage: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600&q=80",
    notes: "Pre-book bullet train passes (Shinkansen) from Tokyo. Reserve morning tea ceremony in Uji.",
    coordinates: [35.0116, 135.7681],
    createdAt: "2026-10-01T10:00:00Z",
    updatedAt: "2026-10-15T12:00:00Z",
    days: [
      {
        dayNumber: 1,
        date: "Nov 15",
        title: "Arrival & Gion Lanterns",
        description: "Settle into your traditional machiya, followed by an evening stroll through the lantern-lit alleys of Gion.",
        activities: [
          {
            id: "act-1",
            time: "14:00",
            title: "Check-in at Ryokan Gion Sano",
            description: "Historic traditional Japanese inn with private tatami garden.",
            location: "Gion District",
            duration: "1h",
            estimatedCost: "$220",
            category: "Stay",
            lat: 35.0037,
            lng: 135.7772,
          },
          {
            id: "act-2",
            time: "17:30",
            title: "Sunset Walk along Shirakawa Canal",
            description: "Stone bridges, willow trees, and preserved geisha tea houses.",
            location: "Shirakawa Canal",
            duration: "1.5h",
            estimatedCost: "Free",
            category: "Sightseeing",
            lat: 35.0062,
            lng: 135.7735,
          },
          {
            id: "act-3",
            time: "19:30",
            title: "Kaiseki Dinner at Gion Karyo",
            description: "Multi-course seasonal Kyoto cuisine paired with local junmai sake.",
            location: "Gion",
            duration: "2h",
            estimatedCost: "$120",
            category: "Dining",
            lat: 35.0028,
            lng: 135.7761,
          },
        ],
      },
      {
        dayNumber: 2,
        date: "Nov 16",
        title: "Arashiyama Bamboo & River",
        description: "Early morning amidst bamboo stalks, followed by Zen temple exploration and a scenic riverboat journey.",
        activities: [
          {
            id: "act-4",
            time: "07:30",
            title: "Arashiyama Bamboo Grove Walk",
            description: "Beat the crowds to experience the peaceful wind whistling through towering green bamboo stalks.",
            location: "Arashiyama",
            duration: "1.5h",
            estimatedCost: "Free",
            category: "Nature",
            lat: 35.0167,
            lng: 135.6713,
          },
          {
            id: "act-5",
            time: "09:30",
            title: "Tenryu-ji Zen Temple Gardens",
            description: "UNESCO World Heritage site with a 14th-century landscape garden.",
            location: "Ukyo Ward",
            duration: "1.5h",
            estimatedCost: "$5",
            category: "Culture",
            lat: 35.0158,
            lng: 135.6777,
          },
        ],
      },
      {
        dayNumber: 3,
        date: "Nov 17",
        title: "Golden Pavilion & Philosophers Path",
        description: "Contemplate gold-leaf architecture and stroll beside stone canals.",
        activities: [
          {
            id: "act-6",
            time: "09:00",
            title: "Kinkaku-ji (Golden Pavilion)",
            description: "Zen Buddhist temple whose top two floors are completely covered in gold leaf.",
            location: "Kita Ward",
            duration: "1.5h",
            estimatedCost: "$4",
            category: "Culture",
            lat: 35.0394,
            lng: 135.7292,
          },
        ],
      },
    ],
  },
  {
    id: "trip-santorini-2027",
    title: "Cyclades Island Hopping",
    destination: "Santorini & Milos, Greece",
    dates: "May 10 — May 18, 2027",
    startDate: "2027-05-10",
    endDate: "2027-05-18",
    daysCount: 8,
    travelers: 2,
    budget: "$3,400",
    budgetSpent: "$2,100",
    status: "planning",
    planningMode: "Manual Studio",
    coverImage: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1600&q=80",
    notes: "Book catamaran cruise around the caldera and dinner reservations at sunset in Oia.",
    coordinates: [36.3932, 25.4615],
    createdAt: "2026-10-10T14:30:00Z",
    updatedAt: "2026-10-22T09:15:00Z",
    days: [
      {
        dayNumber: 1,
        date: "May 10",
        title: "Cliffside Check-in & Caldera Views",
        description: "Arrive via ferry and settle into your whitewashed cave suite in Imerovigli.",
        activities: [
          {
            id: "act-san-1",
            time: "15:00",
            title: "Check into Grace Hotel",
            description: "Infinity pool overlooking the volcanic caldera.",
            location: "Imerovigli",
            duration: "1h",
            estimatedCost: "$450",
            category: "Stay",
            lat: 36.4332,
            lng: 25.4218,
          },
          {
            id: "act-san-2",
            time: "19:00",
            title: "Sunset Wine Tasting",
            description: "Assyrtiko crisp white wine paired with local Greek cheeses.",
            location: "Santo Wines",
            duration: "2h",
            estimatedCost: "$65",
            category: "Dining",
            lat: 36.3862,
            lng: 25.4312,
          },
        ],
      },
    ],
  },
  {
    id: "trip-swiss-2025",
    title: "Alpine Adventure in Bernese Oberland",
    destination: "Swiss Alps, Switzerland",
    dates: "Jul 05 — Jul 12, 2025",
    startDate: "2025-07-05",
    endDate: "2025-07-12",
    daysCount: 7,
    travelers: 4,
    budget: "$4,800",
    budgetSpent: "$4,650",
    status: "completed",
    planningMode: "AI Architecture",
    coverImage: "https://images.unsplash.com/photo-1531210483974-4f8c1f33fd35?w=1600&q=80",
    notes: "Swiss Travel Pass utilized for all panoramic trains and cable cars.",
    coordinates: [46.5606, 7.9147],
    createdAt: "2025-06-01T08:00:00Z",
    updatedAt: "2025-07-15T18:00:00Z",
    days: [
      {
        dayNumber: 1,
        date: "Jul 05",
        title: "Interlaken to Grindelwald",
        description: "Scenic train journey beneath the north face of the Eiger.",
        activities: [
          {
            id: "act-sw-1",
            time: "11:00",
            title: "Glacier Canyon Walk",
            description: "Walk along elevated footbridges above roaring glacial meltwater.",
            location: "Grindelwald",
            duration: "2h",
            estimatedCost: "$25",
            category: "Adventure",
            lat: 46.6186,
            lng: 8.0414,
          },
        ],
      },
    ],
  },
]

const INITIAL_SAVED_DESTINATION_IDS = [
  "santorini-greece",
  "kyoto-japan",
  "amalfi-coast-italy",
  "swiss-alps",
]

const DEFAULT_USER: UserSession = {
  id: "user-alexandra-1",
  email: "alexandra.vance@roveo.travel",
  fullName: "Alexandra Vance",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
  tier: "Passport Concierge",
  isAuthenticated: true,
}

export const useTravelStore = create<TravelStoreState>()(
  persist(
    (set, get) => ({
      user: DEFAULT_USER,
      trips: INITIAL_SEED_TRIPS,
      savedDestinationIds: INITIAL_SAVED_DESTINATION_IDS,

      // ─── Auth Actions ────────────────────────────────────────────────────────
      setUser: (userData) =>
        set((state) => ({
          user: { ...state.user, ...userData },
        })),

      login: (email, fullName) => {
        const name = fullName || email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        set({
          user: {
            id: `user-${Date.now()}`,
            email,
            fullName: name,
            avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
            tier: "Passport Member",
            isAuthenticated: true,
          },
        })
      },

      signup: (email, fullName) => {
        set({
          user: {
            id: `user-${Date.now()}`,
            email,
            fullName: fullName || "Valued Traveler",
            avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
            tier: "Passport Member",
            isAuthenticated: true,
          },
        })
      },

      logout: () => {
        set({
          user: {
            id: "guest",
            email: "",
            fullName: "Guest Traveler",
            avatarUrl: undefined,
            tier: "Explorer",
            isAuthenticated: false,
          },
        })
      },

      // ─── Trip CRUD Actions ───────────────────────────────────────────────────
      addTrip: (newTripData) => {
        const now = new Date().toISOString()
        const newTrip: StoredTrip = {
          ...newTripData,
          createdAt: newTripData.createdAt || now,
          updatedAt: newTripData.updatedAt || now,
        }
        set((state) => ({
          trips: [newTrip, ...state.trips],
        }))
        return newTrip
      },

      updateTrip: (id, updates) => {
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === id
              ? {
                  ...trip,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                }
              : trip
          ),
        }))
      },

      deleteTrip: (id) => {
        set((state) => ({
          trips: state.trips.filter((trip) => trip.id !== id),
        }))
      },

      getTripById: (id) => {
        return get().trips.find((t) => t.id === id)
      },

      // ─── Day & Activity Actions ──────────────────────────────────────────────
      addDayToTrip: (tripId, title) => {
        set((state) => ({
          trips: state.trips.map((trip) => {
            if (trip.id !== tripId) return trip
            const nextDayNumber = trip.days.length + 1
            const newDay: StoredTripDay = {
              dayNumber: nextDayNumber,
              title: title || `Day ${nextDayNumber} Exploration`,
              activities: [],
            }
            return {
              ...trip,
              daysCount: nextDayNumber,
              days: [...trip.days, newDay],
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
      },

      deleteDayFromTrip: (tripId, dayNumber) => {
        set((state) => ({
          trips: state.trips.map((trip) => {
            if (trip.id !== tripId) return trip
            const filteredDays = trip.days
              .filter((d) => d.dayNumber !== dayNumber)
              .map((d, index) => ({ ...d, dayNumber: index + 1 }))
            return {
              ...trip,
              daysCount: filteredDays.length,
              days: filteredDays,
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
      },

      addActivityToTrip: (tripId, dayNumber, activityData) => {
        const newActivity: StoredActivity = {
          id: activityData.id || `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          ...activityData,
        }

        set((state) => ({
          trips: state.trips.map((trip) => {
            if (trip.id !== tripId) return trip
            return {
              ...trip,
              updatedAt: new Date().toISOString(),
              days: trip.days.map((day) => {
                if (day.dayNumber !== dayNumber) return day
                return {
                  ...day,
                  activities: [...day.activities, newActivity],
                }
              }),
            }
          }),
        }))
      },

      updateActivityInTrip: (tripId, dayNumber, activityId, updates) => {
        set((state) => ({
          trips: state.trips.map((trip) => {
            if (trip.id !== tripId) return trip
            return {
              ...trip,
              updatedAt: new Date().toISOString(),
              days: trip.days.map((day) => {
                if (day.dayNumber !== dayNumber) return day
                return {
                  ...day,
                  activities: day.activities.map((act) =>
                    act.id === activityId ? { ...act, ...updates } : act
                  ),
                }
              }),
            }
          }),
        }))
      },

      deleteActivityFromTrip: (tripId, dayNumber, activityId) => {
        set((state) => ({
          trips: state.trips.map((trip) => {
            if (trip.id !== tripId) return trip
            return {
              ...trip,
              updatedAt: new Date().toISOString(),
              days: trip.days.map((day) => {
                if (day.dayNumber !== dayNumber) return day
                return {
                  ...day,
                  activities: day.activities.filter((act) => act.id !== activityId),
                }
              }),
            }
          }),
        }))
      },

      // ─── Destination Bookmarking Actions ─────────────────────────────────────
      toggleSaveDestination: (destinationId) => {
        let isNowSaved = false
        set((state) => {
          const exists = state.savedDestinationIds.includes(destinationId)
          isNowSaved = !exists
          return {
            savedDestinationIds: exists
              ? state.savedDestinationIds.filter((id) => id !== destinationId)
              : [...state.savedDestinationIds, destinationId],
          }
        })
        return isNowSaved
      },

      isDestinationSaved: (destinationId) => {
        return get().savedDestinationIds.includes(destinationId)
      },

      // ─── Reset helper ────────────────────────────────────────────────────────
      resetToDefaults: () => {
        set({
          user: DEFAULT_USER,
          trips: INITIAL_SEED_TRIPS,
          savedDestinationIds: INITIAL_SAVED_DESTINATION_IDS,
        })
      },
    }),
    {
      name: "roveo_travel_store_v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
)

