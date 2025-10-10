'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Comments from '@/components/Comments'
import Link from 'next/link'

type Post = {
  id: number
  title: string
  content: string
  image_url: string | null
  created_at: string
  user_id: string
}

export default function PostDetailPage() {
  const router = useRouter()
  const params = useParams() as { id: string }
  const [post, setPost] = useState<Post | null>(null)
  const [me, setMe] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return router.push('/login')
      const { data: profile } = await supabase
        .from('profiles').select('status').eq('id', session.user.id).single()
      if (profile?.status !== 'approved') return router.push('/pending')
      setMe(session.user.id)

      const { data } = await supabase.from('posts').select('*').eq('id', Number(params.id)).single()
      setPost(data as any)
    })()
  }, [params.id, router])

  async function deletePost() {
    if (!post) return
    if (!confirm('이 글을 삭제할까요?')) return
    const { error } = await supabase.from('posts').delete().eq('id', post.id)
    if (!error) router.push('/home')
    else alert(error.message)
  }

  if (!post) return <div className="p-6">불러오는 중…</div>

  const canEdit = me === post.user_id

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{post.title}</h1>
          <div className="text-sm text-gray-500">{new Date(post.created_at).toLocaleString()}</div>
          <p className="text-sm text-gray-500">
            작성자: <Link href={`/profile/${post.user_id}`} className="text-blue-600 hover:underline">
              프로필 보기
            </Link>
          </p>
        </div>
        {canEdit && (
          <div className="shrink-0 space-x-2">
            <button
              onClick={() => router.push(`/post/${post.id}/edit`)}
              className="px-3 py-1 rounded border"
            >
              수정
            </button>
            <button
              onClick={deletePost}
              className="px-3 py-1 rounded bg-red-600 text-white"
            >
              삭제
            </button>
          </div>
        )}
      </div>
      {post.image_url && (
        <div className="relative w-full h-64">
          {/* 외부 URL이므로 next/image width/height 지정 대신 fill 사용 + unoptimized */}
          <Image src={post.image_url} alt="post image" fill className="object-contain" unoptimized />
        </div>
      )}
      <div className="whitespace-pre-wrap">{post.content}</div>
      {/* ... */}
      <Comments postId={post.id} />
    </div>
  )
  // return (
  //   <div className="max-w-2xl mx-auto p-6 space-y-4">
      
  //     <h1 className="text-2xl font-bold">{post.title}</h1>
  //     <div className="text-sm text-gray-500">{new Date(post.created_at).toLocaleString()}</div>
      // {post.image_url && (
      //   <div className="relative w-full h-64">
      //     {/* 외부 URL이므로 next/image width/height 지정 대신 fill 사용 + unoptimized */}
      //     <Image src={post.image_url} alt="post image" fill className="object-contain" unoptimized />
      //   </div>
      // )}
  //     <div className="whitespace-pre-wrap">{post.content}</div>

  //     {/* 댓글 컴포넌트 */}
  //     <Comments postId={post.id} />
  //   </div>
  // )
}
