import { createClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from '@/env';

export function createAdminClient() {
  if (!isSupabaseConfigured() || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase admin client is not configured');
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
