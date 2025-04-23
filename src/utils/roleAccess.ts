
import { User } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'production' | 'manager' | 'vendor';

export interface ExtendedUser extends Omit<User, 'role'> {
  role: UserRole;
}

export const ROLE_PERMISSIONS = {
  admin: ['orders', 'production', 'vendors', 'suppliers', 'inventory', 'settings'],
  manager: ['orders', 'production', 'inventory'],
  production: ['production'],
  vendor: ['production']
} as const;

export const hasPermission = (role: UserRole, feature: string): boolean => {
  if (role === 'admin') return true;
  // Fix the type issue by safely casting the feature to a compatible type
  // when checking if it exists in the ROLE_PERMISSIONS array
  return ROLE_PERMISSIONS[role]?.includes(feature as any) ?? false;
};
