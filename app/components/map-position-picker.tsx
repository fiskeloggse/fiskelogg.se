"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerIcon2xUrl from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";

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

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    let cancelled = false;
    let map: import("leaflet").Map | undefined;

    import("leaflet").then((leafletModule) => {
      if (cancelled || !containerRef.current) return;
      const L = leafletModule.default;

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

      map = L.map(containerRef.current).setView(
        center,
        hasPosition ? PINNED_ZOOM : DEFAULT_ZOOM
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

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
      map?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-1.5">
      <div
        ref={containerRef}
        className="h-96 w-full overflow-hidden rounded-lg border border-black/10 dark:border-white/15"
      />
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Tryck på kartan för att sätta eller flytta positionen.
      </p>
    </div>
  );
}
