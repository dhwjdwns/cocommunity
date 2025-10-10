'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function EditPostPage() {
  const params = useParams() as { id: string }
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return router.push('/login')
      const { data: post, error } = await supabase
        .from('posts')
        .select('title, content, user_id')
        .eq('id', Number(params.id))
        .single()
      if (error) return router.push('/home')
      if (post.user_id !== session.user.id) return router.push(`/post/${params.id}`)
      setTitle(post.title)
      setContent(post.content)
      setLoading(false)
    })()
  }, [params.id, router])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase
      .from('posts')
      .update({ title, content })
      .eq('id', Number(params.id))
    if (error) alert(error.message)
    else router.push(`/post/${params.id}`)
  }

  if (loading) return <div className="p-6">불러오는 중…</div>

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">글 수정</h1>
      <form onSubmit={save} className="space-y-4">
        <input
          className="w-full border rounded p-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="w-full border rounded p-2 min-h-[200px]"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <div className="space-x-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">저장</button>
          <button type="button" onClick={() => router.push(`/post/${params.id}`)} className="px-4 py-2 border rounded">취소</button>
        </div>
      </form>
    </div>
  )
}
