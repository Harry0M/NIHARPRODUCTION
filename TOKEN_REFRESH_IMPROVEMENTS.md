# Authentication Token Refresh Improvements

## Issues Fixed

### 1. **Missing TOKEN_REFRESHED Event Handling**
- **Problem**: The original implementation didn't handle `TOKEN_REFRESHED` events from Supabase
- **Solution**: Added proper event handling for `TOKEN_REFRESHED` in `onAuthStateChange`
- **Impact**: Users will now stay logged in when tokens are automatically refreshed

### 2. **Role Loading Dependency Issues**
- **Problem**: Silent failures when profiles table access failed due to RLS or network issues
- **Solution**: 
  - Added timeout handling (5-second timeout for database queries)
  - Implemented fallback to user metadata when profiles table fails
  - Added background synchronization between metadata and profiles table
  - Better error logging and graceful degradation

### 3. **Session State Synchronization Problems**
- **Problem**: Session and user state could become mismatched, especially during token refresh
- **Solution**: 
  - Centralized session state management
  - Proper event handling for all auth state changes
  - Consistent state updates across all auth events

### 4. **No Token Expiry Monitoring**
- **Problem**: No proactive monitoring of token expiry
- **Solution**: 
  - Added `isTokenExpired` state to track token expiry status
  - Implemented periodic token expiry checks (every minute)
  - Added `checkTokenExpiry` function that warns when token expires in <5 minutes
  - Added manual `refreshSession` function for proactive refresh

### 5. **Error Recovery Issues**
- **Problem**: Poor error handling when role loading or token refresh failed
- **Solution**: 
  - Comprehensive error handling with fallbacks
  - Graceful degradation when database queries fail
  - Automatic sign-out when token refresh fails completely

## New Features

### Enhanced AuthContext Interface
```typescript
interface AuthContextProps {
  session: Session | null;
  user: User | null;
  userRole: UserRole;
  permissions: UserPermissions;
  signOut: () => Promise<void>;
  loading: boolean;
  setUser: (user: User | null) => void;
  updateUserRole: (role: UserRole) => Promise<void>;
  refreshSession: () => Promise<void>;        // NEW
  isTokenExpired: boolean;                    // NEW
}
```

### Role Mapping System
- **Problem**: Frontend roles (`staff`, `printer`, `cutting`, `stitching`) don't match database enum (`admin`, `manager`, `production`, `vendor`)
- **Solution**: Implemented role mapping system that:
  - Maps `staff` → `manager` in database
  - Maps `printer`, `cutting`, `stitching` → `production` in database
  - Maintains full frontend role functionality
  - Syncs properly with database constraints

### Timeout Protection
- Database queries now have 5-second timeouts to prevent hanging
- Automatic fallback to metadata when database is unreachable
- Background sync attempts when possible

## Code Structure Improvements

### Separated useAuth Hook
- Moved `useAuth` to separate file (`src/hooks/useAuth.ts`)
- Fixed Fast Refresh warnings
- Updated all imports across the codebase

### Better Event Handling
```typescript
// Enhanced auth state change handling
supabase.auth.onAuthStateChange(async (event, currentSession) => {
  switch(event) {
    case 'SIGNED_OUT':
      // Clear all state and redirect
      break;
    case 'SIGNED_IN':
    case 'TOKEN_REFRESHED':
      // Update session, check expiry, load roles
      break;
  }
});
```

### Periodic Token Monitoring
```typescript
// Check token expiry every minute
const tokenCheckInterval = setInterval(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    checkTokenExpiry(session);
  });
}, 60000);
```

## Usage Examples

### Monitoring Token Expiry
```typescript
const { isTokenExpired, refreshSession } = useAuth();

// Show warning when token is about to expire
if (isTokenExpired) {
  return (
    <div className="token-warning">
      Your session will expire soon. 
      <button onClick={refreshSession}>Refresh Session</button>
    </div>
  );
}
```

### Proactive Token Refresh
```typescript
const { refreshSession } = useAuth();

// Refresh token before making important API calls
const handleImportantAction = async () => {
  try {
    await refreshSession();
    // Proceed with action using fresh token
    await performImportantAction();
  } catch (error) {
    // Handle refresh failure
  }
};
```

## Configuration Notes

### Supabase Configuration
Current token settings:
- `jwt_expiry = 3600` (1 hour)
- `enable_refresh_token_rotation = true`
- `refresh_token_reuse_interval = 10`

### Database Schema
The profiles table should have:
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  role user_role DEFAULT 'admin',
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

Where `user_role` enum includes: `'admin' | 'manager' | 'production' | 'vendor'`

## Testing Recommendations

1. **Token Expiry Testing**: Set shorter JWT expiry times in development
2. **Network Failure Testing**: Test with profiles table access disabled
3. **Role Synchronization Testing**: Verify metadata ↔ database sync works
4. **Refresh Testing**: Test manual and automatic token refresh scenarios

## Migration Notes

- All existing `useAuth` imports have been updated to use the new hook location
- The role mapping system maintains backward compatibility
- Existing user sessions will continue to work without interruption
- Database schema changes are not required for basic functionality
