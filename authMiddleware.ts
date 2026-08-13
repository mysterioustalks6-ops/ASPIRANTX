import { createServerClient } from '@supabase/ssr';
import jwt from 'jsonwebtoken';

export const DESIGNATED_ADMIN_EMAIL =
  process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || 'ambujyadav0010@gmail.com';

const JWT_SECRET = process.env.JWT_SECRET || process.env.VITE_SUPABASE_ANON_KEY || '';

// Helper to parse cookies from request
function parseCookies(req: any): Record<string, string> {
  const cookieDict: Record<string, string> = {};

  // Parse raw cookie header string
  let cookieHeader = '';
  if (req.headers) {
    if (typeof req.headers.get === 'function') {
      cookieHeader = req.headers.get('cookie') || '';
    } else if (typeof req.headers === 'object') {
      cookieHeader = req.headers['cookie'] || req.headers['Cookie'] || '';
    }
  }

  if (cookieHeader) {
    cookieHeader.split(';').forEach((pair: string) => {
      const [key, ...val] = pair.trim().split('=');
      if (key) {
        cookieDict[key.trim()] = decodeURIComponent(val.join('='));
      }
    });
  }

  // Also check req.cookies if provided as object
  if (req.cookies) {
    if (typeof req.cookies.get === 'function') {
      const userEmailVal = req.cookies.get('user_email');
      if (userEmailVal) {
        cookieDict['user_email'] = typeof userEmailVal === 'object' ? userEmailVal.value : userEmailVal;
      }
      const userRoleVal = req.cookies.get('user_role');
      if (userRoleVal) {
        cookieDict['user_role'] = typeof userRoleVal === 'object' ? userRoleVal.value : userRoleVal;
      }
      const tokenVal = req.cookies.get('ax_token');
      if (tokenVal) {
        cookieDict['ax_token'] = typeof tokenVal === 'object' ? tokenVal.value : tokenVal;
      }
    } else if (typeof req.cookies === 'object') {
      Object.assign(cookieDict, req.cookies);
    }
  }

  return cookieDict;
}

export async function middleware(req: any) {
  const urlString = typeof req.url === 'string' ? req.url : req.url?.toString() || '/';
  const url = new URL(urlString, 'http://localhost:3000');
  const currentPath = url.pathname;

  // Read cookies
  const cookies = parseCookies(req);
  const adminEmail = (process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || 'ambujyadav0010@gmail.com').trim().toLowerCase();

  let userEmail = '';
  let userRole = '';

  // 1. Check Authorization Bearer Token or ax_token cookie (Cryptographically Verified)
  let authHeader = '';
  if (req.headers) {
    if (typeof req.headers.get === 'function') {
      authHeader = req.headers.get('authorization') || '';
    } else if (typeof req.headers === 'object') {
      authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
    }
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : cookies['ax_token'];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded && decoded.email) {
        userEmail = decoded.email.trim().toLowerCase();
        if (decoded.role) userRole = decoded.role;
      }
    } catch (e) {
      // Invalid or expired JWT token
    }
  }

  // 2. Attempt Supabase SSR Auth token verification if Supabase credentials exist
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return Object.entries(cookies).map(([name, value]) => ({ name, value }));
          },
          setAll() {},
        },
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        userEmail = user.email.trim().toLowerCase();
        if (user.user_metadata?.role) {
          userRole = user.user_metadata.role;
        }
      }
    } catch (e) {
      // Supabase SSR lookup fallback
    }
  }

  // MANDATORY TERMINAL DEBUG LOG (Prints User Email and Current Path for terminal debugging)
  console.log(
    `[Edge Middleware Security] Path: "${currentPath}" | User Email: "${userEmail || 'Guest/Unauthenticated'}" | Admin: "${adminEmail}"`
  );

  // Intercept /admin route
  if (currentPath.startsWith('/admin')) {
    const isDesignatedAdmin =
      (userEmail && userEmail === adminEmail) ||
      userRole === 'ADMIN' ||
      userEmail === 'ambujyadav0010@gmail.com';

    if (!isDesignatedAdmin) {
      console.log(
        `[Edge Middleware Security] 🛑 UNAUTHORIZED ACCESS ATTEMPT to "${currentPath}" by "${userEmail || 'Guest'}". Instantly redirecting to /dashboard.`
      );

      return {
        status: 302,
        headers: {
          Location: '/dashboard',
        },
        redirected: true,
      };
    }

    console.log(
      `[Edge Middleware Security] ✅ AUTHORIZED ADMIN ACCESS GRANTED to "${currentPath}" for user "${userEmail}".`
    );
  }

  return { status: 200, userEmail, userRole, isAuthorized: true };
}


export const config = {
  matcher: ['/admin/:path*', '/admin'],
};
