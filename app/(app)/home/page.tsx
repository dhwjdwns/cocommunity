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

  // --- 로직 추가: 고정글 분리 및 일반글 연도별 그룹화 ---
  const pinnedPosts = posts.filter(p => p.pinned_at !== null)
  const unpinnedPosts = posts.filter(p => p.pinned_at === null)

  const groupedPosts = unpinnedPosts.reduce((acc, post) => {
    const kstDate = new Date(new Date(post.created_at).getTime() + 9 * 60 * 60 * 1000)
    const year = kstDate.getFullYear()
    if (!acc[year]) acc[year] = []
    acc[year].push(post)
    return acc
  }, {} as Record<number, Post[]>)

  const years = Object.keys(groupedPosts).map(Number).sort((a, b) => b - a)
  // ------------------------------------------------

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <Image
          src="/images/logo_02_2.png"
          alt="하나 그리고 다음 로고"
          width={3000}
          height={120}
          priority
        />
        <div className="space-x-3">
        </div>
      </div>

      {/* 고정된 글 섹션  */}
      {pinnedPosts.length > 0 && (
        <ul className="divide-y mb-8">
          {pinnedPosts.map((p) => (
            <li key={p.id} className="py-3 flex justify-between items-center">
              <div>
                <Link href={`/post/${p.id}`} className="text-lg font-semibold hover:underline">
                  {p.title || '(Untitled)'}
                </Link>
                <div className="text-sm text-gray-500">
                  {new Date(new Date(p.created_at).getTime() + 9 * 60 * 60 * 1000).toLocaleString('en-US')}
                </div>
              </div>
              {/* <span className="text-sm text-gray-400 ml-3">PIN </span> */}
            </li>
          ))}
        </ul>
      )}

      {/*  연도별 섹션  */}
      {years.map((year) => (
        <div key={year} className="mt-8">
          <div className="flex items-center mb-2">
            <span className="text-2xl font-bold text-gray-800 pr-4 whitespace-nowrap">
              {year}
            </span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>
          <ul className="divide-y">
            {groupedPosts[year].map((p) => (
              <li key={p.id} className="py-3 flex justify-between items-center">
                <div>
                  <Link href={`/post/${p.id}`} className="text-lg font-semibold hover:underline">
                    {p.title || '(Untitled)'}
                  </Link>
                  <div className="text-sm text-gray-500">
                    {new Date(new Date(p.created_at).getTime() + 9 * 60 * 60 * 1000).toLocaleString('en-US')}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {posts.length === 0 && (
        <ul className="divide-y">
          <li className="py-8 text-gray-500">There are no posts yet.</li>
        </ul>
      )}
    </div>
  )
}