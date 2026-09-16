'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'
import PostListItem from '@/components/PostListItem'

type Post = { id: number; title: string; created_at: string; pinned_at: string | null }

export default function HomePage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [colors, setColors] = useState<Record<number, string>>({})
  const [colorError, setColorError] = useState('')

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
        return
      }
      setIsAdmin(!error && profile?.is_admin === true)

      const { data } = await supabase
        .from('posts')
        .select('id,title,created_at,pinned_at')
        .order('pinned_at', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
      setPosts(data || [])
      const { data: colorRows, error: colorLoadError } = await supabase
        .from('post_backgrounds')
        .select('post_id,color')
      if (colorLoadError) {
        setColorError('배경색을 불러오지 못했습니다. 데이터베이스 설정과 연결을 확인해 주세요.')
      } else {
        setColors(Object.fromEntries((colorRows || []).map(row => [row.post_id, row.color])))
      }
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


  return (
    <div className="max-w-2xl mx-auto p-6 dark:bg-[#0A0A0A] dark:text-white">
      <div className="flex justify-between items-center mb-4">
        <Image
          src="/images/banner_v3.png"
          alt="하나 그리고 다음 로고"
          width={3000}
          height={120}
          priority
          className="block dark:hidden"
        />
        <Image
          src="/images/banner_v3_white.png"
          alt="하나 그리고 다음 로고"
          width={3000}
          height={120}
          priority
          className="hidden dark:block"
        />
        <div className="space-x-3">
        </div>
      </div>

      {isAdmin && colorError && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{colorError}</p>}

      {/* 고정된 글 섹션  */}
      {pinnedPosts.length > 0 && (
        <ul className="divide-y dark:divide-gray-700 mb-8">
          {pinnedPosts.map((p) => (
            <PostListItem
              key={p.id}
              post={p}
              color={colors[p.id] || ''}
              canEditColor={isAdmin && !colorError}
              onColorSaved={(color) => setColors(current => ({ ...current, [p.id]: color }))}
            />
          ))}
        </ul>
      )}

      {/*  연도별 섹션  */}
      {years.map((year) => (
        <div key={year} className="mt-8">
          <div className="flex items-center mb-2">
            <span className="text-2xl font-bold text-gray-800 dark:text-white pr-4 whitespace-nowrap">
              {year}
            </span>
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
          </div>
          <ul className="divide-y dark:divide-gray-700">
            {groupedPosts[year].map((p) => (
              <PostListItem
                key={p.id}
                post={p}
                color={colors[p.id] || ''}
                canEditColor={isAdmin && !colorError}
                onColorSaved={(color) => setColors(current => ({ ...current, [p.id]: color }))}
              />
            ))}
          </ul>
        </div>
      ))}

      {posts.length === 0 && (
        <ul className="divide-y dark:divide-gray-700">
          <li className="py-8 text-gray-500 dark:text-gray-400">There are no posts yet.</li>
        </ul>
      )}
    </div>
  )
}