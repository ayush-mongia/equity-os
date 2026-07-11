import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EquityOS — Real Returns on US Stocks",
    short_name: "EquityOS",
    description:
      "Track your US equity portfolio with inflation, currency & tax-adjusted real returns — built for Indian investors.",
    start_url: "/dashboard",
    id: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#080d1a",
    theme_color: "#080d1a",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
