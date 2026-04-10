import type { NextConfig } from 'next';
import * as os from 'os';

function getLanIPs(): string[] {
  const ips: string[] = [];
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const iface of ifaces ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

const nextConfig: NextConfig = {
  webpack: (config) => config,

  allowedDevOrigins: [
    ...getLanIPs(),
    'hr.dcorp.com.vn',
    'https://hr.dcorp.com.vn',
    'http://hr.dcorp.com.vn',
  ],

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
