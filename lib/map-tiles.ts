// Shared tile-layer definitions for every Leaflet map in the app, so the
// street/satellite toggle looks and behaves the same everywhere.
export type MapTileType = "street" | "satellite";

export const MAP_TILE_LAYERS: Record<
  MapTileType,
  { url: string; attribution: string; maxZoom: number }
> = {
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; <a href=\"https://www.esri.com/\">Esri</a>",
    maxZoom: 19,
  },
};
