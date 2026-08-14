import { createClient } from '@supabase/supabase-js';

export function getAdminSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be defined in admin environment');
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
