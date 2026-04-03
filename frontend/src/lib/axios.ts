import axios from 'axios';
import { getToken, removeToken } from '@/utils/token';

// NEXT_PUBLIC_API_URL must include the global prefix, e.g. http://localhost:3001/api/v1
// ⚠️  NEXT_PUBLIC_* vars are BAKED AT STARTUP — restart the dev server after any .env.local change.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

if (process.env.NODE_ENV === 'development') {
  console.debug('[axios] baseURL =', BASE_URL);
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ── Request: attach JWT ───────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  if (process.env.NODE_ENV === 'development') {
    const fullUrl = `${config.baseURL ?? BASE_URL}${config.url}`;
    console.debug(`[api →] ${config.method?.toUpperCase()} ${fullUrl}`, config.params ?? '');
  }

  return config;
});

// ── Response: log errors + handle 401 ────────────────────────────────────────
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      const fullUrl = `${response.config.baseURL ?? BASE_URL}${response.config.url}`;
      console.debug(`[api ←] ${response.status} ${fullUrl}`);
    }
    return response;
  },
  (error) => {
    // Requests cancelled by AbortController (e.g. auth-verification timeout or
    // component unmount) should be silently ignored — they are not real errors.
    if (error.code === 'ERR_CANCELED') {
      return Promise.reject(error);
    }

    if (process.env.NODE_ENV === 'development') {
      // Always show the FULL url so port/prefix issues are immediately visible
      const fullUrl = `${error.config?.baseURL ?? BASE_URL}${error.config?.url ?? ''}`;
      const status = error.response?.status;
      const label = `[api ✗] ${error.config?.method?.toUpperCase()} ${fullUrl} → ${status ?? 'NO_RESPONSE'}`;
      const detail = error.response?.data?.message ?? error.message;
      // 4xx = client/auth errors, expected in normal app flow — use warn to
      // avoid triggering the Next.js 16 dev overlay (which fires on console.error)
      if (status !== undefined && status < 500) {
        console.warn(label, detail);
      } else {
        console.error(label, detail);
      }
    }

    if (error.response?.status === 401) {
      removeToken();
      // Avoid a hard reload / form-wipe when already on the login page
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export default api;
