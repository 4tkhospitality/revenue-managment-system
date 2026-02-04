# SPEC-V01: Auth & Onboarding Multi-Tenant

**Version:** 1.0.0  
**Created:** 2026-02-04  
**Status:** 📋 Approved by PO  
**Priority:** 🔴 HIGH (Security)

---

## 1. Overview

### Requirements Summary
- **Authentication:** Google OAuth only (no email/password)
- **Auto-create User:** First login creates user automatically
- **Multi-tenant:** User chỉ thấy data thuộc hotel được assign
- **Onboarding Guard:** Bắt buộc tạo hotel nếu chưa có

---

## 2. Authentication Flow

### 2.1. Login Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ Login Page  │────▶│ Google OAuth │────▶│ Auth Check  │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                    ┌───────────────────────────┼───────────────────────────┐
                    │                           │                           │
                    ▼                           ▼                           ▼
            ┌───────────────┐         ┌─────────────────┐         ┌─────────────────┐
            │ New User      │         │ Existing User   │         │ Blocked User    │
            │ (is_active=T) │         │ (is_active=T)   │         │ (is_active=F)   │
            └───────┬───────┘         └────────┬────────┘         └────────┬────────┘
                    │                          │                           │
                    ▼                          ▼                           ▼
            ┌───────────────┐         ┌─────────────────┐         ┌─────────────────┐
            │ /onboarding   │         │ Has hotel?      │         │ /blocked        │
            └───────────────┘         └────────┬────────┘         │ "Account blocked"│
                                               │                  └─────────────────┘
                              ┌────────────────┼────────────────┐
                              │ YES                            │ NO
                              ▼                                ▼
                      ┌───────────────┐               ┌─────────────────┐
                      │ /dashboard    │               │ /no-hotel-access │
                      └───────────────┘               │ Contact admin    │
                                                      └─────────────────┘
```

### 2.2. User Auto-Creation Rules

| Condition | Action |
|-----------|--------|
| First login (no User record) | Create User with `is_active: true`, `role: viewer` |
| Email = ADMIN_EMAIL env | Set `role: super_admin` |
| Existing user, active | Allow login, refresh token |
| Existing user, blocked | Redirect to /blocked |

---

## 3. Onboarding Guard

### 3.1. Trigger Conditions

```typescript
// Onboarding required when:
const needsOnboarding = 
  user.hotel_users.length === 0 &&  // No hotel assigned
  user.role !== 'super_admin';       // Super admin can access without hotel
