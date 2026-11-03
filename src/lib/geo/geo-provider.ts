/**
 * AERIS Worldwide Geographical Provider Abstraction
 * Supports:
 * 1. Google Places API (New searchText) when GOOGLE_MAPS_API_KEY is available
 * 2. OpenStreetMap Nominatim for open worldwide lookup and reverse-geocoding
 */

export interface GeoLocation {
  id: string
  name: string
  displayName: string
  lat: number
  lng: number
  type: string
  category: string
  country: string
  state?: string
  city?: string
  boundingBox?: [number, number, number, number] // [minLat, maxLat, minLng, maxLng]
}

export interface IGeoProvider {
  search(query: string, limit?: number): Promise<GeoLocation[]>
  reverseGeocode(lat: number, lng: number): Promise<GeoLocation | null>
}

class NominatimGeoProvider implements IGeoProvider {
  private userAgent = "AERIS-Travel-Intelligence/2.0 (contact: concierge@aeris-travel.app)"

  async search(query: string, limit: number = 5): Promise<GeoLocation[]> {
    const trimmed = query.trim()
    if (!trimmed) return []

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        trimmed
      )}&format=json&addressdetails=1&limit=${limit}`

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 6000)

      const res = await fetch(url, {
        headers: {
          "User-Agent": this.userAgent,
          "Accept-Language": "en",
        },
        signal: controller.signal,
      }).finally(() => clearTimeout(timer))

      if (!res.ok) return []

      const data = await res.json()
      if (!Array.isArray(data)) return []

      return data.map((item: any) => ({
        id: String(item.place_id || `${item.lat},${item.lon}`),
        name: item.name || item.display_name.split(",")[0].trim(),
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: item.type || "location",
        category: item.class || "boundary",
        country: item.address?.country || "",
        state: item.address?.state || item.address?.region,
        city: item.address?.city || item.address?.town || item.address?.village,
        boundingBox: item.boundingbox
          ? [
              parseFloat(item.boundingbox[0]),
              parseFloat(item.boundingbox[1]),
              parseFloat(item.boundingbox[2]),
              parseFloat(item.boundingbox[3]),
            ]
          : undefined,
      }))
    } catch (err) {
      console.warn("Nominatim geocoding notice:", err)
      return []
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<GeoLocation | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 6000)

      const res = await fetch(url, {
        headers: {
          "User-Agent": this.userAgent,
          "Accept-Language": "en",
        },
        signal: controller.signal,
      }).finally(() => clearTimeout(timer))

      if (!res.ok) return null

      const item = await res.json()
      return {
        id: String(item.place_id || `${lat},${lng}`),
        name: item.name || item.display_name?.split(",")[0]?.trim() || "Coordinates",
        displayName: item.display_name || "",
        lat,
        lng,
        type: item.type || "location",
        category: item.class || "place",
        country: item.address?.country || "",
        state: item.address?.state || item.address?.region,
        city: item.address?.city || item.address?.town || item.address?.village,
      }
    } catch {
      return null
    }
  }
}

class GooglePlacesGeoProvider implements IGeoProvider {
  private fallback = new NominatimGeoProvider()

  async search(query: string, limit: number = 5): Promise<GeoLocation[]> {
    const trimmed = query.trim()
    if (!trimmed) return []

    const googleApiKey =
      process.env.GOOGLE_MAPS_API_KEY ||
      (process.env.INTERACTIVE_ROUTE_API_KEY?.startsWith("AIzaSy")
        ? process.env.INTERACTIVE_ROUTE_API_KEY
        : "")

    if (googleApiKey) {
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 6000)

        const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": googleApiKey,
            "X-Goog-FieldMask":
              "places.id,places.displayName,places.formattedAddress,places.location,places.types",
          },
          body: JSON.stringify({
            textQuery: trimmed,
            pageSize: Math.min(10, limit),
          }),
          signal: controller.signal,
        }).finally(() => clearTimeout(timer))

        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.places) && data.places.length > 0) {
            return data.places.map((place: any) => {
              const displayName = place.formattedAddress || place.displayName?.text || ""
              const parts = displayName.split(",").map((s: string) => s.trim())
              const country = parts.length > 0 ? parts[parts.length - 1] : ""

              return {
                id: String(place.id || `${place.location?.latitude},${place.location?.longitude}`),
                name: place.displayName?.text || parts[0] || trimmed,
                displayName,
                lat: place.location?.latitude || 0,
                lng: place.location?.longitude || 0,
                type: place.types?.[0] || "location",
                category: place.types?.[0] || "establishment",
                country,
              }
            })
          }
        }
      } catch (err) {
        console.warn("Google Places search notice:", err)
      }
    }

    // Resilient fallback to Nominatim
    return this.fallback.search(trimmed, limit)
  }

  async reverseGeocode(lat: number, lng: number): Promise<GeoLocation | null> {
    return this.fallback.reverseGeocode(lat, lng)
  }
}

// Export singleton instance of default provider
export const geoProvider: IGeoProvider = new GooglePlacesGeoProvider()
