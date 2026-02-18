import type { NextConfig } from "next";
import nextPWA from "next-pwa";

const withPWA = nextPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
});

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

const isProduction = process.env.NODE_ENV === "production";

export default isProduction ? withPWA(nextConfig as any) : nextConfig;
