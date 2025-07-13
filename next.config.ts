// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/python/:path*',
        destination: '/api/python/index.py',
      },
    ];
  },
};

export default nextConfig;