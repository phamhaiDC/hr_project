/**
 * Catch-all API proxy route: forwards /api/v1/* → NestJS backend.
 *
 * Why this exists:
 *   Turbopack's dev server does not reliably forward query-string params through
 *   next.config.ts rewrites(). This explicit route handler runs on the Next.js
 *   Node.js layer and explicitly preserves the full query string.
 *
 * Filesystem routes have higher priority than afterFiles rewrites, so this
 * handler intercepts all /api/v1/* requests before the rewrite is checked.
 */

import { type NextRequest, NextResponse } from 'next/server';

// Force Node.js runtime so Buffer, process.env, etc. are all available.
export const runtime = 'nodejs';

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:3001';

// Headers to copy from the browser request to the upstream request.
const PASS_HEADERS = ['authorization', 'content-type', 'accept', 'cookie'];

async function proxy(req: NextRequest, pathSegments: string[]): Promise<NextResponse> {
  const path = pathSegments.join('/');

  // Use the raw req.url to extract the search string so nothing is lost or
  // re-encoded by Next.js's URL normalisation in req.nextUrl.
  const { search } = new URL(req.url);
  const target = `${BACKEND}/api/v1/${path}${search}`;

  if (process.env.NODE_ENV === 'development') {
    const host = req.headers.get('host') ?? 'unknown';
    console.log(`[proxy] ${req.method} ${target}  (host: ${host})`);
  }

  const headers = new Headers();
  for (const key of PASS_HEADERS) {
    const val = req.headers.get(key);
    if (val) headers.set(key, val);
  }

  try {
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(req.method);
    const body = hasBody ? await req.arrayBuffer() : undefined;

    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body: body ? new Uint8Array(body) : undefined,
      // Never let Next.js cache proxy responses.
      cache: 'no-store',
    });

    const responseBody = await upstream.arrayBuffer();
    const ct = upstream.headers.get('content-type') ?? 'application/json';

    return new NextResponse(responseBody, {
      status: upstream.status,
      headers: { 'content-type': ct },
    });
  } catch (err) {
    console.error('[proxy] Backend unreachable:', target, err);
    return NextResponse.json(
      { statusCode: 502, message: 'Backend unavailable' },
      { status: 502 },
    );
  }
}

// In Next.js 15+, dynamic route params are wrapped in a Promise.
type Ctx = { params: Promise<{ path: string[] }> };

async function handle(req: NextRequest, ctx: Ctx): Promise<NextResponse> {
  try {
    const { path } = await ctx.params;
    return await proxy(req, path);
  } catch (err) {
    console.error('[proxy] Handler error:', err);
    return NextResponse.json(
      { statusCode: 502, message: 'Backend unavailable' },
      { status: 502 },
    );
  }
}

export const GET    = (req: NextRequest, ctx: Ctx) => handle(req, ctx);
export const POST   = (req: NextRequest, ctx: Ctx) => handle(req, ctx);
export const PUT    = (req: NextRequest, ctx: Ctx) => handle(req, ctx);
export const PATCH  = (req: NextRequest, ctx: Ctx) => handle(req, ctx);
export const DELETE = (req: NextRequest, ctx: Ctx) => handle(req, ctx);
