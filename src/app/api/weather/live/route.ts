import { NextResponse } from "next/server"
import { fetchLiveWeather } from "@/lib/weather/open-meteo"
import { geoProvider } from "@/lib/geo/geo-provider"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("destination") || searchParams.get("q")
  let lat = parseFloat(searchParams.get("lat") || "")
  let lng = parseFloat(searchParams.get("lng") || "")
  let locationName = searchParams.get("name") || query || "Target Destination"

  try {
    // If lat or lng is missing, resolve dynamically via geoProvider
    if (isNaN(lat) || isNaN(lng)) {
      if (!query) {
        return NextResponse.json(
          { error: "Provide either lat/lng or destination query." },
          { status: 400 }
        )
      }
      const geoResults = await geoProvider.search(query, 1)
      if (geoResults.length === 0) {
        return NextResponse.json(
          { error: `Could not geocode destination: "${query}"` },
          { status: 404 }
        )
      }
      lat = geoResults[0].lat
      lng = geoResults[0].lng
      locationName = geoResults[0].displayName
    }

    const weather = await fetchLiveWeather(lat, lng, locationName)
    return NextResponse.json({ success: true, weather })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to retrieve live weather telemetry." },
      { status: 500 }
    )
  }
}

