'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function DebugPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [err, setErr] = useState<string>('')

  useEffect(() => {
    (async () => {
      const { data: { session }, error: sErr } = await supabase.auth.getSession()
      if (sErr) setErr(sErr.message)
      setSessionInfo(session)
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id,email,status,is_admin,created_at')
          .eq('id', session.user.id)
          .single()
        if (error) setErr(error.message)
        setProfile(data)
      }
    })()
  }, [])

  return (
    <pre className="p-4 text-sm whitespace-pre-wrap">
      ERROR: {err || '(none)'}{'\n\n'}
      SESSION USER:
      {JSON.stringify(sessionInfo?.user || null, null, 2)}{'\n\n'}
      PROFILE ROW:
      {JSON.stringify(profile || null, null, 2)}
    </pre>
  )
}
