import { AuthUser } from '@/services/authService';

export type AppRole = 'Admin' | 'Sales Manager' | 'Sales Executive';

export const normalizeRole = (role?: string): AppRole => {
  const value = String(role ?? '').toLowerCase().replace(/[_-]/g, ' ').trim();
  if (value === 'admin') return 'Admin';
  if (value === 'manager' || value === 'sales manager') return 'Sales Manager';
  return 'Sales Executive';
};

export const isAdmin = (user?: AuthUser | null) =>
  normalizeRole(user?.role) === 'Admin';

export const isManager = (user?: AuthUser | null) =>
  normalizeRole(user?.role) === 'Sales Manager';

export const canManageLeads = (user?: AuthUser | null) =>
  isAdmin(user) || isManager(user);

export const canManageSystem = (user?: AuthUser | null) => isAdmin(user);

export const canAccessPath = (user: AuthUser | null, path: string) => {
  if (!user) return false;
  if (path.startsWith('/users') || path.startsWith('/settings') || path.startsWith('/team')) {
    return canManageSystem(user);
  }
  if (path.startsWith('/reports')) {
    return isAdmin(user) || isManager(user);
  }
  return true;
};
