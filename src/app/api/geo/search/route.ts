import { NextResponse } from "next/server"
import { geoProvider } from "@/lib/geo/geo-provider"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") || ""
  const limit = Math.min(10, Math.max(1, Number(searchParams.get("limit")) || 5))

  if (!q.trim() || q.trim().length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const results = await geoProvider.search(q, limit)
    return NextResponse.json({ results })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to search location" },
      { status: 500 }
    )
  }
}

