import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin"],
  // Image uploads (logo, banner, product photo) arrive as compressed data URLs.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
};

export default nextConfig;
