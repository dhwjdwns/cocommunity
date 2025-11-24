'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'

type Post = { id: number; title: string; created_at: string; pinned_at: string | null }

export default function HomePage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (!error && profile && profile.status !== 'approved') {
        router.push('/pending')
      }

      const { data } = await supabase
        .from('posts')
        .select('id,title,created_at,pinned_at')
        .order('pinned_at', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
      setPosts(data || [])
    })()
  }, [router])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <Image
          src="/images/logo_02_1.png"
          alt="하나 그리고 다음 로고"
          width={3000}
          height={120}
          priority
        />
        <div className="space-x-3">
          {/* <Link href="/write" className="text-blue-600 hover:underline">글쓰기</Link>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-red-500">로그아웃</button> */}
        </div>
      </div>

      <ul className="divide-y">
        {posts.map((p) => (
          <li key={p.id} className="py-3 flex justify-between items-center">
            <div>
              <Link
                href={`/post/${p.id}`}
                className="text-lg font-semibold hover:underline"
              >
                {p.title || '(Untitled)'}
              </Link>
              <div className="text-sm text-gray-500">
                {new Date(new Date(p.created_at).getTime() + 9 * 60 * 60 * 1000).toLocaleString('en-US')}
              </div>
            </div>

            {/* ✅ 고정된 글이면 오른쪽에 연한 표시 */}
            {p.pinned_at && (
              <span className="text-sm text-gray-400 ml-3">PIN </span>
            )}
          </li>
        ))}

        {posts.length === 0 && (
          <li className="py-8 text-gray-500">There are no posts yet.</li>
        )}
      </ul>
    </div>
  )
}
