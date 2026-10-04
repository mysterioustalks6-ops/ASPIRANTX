# StudyRide Security Roadmap & Audit Advisory

## Critical Security Principle
Client-side UI role checks (such as `user?.role === 'ADMIN'` or local storage flags) are purely cosmetic for interface layout and **must never be trusted for access control**. Any user with basic browser developer tools can alter frontend JavaScript state.

---

## 1. Deprecation of Client-Side Secret Passcodes
- **Compromise Notice:** Any prior hardcoded client passcode (or legacy client-side bypass string) embedded in frontend source bundles must be treated as permanently compromised and immediately invalidated.
- **Remediation:** Remove all client-side passcode prompts and string comparisons. Admin and privileged actions must be gated strictly by cryptographic session tokens (e.g. Supabase JWT).

---

## 2. Server-Side Role Enforcement Requirements

Every administrative API endpoint must parse the incoming `Authorization: Bearer <token>` header, verify the cryptographic signature with the server secret, and validate that the user record has `role === 'ADMIN'`.

### Endpoints Requiring Server-Side Role Checks:

| API Endpoint | Method | Required Permission | Current Risk / Description |
|---|---|---|---|
| `/api/admin/system-stats` | `GET` | `ADMIN` | Exposes system telemetry, user counts, and database metrics. |
| `/api/admin/users` | `GET`, `POST` | `ADMIN` | User directory, role adjustments, and account status mutations. |
| `/api/admin/feature-flags` | `GET`, `POST` | `ADMIN` | Modifies global runtime feature flags and access gates. |
| `/api/admin/diagnostic-logs` | `GET`, `DELETE` | `ADMIN` | Exposes internal diagnostics, error traces, and client logs. |
| `/api/admin/error-logs` | `GET`, `POST` | `ADMIN` | Contains uncaught exceptions, stack traces, and client environments. |
| `/api/customizer/settings` | `POST` | `ADMIN` | Modifies homepage announcement ticker, hero banner, and global theme defaults. |
| `/api/admin/content-packages` | `POST` | `ADMIN` | Uploads and registers offline syllabus and question packs. |
| `/api/admin/sql-console` | `POST` | `SUPER_ADMIN` | Direct query runner; must require multi-factor or backend master key. |

---

## 3. Recommended Server Middleware Architecture
```typescript
// Example: Server-side middleware (Node/Express or Edge Function)
export async function requireAdminRole(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing bearer token' });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  // Fetch role directly from authoritative database record, NOT client claims
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'ADMIN' && user.email !== process.env.ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Forbidden: Admin role required' });
  }

  req.user = user;
  next();
}
```

---

## 4. Frontend Client Posture
- Client UI displays the Admin Console tab only as a convenience for verified administrators.
- If an unauthorized user navigates to `#admin`, the UI gracefully denies access, and any attempted API fetch will be rejected with HTTP 403 Forbidden by the server.
- No secrets, API master keys, service role keys, or bypass passcodes are ever compiled into the Vite/Capacitor bundle.
