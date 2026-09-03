import { createClient } from '@supabase/supabase-js';
import { Browser } from '@capacitor/browser';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

// Default values or user-provided environment variables
const env = (import.meta as any).env || {};

const DEFAULT_SUPABASE_URL = "https://ixwpkzorjutnhpnybuvx.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_dF6kX95MWNslPQThitCNLA_wjRSIDdR";

const supabaseUrl = env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey &&
  !supabaseUrl.includes('placeholder')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }
});

// Setup native deep link listener for Android & iOS Capacitor app OAuth returns
if (Capacitor.isNativePlatform()) {
  CapApp.addListener('appUrlOpen', async (data: { url: string }) => {
    console.log('🔗 Native App Deep Link Received:', data.url);
    try {
      // Close in-app Chrome Custom Tab browser window
      await Browser.close().catch(() => {});

      // Parse access_token / refresh_token or PKCE code from deep link url
      const urlObj = new URL(data.url);
      
      // 1. If PKCE auth code is present in query parameters
      const code = urlObj.searchParams.get('code');
      if (code) {
        const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('Failed to exchange PKCE code for session:', error);
        } else if (sessionData.session) {
          console.log('✅ Native Session successfully restored via PKCE code exchange');
        }
        return;
      }

      // 2. If tokens are present in URL hash (#access_token=...&refresh_token=...)
      if (data.url.includes('#')) {
        const hashParams = new URLSearchParams(data.url.split('#')[1]);
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            console.error('Failed to set session from native hash tokens:', error);
          } else {
            console.log('✅ Native Session successfully set from deep link hash');
          }
        }
      }
    } catch (deepLinkErr) {
      console.error('Error handling native auth deep link:', deepLinkErr);
    }
  });
}

/**
 * Trigger Google Sign-In with Supabase Auth (Supporting Native Android In-App Browser & Web)
 */
export async function signInWithGoogle() {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase credentials not configured in environment.') };
  }

  try {
    const isNative = Capacitor.isNativePlatform();
    
    // In native Android app: redirect back into app scheme 'com.aspirantx.app://'
    // On web: redirect to current window origin
    const redirectUrl = isNative 
      ? 'com.aspirantx.app://' 
      : `${window.location.origin}/`;

    if (isNative) {
      // Get OAuth URL without redirecting whole WebView away
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
          queryParams: {
            prompt: 'select_account',
          },
        }
      });

      if (error) {
        console.error("Native OAuth initiation error:", error);
        return { data: null, error };
      }

      if (data?.url) {
        // Open Google Sign-In in Android Chrome Custom Tab overlay
        await Browser.open({ 
          url: data.url, 
          windowName: '_self',
          presentationStyle: 'popover' 
        });
      }
      return { data, error: null };
    }

    // Standard Web OAuth flow
    const response = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          prompt: 'select_account',
        },
      }
    });

    return response;
  } catch (err: any) {
    console.error("CATCH ERROR:", err);
    return { data: null, error: err };
  }
}

/**
 * Sign In with Email and Password
 */
export async function signInWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase project credentials not configured.') };
  }
  return await supabase.auth.signInWithPassword({ email, password });
}

/**
 * Sign Up with Email, Password and Full Name
 */
export async function signUpWithEmail(email: string, password: string, fullName?: string) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase project credentials not configured.') };
  }
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      }
    }
  });
}