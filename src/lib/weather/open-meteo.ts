/**
 * AERIS Live Weather Telemetry Provider
 * Uses Open-Meteo API (Worldwide, free, real-time meteorological telemetry).
 */

export interface DailyWeatherForecast {
  date: string
  maxTempC: number
  minTempC: number
  maxTempF: number
  minTempF: number
  condition: string
  precipitationProbPercent: number
}

export interface LiveWeatherData {
  locationName?: string
  latitude: number
  longitude: number
  currentTempC: number
  currentTempF: number
  windSpeedKmH: number
  windDirectionDegrees: number
  weatherCode: number
  conditionText: string
  isDay: boolean
  daily: DailyWeatherForecast[]
  timestamp: string
  source: "Open-Meteo Global Weather Telemetry"
  disclaimer: "Live atmospheric telemetry retrieved directly from Open-Meteo ground stations and numerical models."
}

// Translate WMO Weather Interpretation Codes (WW)
function interpretWmoCode(code: number): string {
  switch (code) {
    case 0:
      return "Clear Sky"
    case 1:
      return "Mainly Clear"
    case 2:
      return "Partly Cloudy"
    case 3:
      return "Overcast"
    case 45:
    case 48:
      return "Foggy & Depositing Rime"
    case 51:
    case 53:
    case 55:
      return "Light to Moderate Drizzle"
    case 56:
    case 57:
      return "Freezing Drizzle"
    case 61:
    case 63:
    case 65:
      return "Rain Showers"
    case 66:
    case 67:
      return "Heavy Freezing Rain"
    case 71:
    case 73:
    case 75:
      return "Snowfall"
    case 77:
      return "Snow Grains"
    case 80:
    case 81:
    case 82:
      return "Rain Showers"
    case 85:
    case 86:
      return "Heavy Snow Showers"
    case 95:
      return "Thunderstorm"
    case 96:
    case 99:
      return "Thunderstorm with Hail"
    default:
      return "Fair Conditions"
  }
}

export async function fetchLiveWeather(
  lat: number,
  lng: number,
  locationName?: string
): Promise<LiveWeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 6000)

  const res = await fetch(url, {
    headers: { "User-Agent": "AERIS-Travel-Intelligence/2.0" },
    signal: controller.signal,
  }).finally(() => clearTimeout(timer))

  if (!res.ok) {
    throw new Error(`Open-Meteo returned status ${res.status}: ${res.statusText}`)
  }

  const data = await res.json()
  const cw = data.current_weather

  if (!cw) {
    throw new Error("Invalid response structure from Open-Meteo")
  }

  const currentTempC = Math.round(cw.temperature)
  const currentTempF = Math.round((currentTempC * 9) / 5 + 32)
  const weatherCode = cw.weathercode ?? 0
  const conditionText = interpretWmoCode(weatherCode)

  const daily: DailyWeatherForecast[] = []
  if (data.daily && Array.isArray(data.daily.time)) {
    for (let i = 0; i < Math.min(5, data.daily.time.length); i++) {
      const maxC = Math.round(data.daily.temperature_2m_max[i] || 0)
      const minC = Math.round(data.daily.temperature_2m_min[i] || 0)
      daily.push({
        date: data.daily.time[i],
        maxTempC: maxC,
        minTempC: minC,
        maxTempF: Math.round((maxC * 9) / 5 + 32),
        minTempF: Math.round((minC * 9) / 5 + 32),
        condition: interpretWmoCode(data.daily.weathercode[i] ?? 0),
        precipitationProbPercent: data.daily.precipitation_probability_max[i] ?? 0,
      })
    }
  }

  return {
    locationName,
    latitude: lat,
    longitude: lng,
    currentTempC,
    currentTempF,
    windSpeedKmH: cw.windspeed || 0,
    windDirectionDegrees: cw.winddirection || 0,
    weatherCode,
    conditionText,
    isDay: Boolean(cw.is_day),
    daily,
    timestamp: new Date().toISOString(),
    source: "Open-Meteo Global Weather Telemetry",
    disclaimer: "Live atmospheric telemetry retrieved directly from Open-Meteo ground stations and numerical models.",
  }
}

