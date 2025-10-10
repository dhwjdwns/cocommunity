'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function PendingPage() {
  const router = useRouter()

  useEffect(() => {
    const tick = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return router.push('/login')
      const { data: profile } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', session.user.id)
        .single()
      if (profile?.status === 'approved') router.push('/home')
    }
    tick()
    const id = setInterval(tick, 3000) // 3초마다 확인
    return () => clearInterval(id)
  }, [router])

  return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Waiting for administrator approval…</h1>
        <p className="text-gray-500 mt-2">Once approved, you will be automatically moved.</p>
      </div>
    </div>
  )
}
