/**
 * AERIS Worldwide Geographical Provider Abstraction
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

// Export singleton instance of default provider
export const geoProvider: IGeoProvider = new NominatimGeoProvider()

