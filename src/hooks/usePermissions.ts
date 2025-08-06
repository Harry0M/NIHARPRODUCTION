import { useAuth } from '@/hooks/useAuth';
import { UserPermissions } from '@/types/permissions';

export const usePermissions = () => {
  const { permissions, userRole } = useAuth();
  
  // Helper function to check if user has a specific permission
  const hasPermission = (permission: keyof UserPermissions): boolean => {
    return permissions[permission] === true;
  };

  // Helper function to check multiple permissions (all must be true)
  const hasAllPermissions = (permissionKeys: (keyof UserPermissions)[]): boolean => {
    return permissionKeys.every(key => permissions[key] === true);
  };

  // Helper function to check if user has any of the specified permissions
  const hasAnyPermission = (permissionKeys: (keyof UserPermissions)[]): boolean => {
    return permissionKeys.some(key => permissions[key] === true);
  };

  // Check if user is admin
  const isAdmin = (): boolean => {
    return userRole === 'admin';
  };

  // Check if user can access job cards (all roles can)
  const canAccessJobCards = (): boolean => {
    return hasPermission('canAccessJobCards');
  };

  // Check if user can access specific job types
  const canAccessPrintingJobs = (): boolean => {
    return hasPermission('canAccessPrintingJobs');
  };

  const canAccessCuttingJobs = (): boolean => {
    return hasPermission('canAccessCuttingJobs');
  };

  const canAccessStitchingJobs = (): boolean => {
    return hasPermission('canAccessStitchingJobs');
  };

  return {
    permissions,
    userRole,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    isAdmin,
    canAccessJobCards,
    canAccessPrintingJobs,
    canAccessCuttingJobs,
    canAccessStitchingJobs,
  };
};
