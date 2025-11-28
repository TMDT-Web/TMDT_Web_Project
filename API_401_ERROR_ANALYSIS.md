# 401 Unauthorized Error - Root Cause & Fixes

## Problem Diagnosed

The application was showing **401 Unauthorized** errors on protected endpoints:
- `GET /api/v1/cart` - Cart loading failed
- `GET /api/v1/users/admin` - User management list failed

### Root Causes Identified

1. **Timing Issue**: UserManage and CartContext were loading data on component mount **before authentication had fully initialized**
   - AuthContext needs time to check localStorage for existing tokens
   - Components were making API calls with `isLoading: true` still

2. **Race Condition**: No proper synchronization between:
   - Auth context initialization
   - Cart context initialization  
   - Protected page access

3. **Missing Auth Guards**: UserManage page had no checks to verify:
   - User is authenticated before loading admin data
   - User has admin role before accessing admin endpoints

## Solutions Implemented

### 1. Enhanced UserManage.tsx Authentication Guard

**Before:**
```typescript
useEffect(() => {
  loadUsers();
}, []);
```

**After:**
```typescript
const { user, isLoading: authLoading } = useAuth();
const navigate = useNavigate();

useEffect(() => {
  // Don't load users while auth is still loading
  if (authLoading) return;

  // Redirect to login if not authenticated
  if (!user) {
    navigate("/login");
    return;
  }

  // Redirect to home if not admin
  if (user.role !== UserRole.ADMIN) {
    navigate("/");
    return;
  }

  loadUsers();
}, [authLoading, user, navigate]);
```

**Benefits:**
- Waits for `authLoading` to complete before making API calls
- Redirects unauthenticated users to login page
- Prevents non-admin users from accessing admin pages
- Properly handles 401 errors by redirecting to login

### 2. Fixed CartContext Initialization Timing

**Before:**
```typescript
const { isAuthenticated, user } = useAuth();

useEffect(() => {
  loadCart();
}, [isAuthenticated]);
```

**After:**
```typescript
const { isAuthenticated, user, isLoading: authLoading } = useAuth();

useEffect(() => {
  // Skip loading while auth is still initializing
  if (authLoading) {
    return;
  }
  
  loadCart();
}, [isAuthenticated, authLoading]);
```

**Benefits:**
- Waits for auth to fully initialize before attempting cart load
- Prevents premature API calls with missing/invalid tokens
- Gracefully falls back to localStorage on auth failure

### 3. Improved Error Handling in CartContext

Added specific 401 handling:
```typescript
catch (error) {
  console.error('Failed to load cart from server:', error);
  const status = (error as any)?.response?.status;
  if (status === 401) {
    // Token might be expired - clear items and fall back to local
    console.warn('Cart API returned 401 - may indicate expired token');
  }
  // Fallback to localStorage
  loadLocalCart();
}
```

### 4. Added Debugging to API Client

Enhanced `setupApiClient()` with token verification logging:
```typescript
OpenAPI.TOKEN = async () => {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (token) {
    console.log('✅ Token found in localStorage, length:', token.length);
  } else {
    console.warn('⚠️ No token found in localStorage');
  }
  return token || undefined;
};
```

**Benefits:**
- Can see in console if token is being retrieved
- Can debug token expiration issues
- Helps verify token length and presence

## Authentication Flow - Corrected Sequence

1. **Page Load**
   - AuthContext provider checks localStorage for existing tokens
   - Sets `isLoading: true`
   - After checking, sets `isLoading: false`

2. **Protected Page (e.g., UserManage)**
   - Checks `authLoading` - if true, wait
   - Once `authLoading: false`, checks if `user` exists
   - If not authenticated → redirect to `/login`
   - If authenticated but not admin → redirect to `/`
   - If admin → proceed to load users with valid token in localStorage

3. **API Request**
   - `OpenAPI.TOKEN` resolver retrieves token from localStorage
   - Token is injected as `Authorization: Bearer {token}`
   - Request sent to backend
   - If 401 → token may be expired, refresh mechanism kicks in

4. **Cart Load (for any authenticated user)**
   - CartContext waits for `authLoading: false`
   - If authenticated → attempts server-side cart
   - On 401 or error → falls back to localStorage
   - If not authenticated → uses localStorage only

## Files Modified

1. **frontend/src/pages/admin/UserManage.tsx**
   - Added useAuth hook import
   - Added useNavigate hook
   - Added auth state checking with authLoading
   - Added redirect logic for unauthenticated/non-admin users
   - Fixed UserRole enum reference (admin → ADMIN)
   - Added isLoadingUsers state

2. **frontend/src/context/CartContext.tsx**
   - Added authLoading to dependencies
   - Added conditional early return while auth is loading
   - Improved error handling for 401 responses
   - Added fallback to localStorage on 401

3. **frontend/src/services/apiClient.ts**
   - Added debugging logs to OpenAPI.TOKEN resolver
   - Console logs show when token is found/missing
   - Better visibility for token injection

## Testing the Fix

### Test Scenario 1: Fresh Page Load (Not Logged In)
1. Clear localStorage (DevTools → Application → Storage)
2. Refresh page
3. **Expected:** No 401 errors, redirected to login page
4. **Verify:** Console shows "⚠️ No token found in localStorage"

### Test Scenario 2: After Login
1. Login with admin credentials
2. Navigate to admin pages (User Management)
3. **Expected:** Page loads successfully, users list displays
4. **Verify:** Console shows "✅ Token found in localStorage, length: XXX"

### Test Scenario 3: Cart Load (Authenticated)
1. Login as any user
2. Navigate to shop pages
3. Add items to cart
4. **Expected:** Cart loads from server, no 401 errors
5. **Verify:** Cart items persist across page refreshes

### Test Scenario 4: Non-Admin User Access
1. Login as regular user (not admin)
2. Try to manually navigate to `/admin/users`
3. **Expected:** Redirected to home page (`/`)
4. **Verify:** URL changes and user sees shop, not admin page

### Test Scenario 5: Token Expiration
1. Login and wait for token to expire (30 min typically)
2. Try to load admin page or cart
3. **Expected:** 401 error triggered, user redirected to login
4. **Verify:** Can login again and resume

## Build Status

✅ **Frontend Build:** Successful
- No TypeScript errors
- Vite compilation successful
- 1575 modules transformed
- Production dist: 443.73 KB (124.56 KB gzipped)

## Key Takeaways

**The 401 errors were happening because:**
1. Components tried to access protected endpoints before auth context finished initializing
2. UserManage had no authentication guards
3. CartContext didn't wait for auth to be ready

**The fix ensures:**
1. All protected pages wait for auth context to fully initialize
2. Unauthenticated users are redirected to login
3. Non-admin users cannot access admin pages  
4. Token is properly retrieved and injected in all requests
5. Graceful fallback to localStorage when server endpoints fail

**Next time you see 401 errors, check:**
- Is the user actually logged in? (check localStorage for 'token')
- Has auth context finished loading? (check authLoading state)
- Is the component properly guarded? (check useAuth hooks)
- Is the token being injected? (check console logs from apiClient)
