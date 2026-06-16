import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8001";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/catalog/:path*",
        destination: `${BACKEND_URL}/catalog/:path*`,
      },
      {
        source: "/api/tile-processor/:path*",
        destination: `${BACKEND_URL}/tile-processor/:path*`,
      },
      {
        source: "/api/tile/:path*",
        destination: `${BACKEND_URL}/tile/:path*`,
      },
      {
        source: "/api/local/:path*",
        destination: `${BACKEND_URL}/api/local/:path*`,
      },
      {
        source: "/api/settings/:path*",
        destination: `${BACKEND_URL}/api/settings/:path*`,
      },
    ];
  },
};

export default nextConfig;