```

### 3.2. Protected Routes

| Route Pattern | Onboarding Check |
|---------------|------------------|
| `/dashboard` | ✅ Required |
| `/data` | ✅ Required |
| `/upload` | ✅ Required |
| `/settings` | ✅ Required |
| `/onboarding` | ❌ Skip (this is the onboarding page) |
| `/admin/*` | 👤 Super admin only |
| `/auth/*` | ❌ Skip |
| `/blocked` | ❌ Skip |
| `/no-hotel-access` | ❌ Skip |

### 3.3. Onboarding Flow

```
/onboarding
    │
    ├── Step 1: Hotel Information (REQUIRED)
    │   ├── Hotel Name *
    │   ├── Total Rooms *
    │   └── (other fields optional - can edit in /settings)
    │
    ├── Step 2: [FUTURE] First Data Import
    │   └── (V01: Skip this step)
    │
    └── Complete → Redirect to /dashboard
```

---

## 4. Multi-Tenant Data Isolation

### 4.1. Data Access Rules

```typescript
// ALL data queries MUST include hotelId filter:
const data = await prisma.dailyOTB.findMany({
  where: {
    hotel_id: activeHotelId  // From session/cookie
  }
});
```

### 4.2. Active Hotel Context

```typescript
// Active hotel determined by priority:
// 1. Cookie: 'active_hotel_id' (user switched)
// 2. First hotel in user's hotel_users (default)
// 3. null (no access - redirect to /no-hotel-access)

function getActiveHotelId(session: Session, cookies: Cookies): string | null {
  const cookieHotelId = cookies.get('active_hotel_id');
  if (cookieHotelId && session.user.accessibleHotels.some(h => h.hotelId === cookieHotelId)) {
    return cookieHotelId;
  }
  return session.user.accessibleHotels[0]?.hotelId || null;
}
```

### 4.3. Hotel Switcher (Multi-Hotel Users)

```typescript
// If user has access to multiple hotels:
// - Show HotelSwitcher in sidebar
// - Switching updates 'active_hotel_id' cookie
// - Page reloads with new hotel context
```

---

## 5. Company Email Field

### 5.1. Rules

| Property | Rule |
|----------|------|
| Required? | ❌ Optional |
| Validation | ❌ No domain validation |
| Must match Google email? | ❌ No |
| Purpose | Display, reports, exports, signatures |

### 5.2. Usage

```typescript
// Example: Export report
const report = {
  generatedBy: user.name,
  contactEmail: hotel.email || user.email,  // Fallback to Google email
  hotelName: hotel.name
};
```

---

## 6. Acceptance Criteria

### AC-1: Google OAuth Login
- [ ] Only Google OAuth button on login page
- [ ] No email/password form
- [ ] Login redirects to Google consent screen
- [ ] Successful auth returns to app

### AC-2: Auto-Create User on First Login
- [ ] New Google user → User record created automatically
- [ ] Default role = `viewer`
- [ ] Default is_active = `true`
- [ ] ADMIN_EMAIL gets `super_admin` role

### AC-3: Blocked User Cannot Access
- [ ] User with `is_active: false` cannot login
- [ ] Redirected to `/blocked` page
- [ ] Clear message: "Account has been deactivated"

### AC-4: Onboarding Guard Works
- [ ] User with no hotel → Redirect to `/onboarding`
- [ ] Cannot bypass by direct URL
- [ ] Onboarding creates hotel → Redirect to `/dashboard`

### AC-5: Multi-Tenant Data Isolation
- [ ] User A cannot see User B's hotel data
- [ ] All API endpoints filter by hotelId
- [ ] No data leakage across tenants

### AC-6: Hotel Switcher Functions
- [ ] Multi-hotel users see switcher
- [ ] Switching updates context
- [ ] Page data refreshes with new hotel

### AC-7: Company Email Not Required
- [ ] Onboarding completes without company email
- [ ] Settings allow editing company email
- [ ] No validation on email domain

---

## 7. Test Cases

### TC-1: New User First Login
```
Given: Google user "newuser@gmail.com" never logged in before
When: User completes Google OAuth
Then:
  - User record created in database
  - is_active = true
  - role = 'viewer'
  - Redirected to /onboarding (no hotel)
```

### TC-2: Admin Email First Login
```
Given: ADMIN_EMAIL = "admin@company.com"
When: User with that email logs in first time
Then:
  - User created with role = 'super_admin'
  - Can access /admin/* routes
```

### TC-3: Blocked User Login Attempt
```
Given: User "blocked@gmail.com" has is_active = false
When: User attempts Google OAuth
Then:
  - Login succeeds at Google level
  - App redirects to /blocked
  - No access to protected routes
```

### TC-4: Onboarding Completion
```
Given: User logged in, no hotel assigned
When: User fills hotel form (name, rooms) and submits
Then:
  - Hotel record created
  - HotelUser record created (role: 'admin')
  - Redirected to /dashboard
  - Can access all protected routes
```

### TC-5: Multi-Tenant Isolation
```
Given:
  - User A has access to Hotel-1 (10 reservations)
  - User B has access to Hotel-2 (5 reservations)
When: User A views /data
Then:
  - Only Hotel-1's 10 reservations visible
  - No Hotel-2 data exposed
```

### TC-6: Hotel Switching
```
Given: User has access to Hotel-1 and Hotel-2
When: User clicks Hotel-2 in switcher
Then:
  - Cookie 'active_hotel_id' set to Hotel-2 ID
  - Dashboard shows Hotel-2 data
  - Hotel-2 name in header
```

### TC-7: Direct URL Bypass Attempt
```
Given: User logged in, no hotel (needs onboarding)
When: User navigates directly to /dashboard
Then:
  - Intercepted by middleware
  - Redirected to /onboarding
  - Cannot access dashboard
```

---

## 8. Implementation Files

| File | Status | Description |
|------|--------|-------------|
| `lib/auth.ts` | ✅ DONE | NextAuth config with Google OAuth |
| `middleware.ts` | ✅ DONE | Route protection + onboarding guard |
| `app/auth/login/page.tsx` | ✅ DONE | Login page with Google button |
| `app/onboarding/page.tsx` | ✅ DONE | Hotel registration form |
| `app/blocked/page.tsx` | ✅ DONE | Blocked user page |
| `app/no-hotel-access/page.tsx` | ✅ DONE | No hotel access page |
| `components/HotelSwitcher.tsx` | ✅ DONE | Hotel switching component |
| `app/api/user/switch-hotel/route.ts` | ✅ DONE | API for hotel switching |

---

## 9. Security Considerations

| Concern | Mitigation |
|---------|------------|
| Session hijacking | JWT with httpOnly cookies |
| Token expiry | 24h expiry, refresh on each request |
| CSRF | Origin validation in middleware |
| Data leakage | hotelId filter on ALL queries |
| Privilege escalation | Role check before admin actions |

---

## 10. Definition of Done

- [x] Google OAuth works
- [x] Auto-create user works
- [x] Onboarding guard works
- [x] Multi-tenant isolation verified
- [x] Hotel switcher works
- [ ] All TC passed (pending some edge cases)
- [ ] Security audit passed
