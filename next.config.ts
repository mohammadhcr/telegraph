import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  sassOptions: {
    additionalData: ``,
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "static-00.iconduck.com" },
      { protocol: "https", hostname: "wckzanbwucgwxaywopxg.supabase.co" },
    ],
  },

  // Keep Turbopack active in development.
  turbopack: {},
};
export default nextConfig;
