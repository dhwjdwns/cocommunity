'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type PublicProfile = {
  id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

type Post = { id: number; title: string; created_at: string }

export default function OtherProfilePage() {
  const { id } = useParams() as { id: string }   // user_id (uuid)
  const router = useRouter()

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      // 로그인/승인 확인 (선택: 네 앱 흐름에 맞춰 유지)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      // 프로필(공개용 뷰에서)
      const { data: pp, error: pErr } = await supabase
        .from('public_profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (pErr || !pp) {
        setLoading(false)
        return
      }
      setProfile(pp as PublicProfile)

      // 이 유저가 쓴 글
      const { data: ps } = await supabase
        .from('posts')
        .select('id,title,created_at')
        .eq('user_id', id)
        .order('created_at', { ascending: false })

      setPosts(ps || [])
      setLoading(false)
    })()
  }, [id, router])

  if (loading) return <div className="p-8">불러오는 중...</div>
  if (!profile) return <div className="p-8">프로필을 찾을 수 없습니다.</div>

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">프로필</h1>

      <div className="space-y-2">
        {profile.avatar_url && (
          <img
            src={profile.avatar_url}
            alt="avatar"
            className="w-20 h-20 rounded-full object-cover"
          />
        )}
        <p><strong>닉네임:</strong> {profile.display_name || '이름 없음'}</p>
        <p><strong>가입일:</strong> {new Date(profile.created_at).toLocaleDateString()}</p>
      </div>

      <hr className="my-6" />

      <div>
        <h2 className="text-xl font-semibold mb-3">작성한 글</h2>
        {posts.length > 0 ? (
          <ul className="list-disc pl-5 space-y-2">
            {posts.map(p => (
              <li
                key={p.id}
                className="cursor-pointer text-blue-600 hover:underline"
                onClick={() => router.push(`/post/${p.id}`)}
              >
                {p.title}
                <span className="text-gray-500 text-sm ml-2">
                  ({new Date(p.created_at).toLocaleDateString()})
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">작성한 글이 없습니다.</p>
        )}
      </div>
    </div>
  )
}
