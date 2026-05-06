import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://13.212.10.167/api/:path*', // Proxy ngầm gọi sang EC2
      },
    ];
  },
};

export default nextConfig;