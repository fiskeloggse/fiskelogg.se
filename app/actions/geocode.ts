"use server";

type OverpassElement = {
  center?: { lat: number; lon: number };
  lat?: number;
  lon?: number;
  tags?: { name?: string; water?: string };
};

function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Finds the name of the nearest named lake to a GPS position, via
// OpenStreetMap's Overpass API — no API key needed, matching how the app's
// maps are already self-hosted against OSM rather than a paid provider.
export async function lookupLakeName(
  lat: number,
  lng: number
): Promise<string | null> {
  const query = `[out:json][timeout:8];(way["natural"="water"]["name"](around:1500,${lat},${lng});relation["natural"="water"]["name"](around:1500,${lat},${lng}););out center;`;

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        "User-Agent": "Fisklogg (fisklogg.se)",
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const elements: OverpassElement[] = data.elements ?? [];

    let best: { name: string; distance: number; isLake: boolean } | null = null;
    for (const el of elements) {
      const name = el.tags?.name;
      const elLat = el.center?.lat ?? el.lat;
      const elLon = el.center?.lon ?? el.lon;
      if (!name || elLat == null || elLon == null) continue;

      const distance = distanceMeters(lat, lng, elLat, elLon);
      const isLake = el.tags?.water === "lake";
      // Prefer an explicitly-tagged lake over other water bodies (ponds,
      // reservoirs) even if slightly farther away.
      if (
        !best ||
        (isLake && !best.isLake) ||
        (isLake === best.isLake && distance < best.distance)
      ) {
        best = { name, distance, isLake };
      }
    }

    return best?.name ?? null;
  } catch {
    return null;
  }
}
