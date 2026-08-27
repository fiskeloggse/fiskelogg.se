"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerIcon2xUrl from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";
import { MAP_TILE_LAYERS, type MapTileType } from "@/lib/map-tiles";

export type MapCatch = {
  id: number;
  species: string | null;
  length_cm: number | null;
  weight_kg: number | null;
  caught_at: Date;
  latitude: number;
  longitude: number;
};

function formatSv(n: number): string {
  return (Math.round(n * 100) / 100).toString().replace(".", ",");
}

function popupHtml(item: MapCatch) {
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

export default function CatchesMap({ catches }: { catches: MapCatch[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const tileLayerRef = useRef<import("leaflet").TileLayer | null>(null);
  const appliedTileTypeRef = useRef<MapTileType | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [tileType, setTileType] = useState<MapTileType>("street");

  useEffect(() => {
    let cancelled = false;

    // leaflet.markercluster is a plain UMD script that assumes a global `L`
    // already exists (it never imports/requires leaflet itself) — leaflet's
    // own module sets that global as a side effect, but only once its top-
    // level code has actually run. Importing both in parallel races the two
    // module evaluations, so markercluster's factory can execute before
    // that global exists ("L is not defined"). Awaiting leaflet first
    // guarantees the global is set before markercluster loads.
    import("leaflet").then((leafletModule) =>
      import("leaflet.markercluster").then(() => {
        if (cancelled || !containerRef.current || catches.length === 0) return;
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

        if (catches.length === 1) {
          map.setView([catches[0].latitude, catches[0].longitude], 13);
        } else {
          const bounds = L.latLngBounds(
            catches.map((c) => [c.latitude, c.longitude] as [number, number])
          );
          map.fitBounds(bounds, { padding: [24, 24] });
        }

        // Groups nearby markers into a single numbered bubble while zoomed
        // out, splitting apart as you zoom in — the default cluster icon
        // already shows the count, no custom rendering needed.
        const clusterGroup = L.markerClusterGroup();
        for (const item of catches) {
          L.marker([item.latitude, item.longitude])
            .bindPopup(popupHtml(item))
            .addTo(clusterGroup);
        }
        clusterGroup.addTo(map);
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
    // tileType is intentionally read only for its value at mount time here
    // — the toggle effect below owns switching it later; including it would
    // tear down and rebuild the whole map (losing fitBounds) on every click.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catches]);

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

  // Leaflet doesn't notice its container resizing on its own (inline card
  // <-> fullscreen overlay). A one-shot requestAnimationFrame after toggling
  // `fullscreen` isn't reliable — ResizeObserver instead reacts to the
  // container's actual size once the new layout has really applied.
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
      {/* Leaflet takes over this element's classList imperatively (adds
          "leaflet-container" etc.) once mounted — if React ever rewrote its
          className too (e.g. toggling classes here for fullscreen), that
          write would wipe Leaflet's own classes and silently break the map.
          So this className must stay a fixed literal, never an expression
          that changes across renders; all fullscreen sizing lives on the
          wrapper above instead. */}
      <div ref={containerRef} className="h-full w-full" />
      <button
        type="button"
        onClick={() => setTileType((t) => (t === "street" ? "satellite" : "street"))}
        className="absolute bottom-2 left-2 z-[1000] rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-medium shadow dark:border-white/15 dark:bg-zinc-900"
      >
        {tileType === "street" ? "Satellit" : "Karta"}
      </button>
      <button
        type="button"
        onClick={() => setFullscreen((v) => !v)}
        className="absolute right-2 top-2 z-[1000] rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-medium shadow dark:border-white/15 dark:bg-zinc-900"
      >
        {fullscreen ? "Stäng" : "Fullskärm"}
      </button>
    </div>
  );
}
