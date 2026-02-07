# Security & Tenancy Specification

## Authentication
- **Provider**: NextAuth.js v5 (Beta).
- **Methods**: Google OAuth, Email/Password credentials.
- **Session**: Secure HTTP-only cookies.

## Authorization (RBAC)
Levels defined in `middleware.ts`:

1.  **Viewer**: Read-only access to Dashboard/Pricing.
2.  **Manager**: `Viewer` + Data Import/Export.
3.  **Hotel Admin**: `Manager` + Settings (Users/Hotel Config).
4.  **Super Admin**: Full System Access (Cross-Tenant).

## Multi-Tenancy (Data Isolation)
- **Strategy**: Logical Separation via `hotel_id`.
- **Implementation**:
    - **Database**: All major tables (`reservations_raw`, `daily_otb`, `pricing_decisions`) include `hotel_id` Foreign Key.
    - **API Layer**: Every API endpoint **MUST** validate `session.hotel_id` matched requested data.
    - **Middleware**: Checks `accessibleHotels` in session claim to prevent authorized users from accessing other hotels.

## Security Rules
1.  **Rate Limiting**: (Recommended) Implement on `/auth/*` and public APIs.
2.  **Input Validation**: Strict typing via Zod/TypeScript on all Server Actions.
3.  **Audit Logs**: Use `pricing_decisions` table to track all financial changes.
