import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

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

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-key',
  {
    auth: {
      // Persist session so users don't re-login on every page visit
      persistSession: true,
      autoRefreshToken: true,
      // Detect session from URL hash (required for OAuth redirects)
      detectSessionInUrl: true,
      storageKey: 'aq_session',
    },
  }
);

