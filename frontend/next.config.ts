import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/catalog/:path*",
        destination: "http://127.0.0.1:8001/catalog/:path*",
      },
      {
        source: "/api/tile-processor/:path*",
        destination: "http://127.0.0.1:8001/tile-processor/:path*",
      },
    ];
  },
};

export default nextConfig;
