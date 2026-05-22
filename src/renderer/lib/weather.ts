export interface ForecastDay {
  date: string
  max: number
  min: number
  code: number
  precipProb: number
  sunrise: string
  sunset: string
}

export interface WeatherData {
  temp: number
  feelsLike: number
  humidity: number
  windSpeed: number
  windDir: number
  pressure: number
  uvIndex: number
  code: number
  daily: ForecastDay[]
}

const WMO_ICONS: Record<number, string> = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌦️', 56: '🌧️', 57: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️', 66: '🌧️', 67: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '🌨️', 77: '🌨️',
  80: '🌦️', 81: '🌦️', 82: '🌦️',
  85: '🌨️', 86: '🌨️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
}

export function weatherEmoji(code: number) {
  return WMO_ICONS[code] || '🌡️'
}

export function weatherLabel(code: number) {
  const labels: Record<number, string> = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Depositing rime fog',
    51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
    56: 'Freezing drizzle', 57: 'Freezing drizzle',
    61: 'Light rain', 63: 'Moderate rain', 65: 'Heavy rain',
    66: 'Freezing rain', 67: 'Freezing rain',
    71: 'Light snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
    80: 'Light showers', 81: 'Moderate showers', 82: 'Violent showers',
    85: 'Light snow showers', 86: 'Heavy snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with hail',
  }
  return labels[code] || 'Unknown'
}

export function dayLabel(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function windLabel(deg: number) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}

function sunriseDisplay(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export async function fetchWeather(location: string): Promise<WeatherData | null> {
  const query = location.split(',')[0].trim()
  if (!query) return null

  const isZip = /^\d{5}$/.test(query)
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json${isZip ? '&countries=US' : ''}`
  )
  const geo = await geoRes.json()
  if (!geo.results?.length) return null

  const { latitude, longitude } = geo.results[0]
  const weatherRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weathercode,wind_speed_10m,wind_direction_10m,surface_pressure,uv_index` +
    `&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max,sunrise,sunset` +
    `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=7`
  )
  const data = await weatherRes.json()
  if (!data?.current_weather && !data?.current) return null

  const c = data.current

  return {
    temp: Math.round(c.temperature_2m),
    feelsLike: Math.round(c.apparent_temperature),
    humidity: c.relative_humidity_2m,
    windSpeed: Math.round(c.wind_speed_10m),
    windDir: c.wind_direction_10m,
    pressure: Math.round(c.surface_pressure),
    uvIndex: Math.round(c.uv_index * 10) / 10,
    code: c.weathercode,
    daily: data.daily?.time?.map((date: string, i: number) => ({
      date,
      max: Math.round(data.daily.temperature_2m_max[i]),
      min: Math.round(data.daily.temperature_2m_min[i]),
      code: data.daily.weathercode[i],
      precipProb: data.daily.precipitation_probability_max[i] ?? 0,
      sunrise: sunriseDisplay(data.daily.sunrise[i]),
      sunset: sunriseDisplay(data.daily.sunset[i]),
    })) || [],
  }
}
