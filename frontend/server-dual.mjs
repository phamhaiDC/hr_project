/**
 * server-dual.mjs
 *
 * Starts a single Next.js instance on:
 *  - HTTP:  3000
 *  - HTTPS: 3443
 *
 * CRITICAL — env vars must be set before `next` is imported.
 * ESM static imports are hoisted and execute before the module body,
 * so we set all env vars first, then load everything via dynamic import().
 */

// ── 1. Force Webpack before anything loads ───────────────────────────────────
// Turbopack's Rust runtime requires the `popcnt` CPU instruction which is
// absent on Windows Server 2012 hardware → thread panics → ERR_EMPTY_RESPONSE.
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NEXT_FORCE_WEBPACK      = '1';   // Next.js ≤15
process.env.__NEXT_TEST_WITH_DEVTOOL = '0';

// ── 2. Dynamic imports (respect env vars set above) ──────────────────────────
const { default: next }                   = await import('next');
const { createServer: createHttpServer }  = await import('node:http');
const { createServer: createHttpsServer } = await import('node:https');
const { readFileSync, existsSync }        = await import('node:fs');
const { resolve }                         = await import('node:path');

// ── 3. Config ─────────────────────────────────────────────────────────────────
const dev        = process.env.NODE_ENV !== 'production';
const HTTP_PORT  = 3000;
const HTTPS_PORT = 3443;
const DOMAIN     = 'hr.dcorp.com.vn';

// ── 4. Next.js app ────────────────────────────────────────────────────────────
const app = next({
  dev,
  hostname: '0.0.0.0',
  port: HTTP_PORT,
  // customServer signals to Next.js that we are managing the HTTP layer.
  // Without this flag Next.js 16 may start its own server and conflict.
  customServer: true,
  // Pass an explicit conf to suppress Turbopack at the framework level.
  // This is the most reliable knob available in Next.js 16 custom-server mode.
  conf: {
    // Keep webpack passthrough so existing next.config.ts `webpack:` key still runs.
    webpack: (config) => config,
  },
});

const handle = app.getRequestHandler();

// ── 5. TLS certs ──────────────────────────────────────────────────────────────
const CERT_DIR  = resolve('certificates');
const CERT_FILE = resolve(CERT_DIR, `${DOMAIN}.pem`);
const KEY_FILE  = resolve(CERT_DIR, `${DOMAIN}-key.pem`);

let httpsOptions = null;
if (existsSync(CERT_FILE) && existsSync(KEY_FILE)) {
  httpsOptions = {
    key:  readFileSync(KEY_FILE),
    cert: readFileSync(CERT_FILE),
  };
} else {
  console.warn(`\n  HTTPS not started — certs missing in ./certificates/`);
  console.warn(`  Expected:\n    ${CERT_FILE}\n    ${KEY_FILE}\n`);
}

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
httpServer.on('error', (err) => console.error('[HTTP server error]', err));
httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
  console.log(`  HTTP:  http://localhost:${HTTP_PORT}`);
  console.log(`         http://${DOMAIN}:${HTTP_PORT}`);
});

// ── 9. HTTPS server ───────────────────────────────────────────────────────────
if (httpsOptions) {
  const httpsServer = createHttpsServer(httpsOptions, handleRequest);
  httpsServer.on('error',   (err) => console.error('[HTTPS server error]', err));
  httpsServer.on('tlsClientError', (err) => console.warn('[TLS client error]', err.message));
  httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log(`  HTTPS: https://localhost:${HTTPS_PORT}`);
    console.log(`         https://${DOMAIN}:${HTTPS_PORT}\n`);
  });
}
