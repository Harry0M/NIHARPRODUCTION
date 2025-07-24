# User Permission System

This document describes the role-based permission system implemented in the application.

## Overview

The permission system provides role-based access control with four distinct user roles:
- **Admin**: Full access to all features
- **Printer**: Access to job cards and printing operations
- **Cutting**: Access to job cards and cutting operations  
- **Stitching**: Access to job cards and stitching operations

## Implementation

### Core Files

1. **`src/types/permissions.ts`** - Defines roles, permissions, and role mappings
2. **`src/context/AuthContext.tsx`** - Enhanced authentication context with role management
3. **`src/hooks/usePermissions.ts`** - Hook for permission checking
4. **`src/components/ProtectedRoute.tsx`** - Route-level permission protection
5. **`src/components/RoleBasedRoutes.tsx`** - Specialized route protection components
6. **`src/components/UserManagement.tsx`** - User management interface for admins

### User Roles

```typescript
type UserRole = 'admin' | 'printer' | 'cutting' | 'stitching';
```

### Permissions Matrix

| Permission | Admin | Printer | Cutting | Stitching |
|------------|-------|---------|---------|-----------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Orders | ✅ | ❌ | ❌ | ❌ |
| Inventory | ✅ | ❌ | ❌ | ❌ |
| Job Cards | ✅ | ✅ | ✅ | ✅ |
| Printing Jobs | ✅ | ✅ | ❌ | ❌ |
| Cutting Jobs | ✅ | ❌ | ✅ | ❌ |
| Stitching Jobs | ✅ | ❌ | ❌ | ✅ |
| Purchases | ✅ | ❌ | ❌ | ❌ |
| Partners | ✅ | ❌ | ❌ | ❌ |
| Analysis | ✅ | ❌ | ❌ | ❌ |
| Companies | ✅ | ❌ | ❌ | ❌ |
| Sells | ✅ | ❌ | ❌ | ❌ |
| Create Users | ✅ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ |

## Usage Examples

### Using Permission Hooks

```typescript
import { usePermissions } from '@/hooks/usePermissions';

const MyComponent = () => {
  const { hasPermission, isAdmin, canAccessJobCards } = usePermissions();

  if (!hasPermission('canAccessOrders')) {
    return <div>Access denied</div>;
  }

  return (
    <div>
      {isAdmin() && <AdminButton />}
      {canAccessJobCards() && <JobCardSection />}
    </div>
  );
};
```

### Protecting Routes

```typescript
import { PrintingJobRoute, AdminOnlyRoute } from '@/components/RoleBasedRoutes';

// Protect specific routes
<Route path="/printing-jobs" element={
  <PrintingJobRoute>
    <PrintingJobs />
  </PrintingJobRoute>
} />

// Admin-only routes
<Route path="/admin" element={
  <AdminOnlyRoute>
    <AdminPanel />
  </AdminOnlyRoute>
} />
```

### Custom Route Protection

```typescript
import ProtectedRoute from '@/components/ProtectedRoute';

// Single permission check
<ProtectedRoute requiredPermission="canAccessInventory">
  <InventoryPage />
</ProtectedRoute>

// Multiple permissions (all required)
<ProtectedRoute requiredPermissions={['canAccessJobCards', 'canAccessPrintingJobs']}>
  <PrintingJobsPage />
</ProtectedRoute>

// Multiple permissions (any one required)
<ProtectedRoute 
  requiredPermissions={['canAccessPrintingJobs', 'canAccessCuttingJobs']} 
  requireAny={true}
>
  <JobOperationsPage />
</ProtectedRoute>
```

## User Management

### Default Behavior
- **Existing users** are automatically assigned the `admin` role
- **Only admins** can create new users and assign roles
- **New users** receive role assignments during invitation

### Admin Functions

```typescript
import { useAuth } from '@/context/AuthContext';

const AdminComponent = () => {
  const { updateUserRole } = useAuth();

  const changeUserRole = async (newRole) => {
    try {
      await updateUserRole(newRole);
      // Role updated successfully
    } catch (error) {
      // Handle unauthorized or other errors
    }
  };
};
```

### User Invitation Process

1. Admin navigates to User Management
2. Enters email and selects role
3. System sends invitation with role metadata
4. New user signs up with pre-assigned role

## Role Storage

User roles are stored in:
- **Supabase user metadata**: `user.user_metadata.role`
- **Local state**: AuthContext manages current user role
- **Default fallback**: Existing users without role metadata default to 'admin'

## Security Considerations

1. **Server-side validation**: Always validate permissions on the backend
2. **Role persistence**: Roles are stored in user metadata and persist across sessions
3. **Admin protection**: Critical operations (user management) require admin role
4. **Graceful degradation**: Users without sufficient permissions see appropriate messages

## Migration Notes

For existing applications:
1. Existing users automatically get `admin` role
2. No database migration required
3. Permission checks can be gradually added to components
4. Routes remain accessible until protection is explicitly added

## Testing

```typescript
// Test permission checking
import { getPermissionsForRole } from '@/types/permissions';

const adminPermissions = getPermissionsForRole('admin');
const printerPermissions = getPermissionsForRole('printer');

expect(adminPermissions.canManageUsers).toBe(true);
expect(printerPermissions.canManageUsers).toBe(false);
expect(printerPermissions.canAccessJobCards).toBe(true);
```

## Troubleshooting

### Common Issues

1. **Permission denied errors**: Check if user has required role/permissions
2. **Role not updating**: Verify user metadata is properly set
3. **Route access issues**: Ensure ProtectedRoute components are properly configured
4. **Loading states**: AuthContext loading state should be checked before permission checks

### Debug Tools

```typescript
// Log current user permissions
const { permissions, userRole } = usePermissions();
console.log('Current role:', userRole);
console.log('Permissions:', permissions);
```
