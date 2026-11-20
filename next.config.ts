import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin"],
  // Image uploads (logo, banner, product photo) arrive as compressed data URLs.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  // Firebase Auth's sign-in handler served from this domain (NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN), so the
  // Google popup/redirect shows jual.belidi.biz.id instead of web-store-dashboard.firebaseapp.com.
  async rewrites() {
    return [
      { source: "/__/auth/:path*", destination: "https://web-store-dashboard.firebaseapp.com/__/auth/:path*" },
      { source: "/__/firebase/:path*", destination: "https://web-store-dashboard.firebaseapp.com/__/firebase/:path*" },
    ];
  },
};

export default nextConfig;
