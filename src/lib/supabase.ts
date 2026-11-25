import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in app/.env');
}

const isServer = typeof window === 'undefined';

export const supabase = createClient<Database>(url, key, {
  auth: {
    autoRefreshToken: !isServer,
    persistSession: !isServer,
    detectSessionInUrl: !isServer,
    flowType: 'pkce',
  },
});
