/**
 * AERIS Route & Distance Telemetry Provider
 * Uses OSRM (Open Source Routing Machine) for real road network routing,
 * distances, and road geometries.
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
  dataSource: "osrm_road_network" | "haversine_estimate"
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

export async function calculateRoute(
  waypoints: RouteWaypoint[],
  mode: "driving" | "walking" | "bike" = "driving"
): Promise<RouteResult> {
  if (waypoints.length < 2) {
    throw new Error("At least 2 waypoints are required to calculate a route.")
  }

  // Format waypoints as lon,lat;lon,lat for OSRM
  const coordsString = waypoints.map((w) => `${w.lng},${w.lat}`).join(";")

  try {
    const url = `https://router.project-osrm.org/route/v1/${mode}/${coordsString}?overview=full&geometries=geojson&steps=false`

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 7000)

    const res = await fetch(url, {
      headers: { "User-Agent": "AERIS-Travel-Intelligence/2.0" },
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

  // Fallback: Haversine distance with 1.3 road winding curvature factor
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

