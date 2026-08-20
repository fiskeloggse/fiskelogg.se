"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerIcon2xUrl from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";

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

  useEffect(() => {
    let cancelled = false;
    let map: import("leaflet").Map | undefined;

    import("leaflet").then((leafletModule) => {
      if (cancelled || !containerRef.current || catches.length === 0) return;
      const L = leafletModule.default;

      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: markerIcon2xUrl,
        iconUrl: markerIconUrl,
        shadowUrl: markerShadowUrl,
      });

      map = L.map(containerRef.current);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      if (catches.length === 1) {
        map.setView([catches[0].latitude, catches[0].longitude], 13);
      } else {
        const bounds = L.latLngBounds(
          catches.map((c) => [c.latitude, c.longitude] as [number, number])
        );
        map.fitBounds(bounds, { padding: [24, 24] });
      }

      for (const item of catches) {
        L.marker([item.latitude, item.longitude])
          .addTo(map)
          .bindPopup(popupHtml(item));
      }
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [catches]);

  return (
    <div
      ref={containerRef}
      className="h-80 w-full overflow-hidden rounded-xl border border-black/10 dark:border-white/15"
    />
  );
}
