"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerIcon2xUrl from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";
import type { MappedCatchRow } from "@/lib/stats";
import { MAP_TILE_LAYERS, type MapTileType } from "@/lib/map-tiles";

function formatSv(n: number): string {
  return (Math.round(n * 100) / 100).toString().replace(".", ",");
}

function popupHtml(item: MappedCatchRow) {
  const measurements = [
    item.length_cm != null ? `${item.length_cm} cm` : null,
    item.weight_kg != null ? `${formatSv(item.weight_kg)} kg` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const dateStr = item.caught_at.toLocaleDateString("sv-SE", { dateStyle: "medium" });
  const escapedSpecies = (item.species || "Okänd art").replace(/</g, "&lt;");
  return `
    <a href="/register/${item.id}" style="font-weight:600;text-decoration:underline">${escapedSpecies}</a><br>
    ${measurements ? `${measurements}<br>` : ""}
    <span style="color:#71717a">${dateStr}</span>
  `;
}

type LakeGroup = {
  lake: string;
  lat: number;
  lng: number;
  catches: MappedCatchRow[];
};

function groupByLake(catches: MappedCatchRow[]): LakeGroup[] {
  const byLake = new Map<string, MappedCatchRow[]>();
  for (const c of catches) {
    const list = byLake.get(c.lake);
    if (list) list.push(c);
    else byLake.set(c.lake, [c]);
  }
  return Array.from(byLake.entries()).map(([lake, list]) => ({
    lake,
    lat: list.reduce((sum, c) => sum + c.latitude, 0) / list.length,
    lng: list.reduce((sum, c) => sum + c.longitude, 0) / list.length,
    catches: list,
  }));
}

export default function WatersMap({ catches }: { catches: MappedCatchRow[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const tileLayerRef = useRef<import("leaflet").TileLayer | null>(null);
  const appliedTileTypeRef = useRef<MapTileType | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [expandedLake, setExpandedLake] = useState<string | null>(null);
  const [tileType, setTileType] = useState<MapTileType>("street");

  const lakeGroups = groupByLake(catches);

  // Create the map once. leaflet.markercluster is a plain UMD script that
  // assumes a global L already exists rather than importing leaflet itself
  // — leaflet sets that global as a side effect once its own module has
  // run, so it must be awaited first (see the same fix in catches-map.tsx).
  useEffect(() => {
    let cancelled = false;

    import("leaflet").then((leafletModule) =>
      import("leaflet.markercluster").then(() => {
        if (cancelled || !containerRef.current || lakeGroups.length === 0) return;
        const L = leafletModule.default;
        leafletRef.current = L;

        delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: markerIcon2xUrl,
          iconUrl: markerIconUrl,
          shadowUrl: markerShadowUrl,
        });

        const map = L.map(containerRef.current);
        mapRef.current = map;
        // fitBounds below needs a tile layer already present — it queries
        // the map's maxZoom internally and throws ("Map has no maxZoom
        // specified") if no layer has defined one yet. The toggle effect
        // still owns switching between street/satellite after this.
        const initialConfig = MAP_TILE_LAYERS[tileType];
        tileLayerRef.current = L.tileLayer(initialConfig.url, {
          attribution: initialConfig.attribution,
          maxZoom: initialConfig.maxZoom,
        }).addTo(map);
        appliedTileTypeRef.current = tileType;

        if (lakeGroups.length === 1) {
          map.setView([lakeGroups[0].lat, lakeGroups[0].lng], 11);
        } else {
          const bounds = L.latLngBounds(
            lakeGroups.map((g) => [g.lat, g.lng] as [number, number])
          );
          map.fitBounds(bounds, { padding: [24, 24] });
        }

        setMapReady(true);
      })
    );

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      appliedTileTypeRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switches the tile layer after the user toggles it — the initial layer
  // is created above (fitBounds needs one to exist already), so this only
  // acts once tileType actually differs from what's currently shown.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map || !mapReady || appliedTileTypeRef.current === tileType) return;
    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
    const config = MAP_TILE_LAYERS[tileType];
    tileLayerRef.current = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
    }).addTo(map);
    appliedTileTypeRef.current = tileType;
  }, [mapReady, tileType]);

  // Marker layer: one pin per water, or — for the expanded water — its
  // individual catch pins instead. Rebuilt whenever the expanded water
  // changes, without touching the map instance itself (keeps zoom/pan).
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map || !mapReady) return;

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    const layer = L.layerGroup();
    for (const group of lakeGroups) {
      if (group.lake === expandedLake) {
        const clusterGroup = L.markerClusterGroup();
        for (const item of group.catches) {
          L.marker([item.latitude, item.longitude])
            .bindPopup(popupHtml(item))
            .addTo(clusterGroup);
        }
        clusterGroup.addTo(layer);
      } else {
        const marker = L.marker([group.lat, group.lng]);
        marker.bindTooltip(`${group.lake} (${group.catches.length})`, {
          permanent: true,
          direction: "top",
          offset: [0, -30],
          className: "!rounded-full !border-none !bg-foreground !px-2 !py-0.5 !text-background !text-xs !font-medium",
        });
        marker.on("click", () => setExpandedLake(group.lake));
        marker.addTo(layer);
      }
    }
    layer.addTo(map);
    layerRef.current = layer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, expandedLake]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      mapRef.current?.invalidateSize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setFullscreen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [fullscreen]);

  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-50 bg-white dark:bg-black"
          : "relative h-80 w-full overflow-hidden rounded-xl border border-black/10 dark:border-white/15"
      }
    >
      <div ref={containerRef} className="h-full w-full" />
      {expandedLake && (
        <button
          type="button"
          onClick={() => setExpandedLake(null)}
          className="absolute left-2 top-2 z-[1000] rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-medium shadow dark:border-white/15 dark:bg-zinc-900"
        >
          ← Alla vatten
        </button>
      )}
      <button
        type="button"
        onClick={() => setFullscreen((v) => !v)}
        className="absolute right-2 top-2 z-[1000] rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-medium shadow dark:border-white/15 dark:bg-zinc-900"
      >
        {fullscreen ? "Stäng" : "Fullskärm"}
      </button>
      <button
        type="button"
        onClick={() => setTileType((t) => (t === "street" ? "satellite" : "street"))}
        className="absolute left-2 bottom-2 z-[1000] rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-medium shadow dark:border-white/15 dark:bg-zinc-900"
      >
        {tileType === "street" ? "Satellit" : "Karta"}
      </button>
    </div>
  );
}
