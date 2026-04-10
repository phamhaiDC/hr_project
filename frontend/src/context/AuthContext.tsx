'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  getToken,
  setToken,
  removeToken,
  getStoredUser,
  setStoredUser,
} from '@/utils/token';
import { authService } from '@/services/auth.service';
import type { AuthUser, LoginResponse } from '@/types';

// в”Ђв”Ђв”Ђ Context shape в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// в”Ђв”Ђв”Ђ Provider в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // AbortController lets us cancel the in-flight /auth/profile request when
    // the 5-second timer fires OR when the component unmounts.  Without this,
    // a slow/expired-token response could arrive AFTER the user already logged
    // in with fresh credentials and wipe that new token via the 401 interceptor.
    const controller = new AbortController();
    let active = true;

    async function init() {
      const token = getToken();

      if (!token) {
        console.log('[auth] No stored token вЂ” showing login form');
        setLoading(false);
        return;
      }

      // Optimistically show stored user while verifying
      const stored = getStoredUser<AuthUser>();
      if (stored && active) {
        console.log('[auth] Stored user found:', stored.email);
        setUser(stored);
      }

      // Abort (cancel the HTTP request) after 5 s so a slow backend never
      // freezes the UI.  Crucially, aborting prevents the stale response from
      // ever reaching the axios interceptor.
      const timeoutId = setTimeout(() => {
        console.warn('[auth] Token verification timed out вЂ” keeping optimistic session');
        controller.abort();
      }, 5_000);

      try {
        console.log('[auth] Verifying token with /auth/profile...');
        const fresh = await authService.me(controller.signal);
        console.log('[auth] Token valid вЂ” user:', fresh.email, '| role:', fresh.role);
        if (active) {
          setStoredUser(fresh);
          setUser(fresh);
        }
      } catch (err) {
        // ERR_CANCELED = request was aborted (timeout or unmount).
        // This is NOT an auth failure вЂ” the token may still be valid on a slow
        // backend.  Keep the optimistic stored user so the user isn't
        // unnecessarily bounced to the login page.
        const isCancelled =
          (err as { code?: string }).code === 'ERR_CANCELED' ||
          (err as Error).name === 'CanceledError' ||
          (err as Error).name === 'AbortError';

        if (isCancelled) {
          console.warn('[auth] Verification cancelled вЂ” keeping stored session');
          // stored user is already set above; nothing more to do
        } else {
          console.warn('[auth] Token verification failed вЂ” clearing session:', (err as Error).message);
          removeToken();
          if (active) setUser(null);
        }
      } finally {
        clearTimeout(timeoutId);
        // Always clear loading regardless of `active`. React 18 silently ignores
        // setState on unmounted components, so this is safe. Without this,
        // StrictMode double-invoke causes the cleanup to set active=false before
        // the async init completes, leaving `loading` stuck at true.
        setLoading(false);
      }
    }

    init();

    return () => {
      active = false;
      controller.abort(); // cancel in-flight request on unmount (React StrictMode safe)
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResponse> => {
      console.log('[auth] login() called for:', email);
      const data = await authService.login(email, password);
      console.log('[auth] login() success вЂ” storing token and user');
      setToken(data.accessToken);
      setStoredUser(data.employee);
      setUser(data.employee);
      return data;
    },
    [],
  );

  const logout = useCallback(() => {
    console.log('[auth] logout()');
    removeToken();
    setUser(null);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// в”Ђв”Ђв”Ђ Hook в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

