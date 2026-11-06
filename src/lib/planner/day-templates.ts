import { ActivityItem } from "@/components/trip/activity-card"

export interface DayTemplate {
  id: string
  name: string
  description: string
  icon: string
  activities: Array<Omit<ActivityItem, "id">>
}

export const DAY_TEMPLATES: DayTemplate[] = [
  {
    id: "classic-sightseeing",
    name: "Classic Sightseeing Day",
    description: "Breakfast → Iconic Landmark → Lunch → Museum → Sunset Vantage",
    icon: "🏛️",
    activities: [
      {
        time: "08:30 — 09:30",
        startTime: "08:30",
        endTime: "09:30",
        duration: "1h",
        title: "Artisan Breakfast & Espresso",
        description: "Fresh pastries and espresso at a historic local piazza cafe.",
        category: "Dining",
        estimatedCost: "20",
        bookingStatus: "wishlist",
      },
      {
        time: "10:00 — 12:00",
        startTime: "10:00",
        endTime: "12:00",
        duration: "2h",
        title: "Morning Iconic Landmark Exploration",
        description: "Guided walking tour through historic quarters and architectural monuments.",
        category: "Sightseeing",
        estimatedCost: "35",
        bookingStatus: "wishlist",
      },
      {
        time: "12:30 — 14:00",
        startTime: "12:30",
        endTime: "14:00",
        duration: "1.5h",
        title: "Al Fresco Courtyard Lunch",
        description: "Handmade regional specialties and seasonal wine pairing.",
        category: "Dining",
        estimatedCost: "55",
        bookingStatus: "wishlist",
      },
      {
        time: "14:30 — 17:00",
        startTime: "14:30",
        endTime: "17:00",
        duration: "2.5h",
        title: "Fine Arts Museum & Sculpture Gallery",
        description: "World-class curated art collections and temporary royal exhibitions.",
        category: "Culture",
        estimatedCost: "25",
        bookingStatus: "wishlist",
      },
      {
        time: "18:00 — 19:30",
        startTime: "18:00",
        endTime: "19:30",
        duration: "1.5h",
        title: "Golden Hour Panoramic Sunset Vantage",
        description: "Breathtaking scenic overlook with chilled Prosecco as dusk falls.",
        category: "Sightseeing",
        estimatedCost: "Free",
        bookingStatus: "wishlist",
      },
    ],
  },
  {
    id: "culinary-discovery",
    name: "Relaxed Culinary Day",
    description: "Bakery → Food Market Tour → Cooking Class → Wine Bar",
    icon: "🍷",
    activities: [
      {
        time: "09:00 — 10:00",
        startTime: "09:00",
        endTime: "10:00",
        duration: "1h",
        title: "Morning Bakery & Coffee Roastery",
        description: "Warm brioche, sourdough, and single-origin pour-over.",
        category: "Dining",
        estimatedCost: "15",
        bookingStatus: "wishlist",
      },
      {
        time: "10:30 — 12:30",
        startTime: "10:30",
        endTime: "12:30",
        duration: "2h",
        title: "Central Food Market Tasting Walk",
        description: "Meet local cheese purveyors, olive oil growers, and cured meat masters.",
        category: "Dining",
        estimatedCost: "40",
        bookingStatus: "wishlist",
      },
      {
        time: "13:30 — 16:30",
        startTime: "13:30",
        endTime: "16:30",
        duration: "3h",
        title: "Private Masterclass Cooking Workshop",
        description: "Learn authentic heritage recipes alongside a master chef.",
        category: "Culture",
        estimatedCost: "120",
        bookingStatus: "reserved",
      },
      {
        time: "18:30 — 21:00",
        startTime: "18:30",
        endTime: "21:00",
        duration: "2.5h",
        title: "Natural Wine Bar & Tapas Cellar",
        description: "Sommelier-curated flight of rare biodynamic vintages and small plates.",
        category: "Dining",
        estimatedCost: "75",
        bookingStatus: "wishlist",
      },
    ],
  },
  {
    id: "arrival-checkin",
    name: "Arrival & Check-in Day",
    description: "Airport Transfer → Villa Check-in → Neighborhood Walk → Welcome Dinner",
    icon: "🧳",
    activities: [
      {
        time: "12:00 — 13:30",
        startTime: "12:00",
        endTime: "13:30",
        duration: "1.5h",
        title: "Airport Arrival & Private Executive Transfer",
        description: "Meet-and-greet in arrivals hall with luggage handling directly to accommodation.",
        category: "Transport",
        estimatedCost: "90",
        bookingStatus: "booked",
      },
      {
        time: "14:00 — 15:30",
        startTime: "14:00",
        endTime: "15:30",
        duration: "1.5h",
        title: "Hotel / Cliffside Villa Check-in",
        description: "Unpack, settle into suites, and take in the panoramic arrival view.",
        category: "Stay",
        estimatedCost: "Free",
        bookingStatus: "booked",
      },
      {
        time: "16:00 — 18:00",
        startTime: "16:00",
        endTime: "18:00",
        duration: "2h",
        title: "Old Town Orientation & Promenade Walk",
        description: "Leisurely stroll along cobbled alleys to acclimate to local surroundings.",
        category: "Sightseeing",
        estimatedCost: "Free",
        bookingStatus: "wishlist",
      },
      {
        time: "19:30 — 21:30",
        startTime: "19:30",
        endTime: "21:30",
        duration: "2h",
        title: "Welcome Dinner at Historic Trattoria",
        description: "Candlelit courtyard dinner with regional antipasti and house wine.",
        category: "Dining",
        estimatedCost: "65",
        bookingStatus: "reserved",
      },
    ],
  },
]

export interface QuickStamp {
  id: string
  label: string
  icon: string
  title: string
  duration: string
  category: string
  defaultCost: string
}

export const QUICK_STAMPS: QuickStamp[] = [
  {
    id: "stamp-checkin",
    label: "Hotel Check-in",
    icon: "🏨",
    title: "Check into Hotel / Villa",
    duration: "1h",
    category: "Stay",
    defaultCost: "Free",
  },
  {
    id: "stamp-lunch",
    label: "Lunch",
    icon: "🍝",
    title: "Seaside / Trattoria Lunch",
    duration: "1.5h",
    category: "Dining",
    defaultCost: "45",
  },
  {
    id: "stamp-dinner",
    label: "Dinner",
    icon: "🍷",
    title: "Candlelit Evening Dinner",
    duration: "2h",
    category: "Dining",
    defaultCost: "70",
  },
  {
    id: "stamp-transfer",
    label: "Airport Transfer",
    icon: "✈️",
    title: "Airport / Station Transit Transfer",
    duration: "1.5h",
    category: "Transport",
    defaultCost: "60",
  },
  {
    id: "stamp-museum",
    label: "Museum Visit",
    icon: "🏛️",
    title: "Historic Museum & Gallery Tour",
    duration: "2h",
    category: "Culture",
    defaultCost: "25",
  },
  {
    id: "stamp-sunset",
    label: "Sunset Aperitivo",
    icon: "🌅",
    title: "Sunset Aperitivo & Cocktails",
    duration: "1.5h",
    category: "Dining",
    defaultCost: "35",
  },
]

