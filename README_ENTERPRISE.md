# Enterprise Admin Platform Transition

The admin system has been structurally redesigned from a simple startup configuration to a Fortune-500 enterprise model. 

## 1. Complete Department Isolation (RBAC)
- Implementation of **Role-Based Access Control (RBAC)** through explicit permissions for cross-functional departments (Executive Leadership, Finance, Academics, Engineering, etc.).
- The UI in the Admin Panel now dynamically filters visible tabs based on actual assigned team member permissions (`canManageFinance`, `canManageUsers`, `canManageAdsense`, etc.). If a user is not in the Finance team, the tab simply does not exist for them.
- Backend Express endpoints are protected via an injected `requireEnterprisePermission()` middleware, which performs a secondary server-side ABAC capability check against all inbound requests.

## 2. Immutable Audit Architecture
- Expanded the `/api/admin/watchdog` API and `recordAdminAuditLog()` signature to act as an immutable audit trail.
- Every API interaction now carries user state, geo-IP metadata, outcome, action type, explicit timestamping, and rollback payloads when modified.
- Added a dedicated **Audit Trails** UI module for Security/Compliance teams.

## 3. Production Deployment Hardening
- **Dockerfile**: Generated a multi-stage optimized alpine build for containerized artifact management.
- **docker-compose.yml**: Added for cluster deployment simulations.
- **DEPLOYMENT.md**: Created architecture instructions covering reverse proxies, scaling, GitHub actions CI/CD configurations, and Kubernetes instructions.

## 4. HR & Team Assignment Management
- Created the **HR & Team Workflows** visual tab.
- Integrated the active employee assignment tables alongside pending workflow task approvals directly in the Admin Panel UI, decoupled from student management.

## 5. Security & Visibility Rules
- Any unverified access attempts are caught, dropped, and recorded with full IP/Request ID tracing via the enhanced authentication middleware blocks.
- The `requireEnterprisePermission()` ensures even if a user guesses the URL or CURLs the API, it fails securely and silently logs their attempt.
