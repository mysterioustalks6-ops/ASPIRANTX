import { createClient } from '@supabase/supabase-js';

// Default values or user-provided environment variables
const env = (import.meta as any).env || {};

const DEFAULT_SUPABASE_URL = "https://ixwpkzorjutnhpnybuvx.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4d3Brem9yanV0bmhwbnlidXZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NDIxMjIsImV4cCI6MjEwMTMxODEyMn0.0Km2xeSzdTznuSzNK8DyL4a_MfYFFnuEseV78oSx9zw";

const supabaseUrl = env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey &&
  !supabaseUrl.includes('placeholder')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'implicit',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});

/**
 * Trigger Google Sign-In with Supabase Auth
 */
export async function signInWithGoogle() {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase credentials not configured in environment.') };
  }

  if (supabaseAnonKey && !supabaseAnonKey.startsWith('eyJ')) {
    return { 
      data: null, 
      error: new Error('Invalid Supabase Anon Key format! Replace VITE_SUPABASE_ANON_KEY with the real anon JWT key starting with "eyJ...".') 
    };
  }


  try {
    // Detect if running inside native Android/iOS Capacitor app
    const isCapacitorNative = Boolean((window as any).Capacitor?.isNativePlatform?.());
    
    // In native app, use custom app scheme or current origin without redirecting to external website
    const redirectUrl = isCapacitorNative 
      ? 'com.aspirantx.app://' 
      : `${window.location.origin}/`;

    const response = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          prompt: 'select_account',
        },
      }
    });

    console.log("Full Auth Response:", response);
    if (response.error) {
      console.error("EXACT ERROR MESSAGE:", response.error.message);
    }
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
    return { data: null, error: new Error('Supabase project credentials not configured in .env. Please add keys to enable Email Sign-In.') };
  }
  if (env.VITE_SUPABASE_ANON_KEY && !env.VITE_SUPABASE_ANON_KEY.startsWith('eyJ')) {
    return { data: null, error: new Error('Invalid Supabase Anon Key format! Replace VITE_SUPABASE_ANON_KEY in .env with the real anon JWT key starting with "eyJ...".') };
  }
  return await supabase.auth.signInWithPassword({ email, password });
}

/**
 * Sign Up with Email, Password and Full Name
 */
export async function signUpWithEmail(email: string, password: string, fullName?: string) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase project credentials not configured in .env. Please add keys to enable Email Sign-Up.') };
  }
  if (env.VITE_SUPABASE_ANON_KEY && !env.VITE_SUPABASE_ANON_KEY.startsWith('eyJ')) {
    return { data: null, error: new Error('Invalid Supabase Anon Key format! Replace VITE_SUPABASE_ANON_KEY in .env with the real anon JWT key starting with "eyJ...".') };
  }

  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName || '' },
      emailRedirectTo: `${window.location.origin}/`,
    }
  });
}