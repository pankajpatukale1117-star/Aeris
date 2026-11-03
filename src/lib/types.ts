// ─── User & Auth ────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  phone?: string
  created_at: string
  updated_at: string
  preferences?: UserPreferences
}

export interface UserPreferences {
  travel_styles: string[]
  budget_range: "budget" | "mid-range" | "luxury" | "ultra-luxury"
  preferred_activities: string[]
  dietary_restrictions?: string[]
  accessibility_needs?: string[]
}

// ─── Destination ─────────────────────────────────────────────────────────────
export interface Destination {
  id: string
  name: string
  location: string
  country: string
  description: string
  category: string
  image: string
  highlights: string[]
  recommendedDuration: string
  approximateBudget: string
  rating: number
  continent: string
}

export interface SavedDestination {
  id: string
  user_id: string
  destination_id: string
  destination: Destination
  notes?: string
  saved_at: string
}

// ─── Trip ────────────────────────────────────────────────────────────────────
export type TripStatus = "planning" | "upcoming" | "ongoing" | "completed" | "cancelled"
export type PlanningMode = "ai" | "manual"
export type BudgetLevel = "budget" | "mid-range" | "luxury" | "ultra-luxury"
export type TripPace = "relaxed" | "moderate" | "packed"

export interface Trip {
  id: string
  user_id: string
  title: string
  destination: string
  destination_id?: string
  cover_image?: string
  start_date: string
  end_date: string
  traveler_count: number
  budget?: number
  budget_level?: BudgetLevel
  status: TripStatus
  planning_mode: PlanningMode
  notes?: string
  days: TripDay[]
  created_at: string
  updated_at: string
  is_public?: boolean
  shared_with?: string[]
}

export interface TripDay {
  id: string
  trip_id: string
  day_number: number
  date: string
  title?: string
  notes?: string
  activities: Activity[]
}

export interface Activity {
  id: string
  day_id: string
  title: string
  description?: string
  location?: string
  address?: string
  start_time?: string
  end_time?: string
  duration_minutes?: number
  category: ActivityCategory
  cost?: number
  currency?: string
  booking_url?: string
  booking_reference?: string
  notes?: string
  images?: string[]
  latitude?: number
  longitude?: number
  order: number
  is_booked?: boolean
}

export type ActivityCategory =
  | "transport"
  | "accommodation"
  | "food"
  | "sightseeing"
  | "adventure"
  | "shopping"
  | "entertainment"
  | "relaxation"
  | "other"

// ─── AI Itinerary ─────────────────────────────────────────────────────────────
export interface AITripInput {
  origin: string
  destination: string
  startDate: string
  endDate: string
  travelerCount: number
  budget: BudgetLevel
  pace: TripPace
  interests: string[]
  dietary?: string[]
  accommodation?: string
  specialRequests?: string
}

export interface AIItinerary {
  id: string
  trip_id?: string
  title: string
  destination: string
  duration_days: number
  overview: string
  highlights: string[]
  estimated_total_cost: string
  days: AIItineraryDay[]
  practical_tips: string[]
  best_time_to_visit: string
  generated_at: string
}

export interface AIItineraryDay {
  day: number
  date?: string
  title: string
  theme: string
  activities: AIActivity[]
  accommodation?: string
  estimated_cost: string
  notes?: string
}

export interface AIActivity {
  time: string
  title: string
  description: string
  location: string
  duration: string
  cost?: string
  category: ActivityCategory
  tips?: string
}

// ─── Trip Notes ──────────────────────────────────────────────────────────────
export interface TripNote {
  id: string
  trip_id: string
  content: string
  created_at: string
  updated_at: string
  is_pinned?: boolean
}

// ─── Budget ──────────────────────────────────────────────────────────────────
export interface BudgetItem {
  id: string
  trip_id: string
  category: string
  label: string
  estimated: number
  actual?: number
  currency: string
  is_booked?: boolean
}

// ─── Chat ────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

// ─── Map ─────────────────────────────────────────────────────────────────────
export interface MapPin {
  id: string
  name: string
  latitude: number
  longitude: number
  category?: ActivityCategory
  description?: string
}

// ─── UI / Forms ──────────────────────────────────────────────────────────────
export interface FormState {
  loading: boolean
  error?: string
  success?: boolean
}

export interface PaginationParams {
  page: number
  limit: number
  total?: number
}

export interface FilterParams {
  category?: string
  continent?: string
  search?: string
  budget?: BudgetLevel
}
