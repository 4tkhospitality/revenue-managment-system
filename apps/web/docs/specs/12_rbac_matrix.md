# RBAC & Tenancy Matrix

## User Roles
| Role | Permissions | Access Level |
| :--- | :--- | :--- |
| **Viewer** | Read Dashboard, Pricing Grid, OTB Data. | Read-Only. |
| **Manager** | `Viewer` + Import CSV, Trigger Forecast, Manual Scan. | Operational. |
| **Hotel Admin** | `Manager` + Manage Hotel Users, Settings, Channels. | Hotel-Level Admin. |
| **Super Admin** | Full System Access, Cross-Tenant. | System God Mode. |

## Permissions Matrix

| Feature | Viewer | Manager | Hotel Admin | Super Admin |
| :--- | :---: | :---: | :---: | :---: |
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| View Pricing | ✅ | ✅ | ✅ | ✅ |
| **Edit/Decide Price** | ❌ | ✅ | ✅ | ✅ |
| **Import Data** | ❌ | ✅ | ✅ | ✅ |
| **Run Forecast** | ❌ | ✅ | ✅ | ✅ |
| **Trigger Rate Shop** | ❌ | ✅ | ✅ | ✅ |
| **Edit Settings** | ❌ | ❌ | ✅ | ✅ |
| **Manage Users** | ❌ | ❌ | ✅ | ✅ |

## Tenant Isolation
- **Mechanism**: `hotel_id` is mandatory in all generic queries.
- **Middleware**: Validates user has access to the requested `active_hotel_id` cookie.
- **Database**: `policies` (Row Level Security) NOT enabled in V01 (App-level isolation).
    - *Risk*: Direct DB access bypasses isolation. Application code MUST filter by `hotel_id`.
