"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
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
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([import("leaflet"), import("leaflet.markercluster")]).then(
      ([leafletModule]) => {
        if (cancelled || !containerRef.current || catches.length === 0) return;
        const L = leafletModule.default;

        delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: markerIcon2xUrl,
          iconUrl: markerIconUrl,
          shadowUrl: markerShadowUrl,
        });

        const map = L.map(containerRef.current);
        mapRef.current = map;
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
      }
    );

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [catches]);

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
        onClick={() => setFullscreen((v) => !v)}
        className="absolute right-2 top-2 z-[1000] rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-medium shadow dark:border-white/15 dark:bg-zinc-900"
      >
        {fullscreen ? "Stäng" : "Fullskärm"}
      </button>
    </div>
  );
}
