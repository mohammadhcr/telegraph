import type { NextConfig } from "next";
import nextPWA from "next-pwa";

const withPWA = nextPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  sassOptions: {
    additionalData: ``,
  },

  images: {
    domains: [
      "img.clerk.com",
      "static-00.iconduck.com",
      "wckzanbwucgwxaywopxg.supabase.co",
    ],
  },
  ...withPWA,
};

export default nextConfig;
