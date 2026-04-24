import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Sanitize URL: Remove trailing slashes and common subpaths like /rest/v1 if present
const sanitizeUrl = (url: string | undefined) => {
  if (!url) return '';
  // Remove trailing slashes
  let sanitized = url.trim().replace(/\/+$/, '');
  // Remove /rest/v1 or /auth/v1 suffixes if the user accidentally included them
  sanitized = sanitized.replace(/\/(rest|auth)\/v1$/, '');
  return sanitized;
};

const finalUrlString = sanitizeUrl(supabaseUrl);

// Detect if we are in a "placeholder" or unconfigured state
export const isSupabaseConfigured = Boolean(
  finalUrlString && 
  finalUrlString.length > 0 && 
  !finalUrlString.includes('placeholder') &&
  supabaseAnonKey &&
  supabaseAnonKey.length > 0 &&
  !supabaseAnonKey.includes('placeholder')
);

// Fallback to a syntactically valid but unreachable URL if missing 
// to prevent "Invalid path" errors during SDK initialization.
const finalUrlValue = isSupabaseConfigured ? finalUrlString : 'https://project-id.supabase.co';
const finalKey = isSupabaseConfigured ? supabaseAnonKey : 'no-key-provided';

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY ' +
    'to your environment variables in Settings -> Secrets.'
  );
}

export const supabase = createClient(finalUrlValue, finalKey);
