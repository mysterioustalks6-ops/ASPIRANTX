const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const rbacCode = `
// ============================================================================
// ENTERPRISE ROLE-BASED & ATTRIBUTE-BASED ACCESS CONTROL (RBAC/ABAC)
// ============================================================================
function requireEnterprisePermission(permissionKey: string) {
  return async (req: any, res: any, next: any) => {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const clientIp = String(req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress || '127.0.0.1').split(',')[0].trim();
    const requestId = String(req.headers['x-request-id'] || \`req_\${Date.now()}_\${Math.random().toString(36).substring(2, 7)}\`);

    if (!verifiedUser) {
      recordAdminAuditLog({
        user: 'anonymous',
        action: 'UNAUTHORIZED_API_ACCESS',
        details: \`Blocked unauthenticated attempt to \${req.method} \${req.path}\`,
        ip: clientIp,
        requestId,
        endpoint: req.originalUrl || req.path,
        outcome: 'DENIED',
      });
      return res.status(401).json({ error: 'Authentication Required.' });
    }

    const email = verifiedUser.email.toLowerCase();
    const isSuperAdmin = email === DESIGNATED_ADMIN_EMAIL.toLowerCase();

    const teamMember = adminTeamStore.find(t => t.email.toLowerCase() === email);
    
    let hasPerm = isSuperAdmin;
    if (!hasPerm && teamMember) {
       if (teamMember.role === 'SUPER_ADMIN') hasPerm = true;
       else if (teamMember.permissions && teamMember.permissions[permissionKey] === true) hasPerm = true;
    }

    if (!hasPerm) {
      recordAdminAuditLog({
        user: email,
        action: 'FORBIDDEN_RBAC_ACCESS',
        details: \`Blocked attempt to \${req.method} \${req.path}. Missing permission: \${permissionKey}\`,
        ip: clientIp,
        requestId,
        endpoint: req.originalUrl || req.path,
        outcome: 'DENIED',
      });
      return res.status(403).json({ error: \`Forbidden: Requires \${permissionKey} permission.\` });
    }

    // Attach team context to request for further ABAC down the line
    req.adminEmail = email;
    req.clientIp = clientIp;
    req.requestId = requestId;
    req.teamProfile = teamMember;
    
    next();
  };
}
`;

if (!code.includes('requireEnterprisePermission')) {
  code = code.replace('async function verifyAdminAuth(req: any, res: any, next: any) {', rbacCode + '\nasync function verifyAdminAuth(req: any, res: any, next: any) {');
  fs.writeFileSync('server.ts', code);
  console.log('RBAC middleware injected.');
} else {
  console.log('RBAC middleware already exists.');
}
