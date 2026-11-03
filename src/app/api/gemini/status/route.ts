import { NextResponse } from "next/server"

export async function GET() {
  const serverKey = process.env.GEMINI_API_KEY || ""
  const isConfigured = Boolean(
    serverKey &&
    serverKey.length > 15 &&
    !serverKey.includes("placeholder") &&
    serverKey !== "your_gemini_api_key"
  )

  return NextResponse.json({
    configured: isConfigured,
    model: "gemini-2.5-flash",
  })
}

