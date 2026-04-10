/**
 * server-prod.mjs
 *
 * Production HTTP server — listens on 127.0.0.1:3000 only.
 * Nginx sits in front and handles:
 *   - Port 80  (HTTP → redirect to HTTPS)
 *   - Port 443 (HTTPS via Cloudflare origin cert or Let's Encrypt)
 *   - Reverse proxy to this process
 *
 * Start: npm run start   (after npm run build)
 * ENV:   PORT (default 3000)  HOSTNAME (default 127.0.0.1)
 */

process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NEXT_FORCE_WEBPACK = '1';
process.env.NODE_ENV = 'production';

const { default: next }                  = await import('next');
const { createServer: createHttpServer } = await import('node:http');

const PORT     = parseInt(process.env.PORT ?? '3000', 10);
const HOSTNAME = process.env.HOSTNAME ?? '127.0.0.1'; // localhost-only; Nginx proxies in

const app    = next({ dev: false, hostname: HOSTNAME, port: PORT });
const handle = app.getRequestHandler();

function handleRequest(req, res) {
  try {
    Promise.resolve(handle(req, res)).catch((err) => {
      console.error('[prod] request error:', err);
      if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain' });
      if (!res.writableEnded) res.end('Internal Server Error');
    });
  } catch (err) {
    console.error('[prod] sync error:', err);
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain' });
    if (!res.writableEnded) res.end('Internal Server Error');
  }
}

console.log('\n  Building Next.js production server…');
await app.prepare();

const server = createHttpServer(handleRequest);
server.on('error', (err) => console.error('[prod] server error:', err));

server.listen(PORT, HOSTNAME, () => {
  console.log(`\n  Production server ready`);
  console.log(`  Internal: http://${HOSTNAME}:${PORT}`);
  console.log(`  Public:   https://hr.dcorp.com.vn  (via Nginx + Cloudflare)\n`);
});
