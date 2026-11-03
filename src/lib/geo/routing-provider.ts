/**
 * AERIS Route & Distance Telemetry Provider
 * Supports:
 * 1. Google Routes API v2 (ComputeRoutes) when GOOGLE_MAPS_API_KEY or INTERACTIVE_ROUTE_API_KEY is present
 * 2. OSRM (Open Source Routing Machine) road network routing
 * 3. Geodesic Haversine calculation with road curvature multiplier as resilient fallback
 */

export interface RouteWaypoint {
  lat: number
  lng: number
  name?: string
}

export interface RouteLeg {
  fromName?: string
  toName?: string
  distanceMeters: number
  durationSeconds: number
  distanceFormatted: string
  durationFormatted: string
}

export interface RouteResult {
  distanceMeters: number
  durationSeconds: number
  distanceKm: number
  distanceMiles: number
  distanceFormatted: string
  durationFormatted: string
  coordinates: Array<[number, number]> // [lat, lng] pairs for Leaflet Polyline
  legs: RouteLeg[]
  dataSource: "google_routes_v2" | "osrm_road_network" | "haversine_estimate"
  isLiveTraffic: false
  disclaimer: string
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60)
  if (mins < 60) return `${mins} mins`
  const hours = Math.floor(mins / 60)
  const remMins = mins % 60
  return remMins > 0 ? `${hours} hr ${remMins} mins` : `${hours} hrs`
}

function formatDistance(meters: number): string {
  const km = (meters / 1000).toFixed(1)
  return `${km} km`
}

// Great-circle Haversine distance as backup
function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

// Standard Google polyline decoder to [lat, lng] coordinates for Leaflet
function decodePolyline(encoded: string): Array<[number, number]> {
  if (!encoded) return []
  const points: Array<[number, number]> = []
  let index = 0
  const len = encoded.length
  let lat = 0
  let lng = 0

  while (index < len) {
    let b: number
    let shift = 0
    let result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    const dlat = result & 1 ? ~(result >> 1) : result >> 1
    lat += dlat

    shift = 0
    result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    const dlng = result & 1 ? ~(result >> 1) : result >> 1
    lng += dlng

    points.push([Number((lat / 1e5).toFixed(5)), Number((lng / 1e5).toFixed(5))])
  }
  return points
}

