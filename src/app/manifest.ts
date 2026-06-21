import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "My Learning Vault",
    short_name: "Vault",
    description: "Your personal learning library.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#faf8f3",
    theme_color: "#14694f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
