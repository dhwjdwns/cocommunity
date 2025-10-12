'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Profile = {
  id: string
  email: string
  display_name: string | null
  created_at: string
}

type Post = {
  id: number
  title: string
  pinned_at: string | null
  created_at: string
}

export default function AdminPage() {
  const router = useRouter()
  const [pending, setPending] = useState<Profile[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)

  // 1️⃣ 로그인 + 관리자 검증
  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return router.replace('/login')

      const { data: me, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle()

      if (error || !me?.is_admin) return router.replace('/')
      setAllowed(true)
    })()
  }, [router])

  // 2️⃣ 승인 대기 목록 불러오기
  async function loadPending() {
    const res = await fetch('/api/admin/pending', { credentials: 'include' })
    if (res.status === 401) return router.replace('/login')
    if (res.status === 403) return router.replace('/')
    const data = await res.json()
    setPending(res.ok ? data : [])
  }

  // 3️⃣ 게시글 목록 불러오기 (고정순 → 최신순)
  async function loadPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select('id,title,pinned_at,created_at')
      .order('pinned_at', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (!error) setPosts(data || [])
  }

  // 4️⃣ 페이지 진입 시 데이터 불러오기
  useEffect(() => {
    if (allowed) {
      Promise.all([loadPending(), loadPosts()]).finally(() => setLoading(false))
    }
  }, [allowed])

  // 5️⃣ 승인/거절 기능
  async function act(id: string, action: 'approve' | 'reject') {
    const res = await fetch(`/api/admin/${action}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id }),
    })
    if (res.status === 401) return router.replace('/login')
    if (res.status === 403) return router.replace('/')
    if (res.ok) setPending((x) => x.filter((p) => p.id !== id))
    else alert('실패')
  }

  // 6️⃣ 게시글 고정 / 해제 기능
  async function togglePin(post: Post) {
    const newPinned = post.pinned_at ? null : new Date().toISOString()
    const { error } = await supabase
      .from('posts')
      .update({ pinned_at: newPinned })
      .eq('id', post.id)

    if (error) {
      alert('실패: ' + error.message)
      return
    }

    await loadPosts() // ✅ 업데이트 직후 새 목록 다시 불러오기
  }

  if (!allowed || loading)
    return <div className="p-6 text-gray-600">로딩 중...</div>

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-10">
      {/* --------------- 승인 대기 사용자 섹션 --------------- */}
      <section>
        <h1 className="text-2xl font-bold mb-4">승인 대기 사용자</h1>
        <ul className="space-y-3">
          {pending.map((p) => (
            <li
              key={p.id}
              className="border rounded p-3 flex items-center justify-between"
            >
              <div>
                <div className="font-medium">{p.display_name || '(no name)'}</div>
                <div className="text-sm text-gray-500">{p.email}</div>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => act(p.id, 'approve')}
                  className="px-3 py-1 rounded bg-green-600 text-white"
                >
                  승인
                </button>
                <button
                  onClick={() => act(p.id, 'reject')}
                  className="px-3 py-1 rounded bg-red-600 text-white"
                >
                  거절
                </button>
              </div>
            </li>
          ))}
          {pending.length === 0 && (
            <li className="text-gray-500">대기 중인 사용자가 없습니다.</li>
          )}
        </ul>
      </section>

      {/* --------------- 게시글 고정 관리 섹션 --------------- */}
      <section>
        <h1 className="text-2xl font-bold mb-4">게시글 고정 관리</h1>
        <ul className="divide-y">
          {posts.map((p) => (
            <li
              key={p.id}
              className="py-3 flex justify-between items-center hover:bg-gray-50 transition"
            >
              <div>
                <div className="font-medium text-lg">
                  {p.title || '(Untitled)'}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(p.created_at).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => togglePin(p)}
                className={`px-3 py-1 rounded font-medium transition ${
                  p.pinned_at
                    ? 'bg-yellow-400 text-black hover:bg-yellow-500'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {p.pinned_at ? '고정 해제' : '고정'}
              </button>
            </li>
          ))}
          {posts.length === 0 && (
            <li className="py-4 text-center text-gray-500">
              게시글이 없습니다.
            </li>
          )}
        </ul>
      </section>
    </div>
  )
}
