import api from '@/lib/axios';
import { getStoredUser, removeToken } from '@/utils/token';
import type { AuthUser, LoginResponse } from '@/types';

export const authService = {
  /** POST /auth/login → returns { accessToken, employee } */
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data),

  /** GET /auth/profile → returns current employee from the server */
  me: (signal?: AbortSignal) =>
    api.get<AuthUser>('/auth/profile', { signal }).then((r) => r.data),

  /** Returns the cached user from localStorage (synchronous, no network call) */
  getCurrentUser: (): AuthUser | null =>
    getStoredUser<AuthUser>(),

  /** Clears all auth state and redirects to /login */
  logout: (): void => {
    removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
};
