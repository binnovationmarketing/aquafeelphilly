import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Validate required environment variables at startup
const missingVars: string[] = [];
if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL');
if (!supabaseAnonKey) missingVars.push('VITE_SUPABASE_ANON_KEY');

if (missingVars.length > 0) {
  const msg = `[Aquafeel] Missing required environment variables: ${missingVars.join(', ')}. Copy .env.example to .env and fill in your values.`;
  console.error(msg);

  // Show a visible red banner so it's impossible to miss during development
  if (typeof document !== 'undefined') {
    const banner = document.createElement('div');
    banner.id = 'env-error-banner';
    banner.style.cssText =
      'position:fixed;top:0;left:0;right:0;z-index:99999;background:#dc2626;color:#fff;' +
      'padding:12px 16px;font-family:monospace;font-size:13px;font-weight:bold;text-align:center;';
    banner.textContent = `⚠️ ${msg}`;
    document.body?.prepend(banner);
  }
}

/**
 * Main authenticated Supabase client.
 *
 * Uses sessionStorage so:
 *  1. Each browser tab has its own isolated session → no Web Lock contention.
 *  2. Session is automatically cleared when the browser/tab is closed
 *     (sessionStorage lifetime = tab lifetime).
 *  3. Hundreds of concurrent users never share state.
 */
export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'aq_session',
      // sessionStorage: tab-isolated (no cross-tab Web Lock), clears on close
      storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    },
  }
);

/**
 * Anonymous Supabase client — NO Web Lock / LockManager.
 *
 * Use this for all unauthenticated RPC calls (InviteLandingPage,
 * ClientReferralTab, etc.) to avoid the "lock:aq_session timed out"
 * error that happens when 3+ sessions compete for the same lock.
 *
 * NEVER call supabase.auth.* on this client.
 */
export const supabaseAnon = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

