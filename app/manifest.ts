import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fisklogg",
    short_name: "Fisklogg",
    description: "Logga dina fångster – art, längd, vikt och tid.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f7f9",
    theme_color: "#f6f7f9",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
