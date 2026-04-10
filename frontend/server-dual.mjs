/**
 * server-dual.mjs
 *
 * Dev server — listens on port 80 (HTTP) by default.
 * Nginx/Cloudflare is not used in dev; the app is accessed directly.
 *
 * Port 80 requires elevated privileges on Linux/Mac:
 *   sudo node server-dual.mjs
 * On Windows Server, no elevation is needed for port 80.
 *
 * Override port via env: PORT=8080 npm run dev
 *
 * CRITICAL — env vars must be set before `next` is imported.
 * ESM static imports are hoisted and execute before the module body,
 * so we set all env vars first, then load everything via dynamic import().
 */

// ── 1. Disable Turbopack before Next.js loads ────────────────────────────────
// Turbopack's Rust runtime requires the `popcnt` CPU instruction — unavailable
// on Windows Server 2012 → worker thread panics → ERR_EMPTY_RESPONSE.
// ALL three env vars are needed; Next.js 16 checks different ones in different paths.
process.env.NEXT_TELEMETRY_DISABLED  = '1';
process.env.NEXT_FORCE_WEBPACK       = '1';
process.env.TURBOPACK                = '0';
process.env.__NEXT_TEST_WITH_DEVTOOL = '0';

// ── 2. Dynamic imports (respect env vars set above) ──────────────────────────
const { default: next }                  = await import('next');
const { createServer: createHttpServer } = await import('node:http');

// ── 3. Config ─────────────────────────────────────────────────────────────────
const dev       = process.env.NODE_ENV !== 'production';
const HTTP_PORT = parseInt(process.env.PORT ?? '3000', 10);

// ── 4. Next.js app ────────────────────────────────────────────────────────────
const app = next({
  dev,
  hostname: '0.0.0.0',
  port: HTTP_PORT,
  customServer: true,
  // turbopack: false is the official Next.js 16 API to disable Turbopack
  // in custom server mode. Combined with env vars above, this is the most
  // reliable way to force Webpack on older CPUs that lack `popcnt`.
  turbopack: false,
});

const handle = app.getRequestHandler();

// ── 5. TLS ───────────────────────────────────────────────────────────────────
// HTTPS is handled entirely by Nginx + Cloudflare.
// Node.js runs plain HTTP only — no certs needed here.

// ── 6. Request handler ────────────────────────────────────────────────────────
function handleRequest(req, res) {
  // next.js getRequestHandler() is async — we must catch both sync throws
  // and async rejections, otherwise the socket is left open with no response.
  try {
    Promise.resolve(handle(req, res)).catch((err) => {
      console.error('[server] Async handler error:', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
      }
      if (!res.writableEnded) res.end('Internal Server Error');
    });
  } catch (err) {
    console.error('[server] Sync handler error:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
    }
    if (!res.writableEnded) res.end('Internal Server Error');
  }
}

// ── 7. Prepare Next.js ────────────────────────────────────────────────────────
console.log('\n  Preparing Next.js (Webpack mode)…');
await app.prepare();
console.log('  Next.js ready.\n');

// ── 8. HTTP server ────────────────────────────────────────────────────────────
const httpServer = createHttpServer(handleRequest);
httpServer.on('error', (err) => {
  if (err.code === 'EACCES') {
    console.error(`\n  [error] Port ${HTTP_PORT} requires elevated privileges.`);
    console.error(`  Mac/Linux: sudo npm run dev`);
    console.error(`  Or use a higher port: PORT=8080 npm run dev\n`);
  } else {
    console.error('[HTTP server error]', err);
  }
  process.exit(1);
});
httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
  const portSuffix = HTTP_PORT === 80 ? '' : `:${HTTP_PORT}`;
  console.log(`  Ready: http://localhost${portSuffix}`);
});

// HTTPS is terminated by Nginx + Cloudflare — no HTTPS server here.
