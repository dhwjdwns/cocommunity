import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,           // URL은 동일
  process.env.SUPABASE_SERVICE_ROLE_KEY!,          // service role
  { auth: { persistSession: false } }
)
