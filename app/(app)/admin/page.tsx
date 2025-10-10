// app/admin/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Profile = { id: string; email: string; display_name: string | null; created_at: string }

export default function AdminPage() {
  const router = useRouter()
  const [pending, setPending] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)

  // 1) 로그인 + is_admin 체크 (관리자 아니면 튕김)
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return router.replace('/login')

      const { data: me } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle()

      if (!me?.is_admin) return router.replace('/')
      setAllowed(true) // 통과
    })()
  }, [router])

  // 2) 승인 대기 목록 불러오기 (401/403 대응)
  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/pending', { credentials: 'include' })
    if (res.status === 401) return router.replace('/login')
    if (res.status === 403) return router.replace('/')
    const data = await res.json()
    setPending(res.ok ? data : [])
    setLoading(false)
  }

  useEffect(() => {
    if (allowed) load()
  }, [allowed])

  // 3) 승인/거절 액션 (401/403 대응)
  async function act(id: string, action: 'approve'|'reject') {
    const res = await fetch(`/api/admin/${action}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id })
    })
    if (res.status === 401) return router.replace('/login')
    if (res.status === 403) return router.replace('/')
    if (res.ok) setPending(x => x.filter(p => p.id !== id))
    else alert('실패')
  }

  if (!allowed || loading) return <div className="p-6">로딩...</div>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">승인 대기 사용자</h1>
      <ul className="space-y-3">
        {pending.map((p) => (
          <li key={p.id} className="border rounded p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{p.display_name || '(no name)'}</div>
              <div className="text-sm text-gray-500">{p.email}</div>
            </div>
            <div className="space-x-2">
              <button onClick={() => act(p.id,'approve')} className="px-3 py-1 rounded bg-green-600 text-white">승인</button>
              <button onClick={() => act(p.id,'reject')} className="px-3 py-1 rounded bg-red-600 text-white">거절</button>
            </div>
          </li>
        ))}
        {pending.length === 0 && <li className="text-gray-500">대기 중인 사용자가 없습니다.</li>}
      </ul>
    </div>
  )
}
