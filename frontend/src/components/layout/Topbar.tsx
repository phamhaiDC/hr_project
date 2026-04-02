'use client';

import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/cn';
import type { Role } from '@/utils/rbac';

const ROLE_BADGE: Record<Role, string> = {
  admin:    'bg-purple-100 text-purple-700',
  hr:       'bg-blue-100 text-blue-700',
  manager:  'bg-indigo-100 text-indigo-700',
  employee: 'bg-gray-100 text-gray-600',
};

export function Topbar({ title }: { title?: string }) {
  const { user, logout } = useAuth();
  const role = user?.role as Role | undefined;

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-lg font-semibold text-gray-800">{title ?? 'HR System'}</h1>

      {user && (
        <div className="flex items-center gap-3">
          {/* User info */}
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-800 leading-tight">{user.fullName}</p>
            <p className="text-xs text-gray-400 leading-tight">{user.email}</p>
          </div>

          {/* Avatar */}
          <div className="relative">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white select-none">
              {user.fullName?.charAt(0).toUpperCase() ?? '?'}
            </div>
            {/* Online dot */}
            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
          </div>

          {/* Role badge */}
          {role && (
            <span className={cn(
              'hidden sm:inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              ROLE_BADGE[role],
            )}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </span>
          )}

          {/* Logout */}
          <button
            onClick={logout}
            title="Sign out"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      )}
    </header>
  );
}
