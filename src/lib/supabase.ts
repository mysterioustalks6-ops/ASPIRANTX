import { Browser } from '@capacitor/browser';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

// Google OAuth Client ID (Direct Integration - Supabase Removed)
export const GOOGLE_CLIENT_ID = 
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || 
  '676723605247-47f3o2t685h9j61vo1qeuqma46tlsbu3.apps.googleusercontent.com';

// Supabase is completely disabled — Neon + Direct Google OAuth is authoritative
export const isSupabaseConfigured = false;

// Helper to decode JWT payload safely in browser
function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

// ─── Native App Deep Link Listener (Capacitor Android & iOS) ─────────────────
if (Capacitor.isNativePlatform()) {
  CapApp.addListener('appUrlOpen', async (data: { url: string }) => {
    console.log('🔗 Native App Deep Link Received:', data.url);
    try {
      await Browser.close().catch(() => {});

      let idToken: string | null = null;
      let accessToken: string | null = null;

      if (data.url.includes('#')) {
        const hashParams = new URLSearchParams(data.url.split('#')[1]);
        idToken = hashParams.get('id_token');
        accessToken = hashParams.get('access_token');
      }

      if (!idToken && !accessToken && data.url.includes('?')) {
        const queryParams = new URLSearchParams(data.url.split('?')[1]);
        idToken = queryParams.get('id_token');
        accessToken = queryParams.get('access_token');
      }

      if (idToken || accessToken) {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: idToken, accessToken }),
        });
        const resData = await res.json();
        if (resData.success && resData.token) {
          localStorage.setItem('aspirantx_auth_token', resData.token);
          if (resData.user?.id) {
            localStorage.setItem(`aspirantx_profile_cache_${resData.user.id}`, JSON.stringify(resData.user));
          }
          document.cookie = `user_email=${resData.user.email}; path=/; max-age=86400`;
          document.cookie = `user_role=${resData.user.role}; path=/; max-age=86400`;
          window.location.reload();
        }
      }
    } catch (deepLinkErr) {
      console.error('Error handling native auth deep link:', deepLinkErr);
    }
  });
}

// ─── Web OAuth Hash Parser on Load ───────────────────────────────────────────
if (typeof window !== 'undefined') {
  const hash = window.location.hash || '';
  if (hash.includes('id_token=') || hash.includes('access_token=')) {
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const idToken = params.get('id_token');
    const accessToken = params.get('access_token');

    if (idToken || accessToken) {
      fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: idToken, accessToken }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.token) {
            localStorage.setItem('aspirantx_auth_token', data.token);
            if (data.user?.id) {
              localStorage.setItem(`aspirantx_profile_cache_${data.user.id}`, JSON.stringify(data.user));
            }
            document.cookie = `user_email=${data.user.email}; path=/; max-age=86400`;
            document.cookie = `user_role=${data.user.role}; path=/; max-age=86400`;
            window.history.replaceState(null, '', window.location.pathname);
            window.location.reload();
          }
        })
        .catch((err) => console.error('OAuth token exchange error:', err));
    }
  }
}

/**
 * Trigger Direct Google Sign-In (Supporting Web & Native Android App)
 */
export async function signInWithGoogle(): Promise<{ data: any; error: any }> {
  try {
    const isNative = Capacitor.isNativePlatform();
    const redirectUrl = isNative 
      ? 'https://aspirantx.vercel.app/auth-callback.html' 
      : `${window.location.origin}/`;

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
      `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(redirectUrl)}` +
      `&response_type=token%20id_token` +
      `&scope=${encodeURIComponent('openid email profile')}` +
      `&nonce=${Date.now()}` +
      `&prompt=select_account`;

    if (isNative) {
      await Browser.open({
        url: authUrl,
        windowName: '_self',
        presentationStyle: 'popover',
      });
      return { data: { url: authUrl }, error: null };
    }

    // Web: Try Google Identity Services token client if available
    const gWindow = window as any;
    if (gWindow.google?.accounts?.oauth2) {
      return new Promise((resolve) => {
        const tokenClient = gWindow.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.access_token) {
              try {
                const res = await fetch('/api/auth/google', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ accessToken: tokenResponse.access_token }),
                });
                const data = await res.json();
                if (data.success && data.token) {
                  localStorage.setItem('aspirantx_auth_token', data.token);
                  if (data.user?.id) {
                    localStorage.setItem(`aspirantx_profile_cache_${data.user.id}`, JSON.stringify(data.user));
                  }
                  document.cookie = `user_email=${data.user.email}; path=/; max-age=86400`;
                  document.cookie = `user_role=${data.user.role}; path=/; max-age=86400`;
                  window.location.reload();
                  resolve({ data: { user: data.user, session: { access_token: data.token } }, error: null });
                  return;
                }
              } catch (exErr) {
                console.error('Direct token exchange failed:', exErr);
              }
            }
            resolve({ data: null, error: new Error('Google Sign-In was cancelled or failed.') });
          },
        });
        tokenClient.requestAccessToken();
      });
    }

    // Fallback: Standard browser redirect to Google OAuth
    window.location.href = authUrl;
    return { data: { url: authUrl }, error: null };
  } catch (err: any) {
    console.error('Google Sign-In initiation error:', err);
    return { data: null, error: err };
  }
}

