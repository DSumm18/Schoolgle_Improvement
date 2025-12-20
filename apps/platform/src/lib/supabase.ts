import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Debug: Log environment variable status (only in browser)
if (typeof window !== 'undefined') {
  console.log('[Supabase Init] Environment check:', {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    urlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL 
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...` 
      : 'MISSING',
    anonKeyPreview: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...`
      : 'MISSING'
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: SupabaseClient;

if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [];
  if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  console.error('[Supabase Init] ❌ Missing required environment variables:', missing);
  console.error('[Supabase Init] Make sure these are set in .env.local and restart the dev server');
  
  // Create a dummy client to prevent crashes, but it won't work
  // This allows the app to load and show error messages
  supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  ) as SupabaseClient;
} else {
  // Shared Supabase client to avoid multiple instances
  // Created outside React component lifecycle
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    global: {
      headers: {
        'x-client-info': 'schoolgle-platform',
      },
    },
  });
  
  if (typeof window !== 'undefined') {
    console.log('[Supabase Init] ✅ Client initialized successfully');
    
    // Verify the client can access the session and set up auto-refresh
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('[Supabase Init] Error getting session:', error);
      } else if (data.session) {
        console.log('[Supabase Init] ✅ Session found:', {
          userId: data.session.user.id,
          expiresAt: new Date(data.session.expires_at! * 1000).toISOString(),
        });
        // Ensure session is set on the client
        supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token || '',
        }).catch((err) => {
          console.error('[Supabase Init] Error setting session:', err);
        });
      } else {
        console.log('[Supabase Init] No active session');
      }
    });

    // Listen for auth state changes to keep session in sync
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        console.log('[Supabase Init] ✅ User signed in, session active');
      } else if (event === 'SIGNED_OUT') {
        console.log('[Supabase Init] User signed out');
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('[Supabase Init] ✅ Token refreshed');
      }
    });
  }
}

export { supabase };
