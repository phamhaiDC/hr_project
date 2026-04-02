import type { NextConfig } from 'next';
import * as os from 'os';

/**
 * Returns every non-loopback IPv4 address on this machine.
 * Used to populate allowedDevOrigins so the Next.js dev server accepts
 * requests from other devices on the same LAN.
 */
function getLanIPs(): string[] {
  const ips: string[] = [];
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const iface of ifaces ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) ips.push(iface.address);
    }
  }
  return ips;
}

const lanIPs = getLanIPs();

const nextConfig: NextConfig = {
  /**
   * Next.js 15+ rejects requests whose Host header doesn't match localhost
   * unless the origin is explicitly allowed here.  Without this, any device
   * on the LAN opening http://<machine-ip>:3000 gets "Invalid Host header".
   */
  allowedDevOrigins: lanIPs.flatMap((ip) => [
    `${ip}:3000`,  // with port
    ip,            // without port (some clients omit the default port)
  ]),

  /**
   * Proxy all /api/v1/* requests through Next.js to the NestJS backend.
   * BACKEND_INTERNAL_URL is server-side only — it always points to localhost
   * because the Next.js server and NestJS run on the same machine.
   * The browser never needs to know the backend port.
   */
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:3001';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