/**
 * Sign In with Email and Password directly with Neon PostgreSQL
 */
export async function signInWithEmail(email: string, password: string): Promise<{ data: any; error: any }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      return { data: null, error: new Error(result.error || 'Invalid email or password') };
    }

    if (result.token) {
      localStorage.setItem('aspirantx_auth_token', result.token);
      if (result.user?.id) {
        localStorage.setItem(`aspirantx_profile_cache_${result.user.id}`, JSON.stringify(result.user));
      }
      document.cookie = `user_email=${result.user.email}; path=/; max-age=86400`;
      document.cookie = `user_role=${result.user.role}; path=/; max-age=86400`;
    }

    return {
      data: {
        user: result.user,
        session: { access_token: result.token, user: result.user },
      },
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Sign Up with Email, Password and Full Name directly with Neon PostgreSQL
 */
export async function signUpWithEmail(email: string, password: string, fullName?: string): Promise<{ data: any; error: any }> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name: fullName }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      return { data: null, error: new Error(result.error || 'Registration failed') };
    }

    if (result.token) {
      localStorage.setItem('aspirantx_auth_token', result.token);
      if (result.user?.id) {
        localStorage.setItem(`aspirantx_profile_cache_${result.user.id}`, JSON.stringify(result.user));
      }
      document.cookie = `user_email=${result.user.email}; path=/; max-age=86400`;
      document.cookie = `user_role=${result.user.role}; path=/; max-age=86400`;
    }

    return {
      data: {
        user: result.user,
        session: { access_token: result.token, user: result.user },
      },
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Sign Out: Clear internal tokens, caches, and cookies
 */
export async function signOut(): Promise<{ error: any }> {
  try {
    localStorage.removeItem('aspirantx_auth_token');
    document.cookie = 'user_email=; path=/; max-age=0';
    document.cookie = 'user_role=; path=/; max-age=0';
    document.cookie = 'ax_token=; path=/; max-age=0';
    window.location.reload();
    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
}

const createChainableProxy = (): any => {
  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      if (prop === 'then') {
        return (resolve: any) => resolve({ data: null, count: 0, error: null });
      }
      return (..._args: any[]) => createChainableProxy();
    },
    apply() {
      return createChainableProxy();
    },
  };
  const fn = () => {};
  return new Proxy(fn, handler);
};

/**
 * Compatibility Object for Supabase API (Fully Safe Proxy Stub)
 * Allows existing UI components to call supabase.* without modifications or errors
 */
export const supabase: any = {
  auth: {
    async getSession() {
      const token = typeof window !== 'undefined' ? localStorage.getItem('aspirantx_auth_token') : null;
      if (!token) return { data: { session: null }, error: null };

      const decoded = decodeJwtPayload(token);
      if (!decoded || (decoded.exp && decoded.exp * 1000 < Date.now())) {
        localStorage.removeItem('aspirantx_auth_token');
        return { data: { session: null }, error: null };
      }

      const user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role || 'USER',
        user_metadata: {
          full_name: decoded.name || decoded.email?.split('@')[0],
          avatar_url: decoded.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        },
      };

      return {
        data: {
          session: {
            access_token: token,
            user,
          },
        },
        error: null,
      };
    },

    async getUser() {
      const { data, error } = await this.getSession();
      return { data: { user: data.session?.user || null }, error };
    },

    async signOut() {
      return signOut();
    },

    onAuthStateChange(callback: (event: string, session: any) => void) {
      this.getSession().then(({ data }: any) => {
        if (data.session) {
          callback('SIGNED_IN', data.session);
        } else {
          callback('SIGNED_OUT', null);
        }
      });
      return {
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      };
    },

    signInWithOAuth: signInWithGoogle,
    signInWithPassword: ({ email, password }: any) => signInWithEmail(email, password),
    signUp: ({ email, password, options }: any) => signUpWithEmail(email, password, options?.data?.full_name),
    exchangeCodeForSession: async (_code: string) => ({ data: { session: null }, error: null }),
    setSession: async (session: any) => {
      if (session?.access_token) {
        localStorage.setItem('aspirantx_auth_token', session.access_token);
      }
      return { error: null };
    },
    updateUser: async (_updates: any) => ({ data: null, error: null }),
  },

  from: (..._args: any[]) => createChainableProxy(),
  storage: {
    from: (..._args: any[]) => ({
      upload: async () => ({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
  channel: (..._args: any[]) => createChainableProxy(),
  removeChannel: (..._args: any[]) => {},
};