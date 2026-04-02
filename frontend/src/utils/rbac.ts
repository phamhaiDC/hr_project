export type Role = 'admin' | 'hr' | 'manager' | 'employee';

/** Hierarchy rank — higher = more privileged */
const RANK: Record<Role, number> = {
  admin: 4,
  hr: 3,
  manager: 2,
  employee: 1,
};

/** True if the user's role is one of the provided roles */
export function hasRole(userRole: string | undefined, allowed: Role | Role[]): boolean {
  if (!userRole) return false;
  const list = Array.isArray(allowed) ? allowed : [allowed];
  return list.includes(userRole as Role);
}

/** True if the user's role is at least as privileged as minRole */
export function hasMinRole(userRole: string | undefined, minRole: Role): boolean {
  if (!userRole) return false;
  return (RANK[userRole as Role] ?? 0) >= RANK[minRole];
}

/** Shorthand helpers used across the app */
export const isAdminOrHR = (role?: string) => hasRole(role, ['admin', 'hr']);
export const isApprover  = (role?: string) => hasRole(role, ['admin', 'hr', 'manager']);
export const isAdmin     = (role?: string) => hasRole(role, 'admin');
