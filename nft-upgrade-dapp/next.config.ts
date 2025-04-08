import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["i.imgur.com", "raw.githubusercontent.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
