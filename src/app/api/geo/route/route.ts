import { NextResponse } from "next/server"
import { calculateRoute, RouteWaypoint } from "@/lib/geo/routing-provider"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { waypoints, mode = "driving" } = body

    if (!Array.isArray(waypoints) || waypoints.length < 2) {
      return NextResponse.json(
        { error: "At least two waypoints with lat and lng are required." },
        { status: 400 }
      )
    }

    const validWaypoints: RouteWaypoint[] = waypoints.map((w: any) => ({
      lat: Number(w.lat),
      lng: Number(w.lng),
      name: w.name ? String(w.name) : undefined,
    }))

    const route = await calculateRoute(validWaypoints, mode)
    return NextResponse.json({ success: true, route })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to calculate route telemetry." },
      { status: 500 }
    )
  }
}

