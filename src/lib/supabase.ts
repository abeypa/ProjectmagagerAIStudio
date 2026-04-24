import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Detect if we are in a "placeholder" or unconfigured state
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseUrl.length > 0 && 
  !supabaseUrl.includes('placeholder') &&
  supabaseAnonKey &&
  supabaseAnonKey.length > 0 &&
  !supabaseAnonKey.includes('placeholder')
);

// Fallback to a syntactically valid but unreachable URL if missing 
// to prevent "Invalid path" errors during SDK initialization.
const finalUrl = isSupabaseConfigured ? supabaseUrl : 'https://project-id.supabase.co';
const finalKey = isSupabaseConfigured ? supabaseAnonKey : 'no-key-provided';

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY ' +
    'to your environment variables in Settings -> Secrets.'
  );
}

export const supabase = createClient(finalUrl, finalKey);
