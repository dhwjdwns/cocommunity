'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'


type Post = { id: number; title: string; created_at: string }

export default function HomePage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
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
        .select('id,title,created_at')
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
          src="/images/logo_02.png"        // public 폴더 안의 파일 이름
          alt="하나 그리고 다음 로고" // 대체 텍스트
          width={3000}             // 이미지 가로 크기(px)
          height={120}             // 세로 크기(px)
          priority                // (선택) 첫 로딩 시 우선적으로 불러옴
        />
        <div className="space-x-3">
          {/* <Link href="/write" className="text-blue-600 hover:underline">글쓰기</Link>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-red-500">로그아웃</button> */}
        </div>
      </div>

      <ul className="divide-y">
        {posts.map(p => (
          <li key={p.id} className="py-3">
            <Link href={`/post/${p.id}`} className="text-lg font-semibold hover:underline">
              {p.title || '(제목 없음)'}
            </Link>
            <div className="text-sm text-gray-500">
              {new Date(p.created_at).toLocaleString()}
            </div>
          </li>
        ))}
        {posts.length === 0 && <li className="py-8 text-gray-500">아직 글이 없습니다.</li>}
      </ul>
    </div>
  )
}
