import "server-only";
import { TIMEZONE } from "./constants";

export type WeatherResult = {
  temp_c: number | null;
  description: string;
  wind_kmh: number | null;
  wind_dir_deg: number | null;
  pressure_hpa: number | null;
  cloud_pct: number | null;
};

// WMO weather codes (used by Open-Meteo) mapped to short Swedish
// descriptions. https://open-meteo.com/en/docs — "WMO Weather interpretation
// codes".
const WEATHER_CODES: Record<number, string> = {
  0: "Klart",
  1: "Mest klart",
  2: "Växlande molnighet",
  3: "Mulet",
  45: "Dimma",
  48: "Underkylt dimma",
  51: "Lätt duggregn",
  53: "Duggregn",
  55: "Kraftigt duggregn",
  56: "Lätt underkylt duggregn",
  57: "Underkylt duggregn",
  61: "Lätt regn",
  63: "Regn",
  65: "Kraftigt regn",
  66: "Lätt underkylt regn",
  67: "Underkylt regn",
  71: "Lätt snöfall",
  73: "Snöfall",
  75: "Kraftigt snöfall",
  77: "Snökorn",
  80: "Lätta regnskurar",
  81: "Regnskurar",
  82: "Kraftiga regnskurar",
  85: "Lätta snöbyar",
  86: "Kraftiga snöbyar",
  95: "Åska",
  96: "Åska med hagel",
  99: "Kraftig åska med hagel",
};

function describeCode(code: number | undefined): string {
  if (code == null) return "Okänt";
  return WEATHER_CODES[code] ?? "Okänt";
}

// Only the archive API has data older than a couple of days, and it only
// has data up until a day or so before "now" — so anything within the last
// ~24h is fetched from the forecast API's "current" reading instead.
const ARCHIVE_CUTOFF_MS = 24 * 60 * 60 * 1000;

export async function getWeatherAt(
  latitude: number,
  longitude: number,
  at: Date
): Promise<WeatherResult | null> {
  const isRecent = Date.now() - at.getTime() < ARCHIVE_CUTOFF_MS;

  try {
    if (isRecent) {
      return await fetchCurrentWeather(latitude, longitude);
    }
    return await fetchHistoricalWeather(latitude, longitude, at);
  } catch {
    return null;
  }
}

async function fetchCurrentWeather(
  latitude: number,
  longitude: number
): Promise<WeatherResult | null> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set(
    "current",
    "temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,cloud_cover"
  );
  url.searchParams.set("timezone", TIMEZONE);

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;
  const data = await res.json();
  const current = data.current;
  if (!current) return null;

  return {
    temp_c: current.temperature_2m ?? null,
    description: describeCode(current.weather_code),
    wind_kmh: current.wind_speed_10m ?? null,
    wind_dir_deg: current.wind_direction_10m ?? null,
    pressure_hpa: current.surface_pressure ?? null,
    cloud_pct: current.cloud_cover ?? null,
  };
}

async function fetchHistoricalWeather(
  latitude: number,
  longitude: number,
  at: Date
): Promise<WeatherResult | null> {
  const dateStr = at.toLocaleDateString("sv-SE", { timeZone: TIMEZONE }); // YYYY-MM-DD

  const url = new URL("https://archive-api.open-meteo.com/v1/archive");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("start_date", dateStr);
  url.searchParams.set("end_date", dateStr);
  url.searchParams.set(
    "hourly",
    "temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,cloud_cover"
  );
  url.searchParams.set("timezone", TIMEZONE);

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;
  const data = await res.json();
  const hourly = data.hourly;
  if (!hourly?.time?.length) return null;

  // Pick the hour closest to the catch's actual time.
  const times: string[] = hourly.time;
  let bestIndex = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < times.length; i++) {
    const diff = Math.abs(new Date(times[i]).getTime() - at.getTime());
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = i;
    }
  }

  return {
    temp_c: hourly.temperature_2m?.[bestIndex] ?? null,
    description: describeCode(hourly.weather_code?.[bestIndex]),
    wind_kmh: hourly.wind_speed_10m?.[bestIndex] ?? null,
    wind_dir_deg: hourly.wind_direction_10m?.[bestIndex] ?? null,
    pressure_hpa: hourly.surface_pressure?.[bestIndex] ?? null,
    cloud_pct: hourly.cloud_cover?.[bestIndex] ?? null,
  };
}
