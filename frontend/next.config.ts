import type { NextConfig } from 'next';
import * as os from 'os';

/**
 * Collect all non-loopback IPv4 addresses on this machine.
 * Used to whitelist LAN access for Next.js dev HMR websocket.
 */
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
  /**
   * Force Webpack — Turbopack requires the `popcnt` CPU instruction which is
   * unavailable on older server hardware (e.g. Windows Server 2012).
   */
  webpack: (config) => config,

  /**
   * Allow HMR websocket connections from LAN IPs.
   * Without this, Next.js blocks /_next/webpack-hmr from non-localhost origins,
   * causing the browser to hang for ~30s waiting for the connection to time out.
   */
  allowedDevOrigins: [
    ...getLanIPs(),
    'hr.dcorp.com.vn',
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
