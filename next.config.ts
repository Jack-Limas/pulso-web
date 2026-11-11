import type { NextConfig } from "next";

// The classic rendering model keeps SSG, ISR, SSR and CSR explicit per route,
// which is what this project demonstrates.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
