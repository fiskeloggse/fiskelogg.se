"use server";

type OverpassElement = {
  center?: { lat: number; lon: number };
  lat?: number;
  lon?: number;
  tags?: { name?: string; water?: string; waterway?: string };
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

// Lower is better. Rules out decorative/non-fishing water (fountains,
// pools, drainage) entirely by returning Infinity for it.
function rank(tags: { water?: string; waterway?: string }): number {
  if (tags.water === "basin" || tags.water === "fountain" || tags.water === "wastewater") {
    return Infinity;
  }
  if (tags.waterway === "drain" || tags.waterway === "ditch") return Infinity;

  if (tags.water === "lake" || tags.waterway === "river") return 0;
  if (
    tags.water === "pond" ||
    tags.water === "reservoir" ||
    tags.water === "lagoon" ||
    tags.waterway === "stream" ||
    tags.waterway === "canal"
  ) {
    return 1;
  }
  return 2;
}

// Finds the name of the nearest named body of water (lake, river, stream,
// pond, ...) to a GPS position, via OpenStreetMap's Overpass API — no API
// key needed, matching how the app's maps are already self-hosted against
// OSM rather than a paid provider.
export async function lookupWaterName(
  lat: number,
  lng: number
): Promise<string | null> {
  const query = `[out:json][timeout:12];(way["natural"="water"]["name"](around:1500,${lat},${lng});relation["natural"="water"]["name"](around:1500,${lat},${lng});way["waterway"]["name"](around:800,${lat},${lng}););out center;`;

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        "User-Agent": "Fisklogg (fisklogg.se)",
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const elements: OverpassElement[] = data.elements ?? [];

    let best: { name: string; distance: number; rank: number } | null = null;
    for (const el of elements) {
      const name = el.tags?.name;
      const elLat = el.center?.lat ?? el.lat;
      const elLon = el.center?.lon ?? el.lon;
      if (!name || elLat == null || elLon == null) continue;

      const elRank = rank(el.tags ?? {});
      if (!Number.isFinite(elRank)) continue;

      const distance = distanceMeters(lat, lng, elLat, elLon);
      if (
        !best ||
        elRank < best.rank ||
        (elRank === best.rank && distance < best.distance)
      ) {
        best = { name, distance, rank: elRank };
      }
    }

    return best?.name ?? null;
  } catch {
    return null;
  }
}
