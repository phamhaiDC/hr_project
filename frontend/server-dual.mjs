/**
 * server-dual.mjs
 *
 * Starts a single Next.js instance that listens on BOTH:
 *  - HTTP:  3000 (standard, fast)
 *  - HTTPS: 3443 (secure, for geolocation/mobile)
 *
 * IMPORTANT: env vars MUST be set before Next.js is imported.
 * In ESM, static `import` statements are hoisted and run before any module
 * body code — so `process.env.X = '1'` after a static import is already too
 * late. We set env vars here first, then use dynamic import() for Next.js.
 */

// ── Must be set BEFORE next is loaded ───────────────────────────────────────
process.env.NEXT_TELEMETRY_DISABLED = '1';
// Force Webpack — Turbopack's Rust runtime requires the `popcnt` CPU
// instruction which is unavailable on older hardware (Windows Server 2012).
process.env.NEXT_FORCE_WEBPACK = '1';
process.env.TURBOPACK = '0';

// ── Now safe to load Next.js (dynamic import respects env vars set above) ───
const { default: next }                      = await import('next');
const { createServer: createHttpServer }     = await import('node:http');
const { createServer: createHttpsServer }    = await import('node:https');
const { readFileSync, existsSync }           = await import('node:fs');
const { parse }                              = await import('node:url');
const { resolve }                            = await import('node:path');

const dev        = process.env.NODE_ENV !== 'production';
const HTTP_PORT  = 3000;
const HTTPS_PORT = 3443;
const DOMAIN     = 'hr.dcorp.com.vn';

const app    = next({ dev, hostname: '0.0.0.0', port: HTTP_PORT });
const handle = app.getRequestHandler();

const CERT_DIR  = resolve('certificates');
const CERT_FILE = resolve(CERT_DIR, `${DOMAIN}.pem`);
const KEY_FILE  = resolve(CERT_DIR, `${DOMAIN}-key.pem`);

// ── HTTPS options ────────────────────────────────────────────────────────────
let httpsOptions = null;
if (existsSync(CERT_FILE) && existsSync(KEY_FILE)) {
  httpsOptions = {
    key:  readFileSync(KEY_FILE),
    cert: readFileSync(CERT_FILE),
  };
}

// ── Request handler (WHATWG URL to avoid url.parse deprecation) ──────────────
function handleRequest(req, res) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  handle(req, res, parsedUrl);
}

await app.prepare();

// ── 1. HTTP server (port 3000) ───────────────────────────────────────────────
createHttpServer(handleRequest).listen(HTTP_PORT, '0.0.0.0', () => {
  console.log(`\n  HTTP Dev:  http://localhost:${HTTP_PORT}`);
});

// ── 2. HTTPS server (port 3443) ──────────────────────────────────────────────
if (httpsOptions) {
  createHttpsServer(httpsOptions, handleRequest).listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log(`  HTTPS Dev: https://${DOMAIN}:${HTTPS_PORT}`);
    console.log(`             https://localhost:${HTTPS_PORT}\n`);
  });
} else {
  console.warn(`\n  HTTPS not started — certificates not found in ./certificates/`);
  console.warn(`  Run: npm run certs\n`);
}
