import { ActivityItem } from "@/components/trip/activity-card"

interface ExportDay {
  dayNumber: number
  title: string
  activities: ActivityItem[]
}

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

function escapeICS(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
}

/**
 * Generates and triggers download of an RFC 5545 compliant .ics calendar file.
 */
export function exportToICalendar(
  tripTitle: string,
  destination: string,
  startDateStr: string,
  days: ExportDay[]
): void {
  try {
    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//ROVEO Travel//Manual Planner v2.0//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:${escapeICS(tripTitle || "ROVEO Travel Itinerary")}`,
      "X-WR-TIMEZONE:UTC",
    ]

    const baseDateParts = (startDateStr || "2026-09-10").split("-").map(Number)
    const baseYear = baseDateParts[0] || 2026
    const baseMonth = (baseDateParts[1] || 9) - 1
    const baseDay = baseDateParts[2] || 10

    days.forEach((day) => {
      // Calculate calendar date for this day
      const eventDate = new Date(Date.UTC(baseYear, baseMonth, baseDay + (day.dayNumber - 1)))
      const dateY = eventDate.getUTCFullYear()
      const dateM = pad2(eventDate.getUTCMonth() + 1)
      const dateD = pad2(eventDate.getUTCDate())
      const datePrefix = `${dateY}${dateM}${dateD}`

      day.activities.forEach((act, actIdx) => {
        const sTime = act.startTime || "10:00"
        const eTime = act.endTime || "11:30"
        const [sH, sM] = sTime.split(":").map(Number)
        const [eH, eM] = eTime.split(":").map(Number)

        const dtStart = `${datePrefix}T${pad2(sH || 10)}${pad2(sM || 0)}00`
        const dtEnd = `${datePrefix}T${pad2(eH || 11)}${pad2(eM || 30)}00`
        const uid = `roveo-${Date.now()}-${day.dayNumber}-${actIdx}@roveo.travel`

        let desc = act.description || ""
        if (act.estimatedCost && act.estimatedCost !== "Free") {
          desc += `\\nCost: ${act.estimatedCost}`
        }
        if (act.category) {
          desc += `\\nCategory: ${act.category}`
        }
        if (act.bookingStatus) {
          desc += `\\nStatus: ${act.bookingStatus.toUpperCase()}`
        }

        lines.push("BEGIN:VEVENT")
        lines.push(`UID:${uid}`)
        lines.push(`DTSTAMP:${datePrefix}T000000Z`)
        lines.push(`DTSTART:${dtStart}`)
        lines.push(`DTEND:${dtEnd}`)
        lines.push(`SUMMARY:${escapeICS(act.title || "Experience")}`)
        if (desc) lines.push(`DESCRIPTION:${escapeICS(desc)}`)
        if (act.location || destination) {
          lines.push(`LOCATION:${escapeICS(act.location || destination)}`)
        }
        lines.push("STATUS:CONFIRMED")
        lines.push("END:VEVENT")
      })
    })

    lines.push("END:VCALENDAR")

    const icsContent = lines.join("\r\n")
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    const safeTitle = (tripTitle || "Roveo-Trip").toLowerCase().replace(/[^a-z0-9]+/g, "-")
    link.download = `${safeTitle}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Failed to export calendar:", error)
    throw error
  }
}

