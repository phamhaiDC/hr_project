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

interface TopbarProps {
  title?: string;
  onMenuClick: () => void;
}

export function Topbar({ title, onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth();
  const role = user?.role as Role | undefined;

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 lg:h-16 lg:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors lg:hidden"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-gray-800 lg:text-lg">{title ?? 'HR System'}</h1>
      </div>

      {user && (
        <div className="flex items-center gap-2 lg:gap-3">
          {/* User info — desktop only */}
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-800 leading-tight">{user.fullName}</p>
            <p className="text-xs text-gray-400 leading-tight">{user.email}</p>
          </div>

          {/* Avatar */}
          <div className="relative">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white select-none lg:h-9 lg:w-9">
              {user.fullName?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-white lg:h-2.5 lg:w-2.5" />
          </div>

          {/* Role badge — desktop only */}
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
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors lg:h-auto lg:w-auto lg:gap-1.5 lg:px-3 lg:py-1.5 lg:text-sm"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden lg:inline">Sign out</span>
          </button>
        </div>
      )}
    </header>
  );
}