export async function calculateRoute(
  waypoints: RouteWaypoint[],
  mode: "driving" | "walking" | "bike" = "driving"
): Promise<RouteResult> {
  if (waypoints.length < 2) {
    throw new Error("At least 2 waypoints are required to calculate a route.")
  }

  const googleApiKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    (process.env.INTERACTIVE_ROUTE_API_KEY?.startsWith("AIzaSy")
      ? process.env.INTERACTIVE_ROUTE_API_KEY
      : "")

  // 1. Primary: Google Routes API v2 (if Google API key is configured)
  if (googleApiKey) {
    try {
      const origin = waypoints[0]
      const destination = waypoints[waypoints.length - 1]
      const intermediates = waypoints.slice(1, -1).slice(0, 25) // Google allows up to 25 intermediates

      const travelMode = mode === "walking" ? "WALK" : mode === "bike" ? "BICYCLE" : "DRIVE"

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 7000)

      const payload: any = {
        origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
        destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
        travelMode,
      }

      if (intermediates.length > 0) {
        payload.intermediates = intermediates.map((w) => ({
          location: { latLng: { latitude: w.lat, longitude: w.lng } },
        }))
      }

      const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": googleApiKey,
          "X-Goog-FieldMask":
            "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.distanceMeters,routes.legs.duration",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }).finally(() => clearTimeout(timer))

      if (res.ok) {
        const data = await res.json()
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0]
          const distanceMeters = Math.round(route.distanceMeters || 0)
          const durationSeconds = parseInt(String(route.duration || "0").replace("s", ""), 10)
          const distanceKm = parseFloat((distanceMeters / 1000).toFixed(1))
          const distanceMiles = parseFloat((distanceKm * 0.621371).toFixed(1))

          const coordinates = decodePolyline(route.polyline?.encodedPolyline || "")

          const legs: RouteLeg[] = (route.legs || []).map((leg: any, i: number) => {
            const legDist = Math.round(leg.distanceMeters || 0)
            const legDur = parseInt(String(leg.duration || "0").replace("s", ""), 10)
            return {
              fromName: waypoints[i]?.name,
              toName: waypoints[i + 1]?.name,
              distanceMeters: legDist,
              durationSeconds: legDur,
              distanceFormatted: formatDistance(legDist),
              durationFormatted: formatDuration(legDur),
            }
          })

          return {
            distanceMeters,
            durationSeconds,
            distanceKm,
            distanceMiles,
            distanceFormatted: formatDistance(distanceMeters),
            durationFormatted: formatDuration(durationSeconds),
            coordinates: coordinates.length > 0 ? coordinates : waypoints.map((w) => [w.lat, w.lng]),
            legs,
            dataSource: "google_routes_v2",
            isLiveTraffic: false,
            disclaimer: "Calculated with Google Routes API high-precision telemetry.",
          }
        }
      } else {
        const errText = await res.text()
        console.warn("Google Routes notice:", res.status, errText.slice(0, 150))
      }
    } catch (err) {
      console.warn("Google Routes request notice:", err)
    }
  }

  // 2. Secondary: OSRM (Open Source Routing Machine)
  const coordsString = waypoints.map((w) => `${w.lng},${w.lat}`).join(";")
  const customEndpoint = process.env.INTERACTIVE_ROUTE_ENDPOINT || ""
  const genericApiKey = process.env.INTERACTIVE_ROUTE_API_KEY || ""

  try {
    const baseUrl = customEndpoint || "https://router.project-osrm.org"
    const url = `${baseUrl}/route/v1/${mode}/${coordsString}?overview=full&geometries=geojson&steps=false${
      genericApiKey && !genericApiKey.startsWith("AIzaSy") ? `&key=${encodeURIComponent(genericApiKey)}` : ""
    }`

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 7000)

    const res = await fetch(url, {
      headers: {
        "User-Agent": "AERIS-Travel-Intelligence/2.0",
        ...(genericApiKey && !genericApiKey.startsWith("AIzaSy")
          ? { "x-api-key": genericApiKey, Authorization: `Bearer ${genericApiKey}` }
          : {}),
      },
      signal: controller.signal,
    }).finally(() => clearTimeout(timer))

    if (res.ok) {
      const data = await res.json()
      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        const route = data.routes[0]
        const distanceMeters = Math.round(route.distance)
        const durationSeconds = Math.round(route.duration)
        const distanceKm = parseFloat((distanceMeters / 1000).toFixed(1))
        const distanceMiles = parseFloat((distanceKm * 0.621371).toFixed(1))

        // GeoJSON coordinates are [lon, lat] -> convert to Leaflet [lat, lng]
        const coordinates: Array<[number, number]> = (route.geometry.coordinates || []).map(
          (c: [number, number]) => [c[1], c[0]]
        )

        const legs: RouteLeg[] = (route.legs || []).map((l: any, i: number) => ({
          fromName: waypoints[i]?.name,
          toName: waypoints[i + 1]?.name,
          distanceMeters: Math.round(l.distance),
          durationSeconds: Math.round(l.duration),
          distanceFormatted: formatDistance(l.distance),
          durationFormatted: formatDuration(l.duration),
        }))

        return {
          distanceMeters,
          durationSeconds,
          distanceKm,
          distanceMiles,
          distanceFormatted: formatDistance(distanceMeters),
          durationFormatted: formatDuration(durationSeconds),
          coordinates,
          legs,
          dataSource: "osrm_road_network",
          isLiveTraffic: false,
          disclaimer: "Calculated based on OpenStreetMap road network without live traffic congestion.",
        }
      }
    }
  } catch (err) {
    console.warn("OSRM routing notice:", err)
  }

  // 3. Fallback: Haversine distance with 1.3 road winding curvature factor
  let totalMeters = 0
  const legs: RouteLeg[] = []
  const coordinates: Array<[number, number]> = waypoints.map((w) => [w.lat, w.lng])

  for (let i = 0; i < waypoints.length - 1; i++) {
    const straightLine = haversineDistanceMeters(
      waypoints[i].lat,
      waypoints[i].lng,
      waypoints[i + 1].lat,
      waypoints[i + 1].lng
    )
    const legMeters = Math.round(straightLine * 1.3) // typical road curvature multiplier
    const legSeconds = Math.round((legMeters / 1000 / 40) * 3600) // approx 40 km/h average drive
    totalMeters += legMeters

    legs.push({
      fromName: waypoints[i].name,
      toName: waypoints[i + 1].name,
      distanceMeters: legMeters,
      durationSeconds: legSeconds,
      distanceFormatted: formatDistance(legMeters),
      durationFormatted: formatDuration(legSeconds),
    })
  }

  const durationSeconds = Math.round((totalMeters / 1000 / 40) * 3600)
  const distanceKm = parseFloat((totalMeters / 1000).toFixed(1))

  return {
    distanceMeters: totalMeters,
    durationSeconds,
    distanceKm,
    distanceMiles: parseFloat((distanceKm * 0.621371).toFixed(1)),
    distanceFormatted: formatDistance(totalMeters),
    durationFormatted: formatDuration(durationSeconds),
    coordinates,
    legs,
    dataSource: "haversine_estimate",
    isLiveTraffic: false,
    disclaimer: "Estimated geodesic corridor distance. Real driving distances may vary based on terrain and tolls.",
  }
}
