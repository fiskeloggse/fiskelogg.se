"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerIcon2xUrl from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";
import { MAP_TILE_LAYERS, type MapTileType } from "@/lib/map-tiles";

// Sweden-ish default center/zoom for a fresh pin with no existing position.
const DEFAULT_CENTER: [number, number] = [62.0, 15.0];
const DEFAULT_ZOOM = 4;
const PINNED_ZOOM = 13;

export default function MapPositionPicker({
  latitude,
  longitude,
  onChange,
}: {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const tileLayerRef = useRef<import("leaflet").TileLayer | null>(null);
  const appliedTileTypeRef = useRef<MapTileType | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [tileType, setTileType] = useState<MapTileType>("street");

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    let cancelled = false;

    import("leaflet").then((leafletModule) => {
      if (cancelled || !containerRef.current) return;
      const L = leafletModule.default;
      leafletRef.current = L;

      // Leaflet's default marker icon URLs are relative paths that break
      // under Next.js's bundler; point them at the bundled asset URLs instead.
      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: markerIcon2xUrl,
        iconUrl: markerIconUrl,
        shadowUrl: markerShadowUrl,
      });

      const hasPosition = latitude != null && longitude != null;
      const center: [number, number] = hasPosition
        ? [latitude!, longitude!]
        : DEFAULT_CENTER;

      const map = L.map(containerRef.current).setView(
        center,
        hasPosition ? PINNED_ZOOM : DEFAULT_ZOOM
      );
      mapRef.current = map;
      const initialConfig = MAP_TILE_LAYERS[tileType];
      tileLayerRef.current = L.tileLayer(initialConfig.url, {
        attribution: initialConfig.attribution,
        maxZoom: initialConfig.maxZoom,
      }).addTo(map);
      appliedTileTypeRef.current = tileType;
      setMapReady(true);

      let marker = hasPosition
        ? L.marker(center, { draggable: true }).addTo(map)
        : null;

      function placeMarker(lat: number, lng: number) {
        if (marker) {
          marker.setLatLng([lat, lng]);
        } else if (map) {
          marker = L.marker([lat, lng], { draggable: true }).addTo(map);
          marker.on("dragend", () => {
            const pos = marker!.getLatLng();
            onChangeRef.current(pos.lat, pos.lng);
          });
        }
        onChangeRef.current(lat, lng);
      }

      if (marker) {
        marker.on("dragend", () => {
          const pos = marker!.getLatLng();
          onChangeRef.current(pos.lat, pos.lng);
        });
      }

      map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
        placeMarker(e.latlng.lat, e.latlng.lng);
      });
    });

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
  // is created above, so this only acts once tileType actually differs
  // from what's currently shown.
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

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <div
          ref={containerRef}
          className="h-96 w-full overflow-hidden rounded-lg border border-black/10 dark:border-white/15"
        />
        <button
          type="button"
          onClick={() => setTileType((t) => (t === "street" ? "satellite" : "street"))}
          className="absolute bottom-2 left-2 z-[1000] rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-medium shadow dark:border-white/15 dark:bg-zinc-900"
        >
          {tileType === "street" ? "Satellit" : "Karta"}
        </button>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Tryck på kartan för att sätta eller flytta positionen.
      </p>
    </div>
  );
}
