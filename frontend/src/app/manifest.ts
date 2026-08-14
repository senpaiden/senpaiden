import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Senpai Den — Manga, Manhwa & Webtoons",
    short_name: "Senpai Den",
    description: "Discover manga, manhwa and webtoons and follow your reading journey.",
    start_url: "/",
    display: "standalone",
    background_color: "#08080C",
    theme_color: "#08080C",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
  };
}
