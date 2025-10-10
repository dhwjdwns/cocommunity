import { supabase } from './supabaseClient'
import { redirect } from 'next/navigation'

export async function requireApprovedUser() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('status, display_name, is_admin')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.status !== 'approved') {
    redirect('/pending')
  }
  return { user: session.user, profile }
}
