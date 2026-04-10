import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * Force Webpack — Turbopack requires the `popcnt` CPU instruction which is
   * unavailable on older server hardware (e.g. Windows Server 2012).
   */
  webpack: (config) => config,

  /**
   * Security headers — Nginx adds HSTS/TLS headers; Next.js adds app-level ones.
   */
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json' },
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
      {
        source: '/icons/:file*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, immutable' },
        ],
      },
    ];
  },

  /**
   * Proxy /api/v1/* → NestJS backend.
   * Set BACKEND_INTERNAL_URL in .env.production (e.g. http://127.0.0.1:3001).
   */
  async rewrites() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL ?? 'http://127.0.0.1:3001';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
