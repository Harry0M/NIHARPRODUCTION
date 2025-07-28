export type UserRole = 'admin' | 'staff' | 'printer' | 'cutting' | 'stitching';

export interface UserPermissions {
  canAccessDashboard: boolean;
  canAccessOrders: boolean;
  canAccessInventory: boolean;
  canAccessJobCards: boolean;
  canAccessPrintingJobs: boolean;
  canAccessCuttingJobs: boolean;
  canAccessStitchingJobs: boolean;
  canAccessPurchases: boolean;
  canAccessPartners: boolean;
  canAccessAnalysis: boolean;
  canAccessCompanies: boolean;
  canAccessSells: boolean;
  canCreateUsers: boolean;
  canManageUsers: boolean;
}

export const getPermissionsForRole = (role: UserRole): UserPermissions => {
  switch (role) {
    case 'admin':
      return {
        canAccessDashboard: true,
        canAccessOrders: true,
        canAccessInventory: true,
        canAccessJobCards: true,
        canAccessPrintingJobs: true,
        canAccessCuttingJobs: true,
        canAccessStitchingJobs: true,
        canAccessPurchases: true,
        canAccessPartners: true,
        canAccessAnalysis: true,
        canAccessCompanies: true,
        canAccessSells: true,
        canCreateUsers: true,
        canManageUsers: true,
      };
    case 'staff':
      return {
        canAccessDashboard: true,
        canAccessOrders: true,
        canAccessInventory: true,
        canAccessJobCards: true,
        canAccessPrintingJobs: true,
        canAccessCuttingJobs: true,
        canAccessStitchingJobs: true,
        canAccessPurchases: true,
        canAccessPartners: true,
        canAccessAnalysis: false,
        canAccessCompanies: true,
        canAccessSells: true,
        canCreateUsers: false,
        canManageUsers: false,
      };
    case 'printer':
      return {
        canAccessDashboard: false,
        canAccessOrders: false,
        canAccessInventory: false,
        canAccessJobCards: true,
        canAccessPrintingJobs: true,
        canAccessCuttingJobs: false,
        canAccessStitchingJobs: false,
        canAccessPurchases: false,
        canAccessPartners: false,
        canAccessAnalysis: false,
        canAccessCompanies: false,
        canAccessSells: false,
        canCreateUsers: false,
        canManageUsers: false,
      };
    case 'cutting':
      return {
        canAccessDashboard: false,
        canAccessOrders: false,
        canAccessInventory: false,
        canAccessJobCards: true,
        canAccessPrintingJobs: false,
        canAccessCuttingJobs: true,
        canAccessStitchingJobs: false,
        canAccessPurchases: false,
        canAccessPartners: false,
        canAccessAnalysis: false,
        canAccessCompanies: false,
        canAccessSells: false,
        canCreateUsers: false,
        canManageUsers: false,
      };
    case 'stitching':
      return {
        canAccessDashboard: false,
        canAccessOrders: false,
        canAccessInventory: false,
        canAccessJobCards: true,
        canAccessPrintingJobs: false,
        canAccessCuttingJobs: false,
        canAccessStitchingJobs: true,
        canAccessPurchases: false,
        canAccessPartners: false,
        canAccessAnalysis: false,
        canAccessCompanies: false,
        canAccessSells: false,
        canCreateUsers: false,
        canManageUsers: false,
      };
    default:
      return {
        canAccessDashboard: false,
        canAccessOrders: false,
        canAccessInventory: false,
        canAccessJobCards: false,
        canAccessPrintingJobs: false,
        canAccessCuttingJobs: false,
        canAccessStitchingJobs: false,
        canAccessPurchases: false,
        canAccessPartners: false,
        canAccessAnalysis: false,
        canAccessCompanies: false,
        canAccessSells: false,
        canCreateUsers: false,
        canManageUsers: false,
      };
  }
};

export const roleLabels: Record<UserRole, string> = {
  admin: 'Administrator',
  staff: 'Staff Member',
  printer: 'Printer Operator',
  cutting: 'Cutting Operator',
  stitching: 'Stitching Operator',
};
