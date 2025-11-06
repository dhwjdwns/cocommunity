'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { supabase } from '@/lib/supabaseClient'
import Comments from '@/components/Comments' // <-- add this
import remarkBreaks from 'remark-breaks'

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
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', session.user.id)
        .single()
      if (profile?.status !== 'approved') { router.push('/pending'); return }
      setMe(session.user.id)

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', Number(params.id))
        .single()
      if (error) { router.push('/home'); return }
      setPost(data as Post)
    })()
  }, [params.id, router])

  async function deletePost() {
    if (!post) return
    if (!confirm('Delete?')) return
    const { error } = await supabase.from('posts').delete().eq('id', post.id)
    if (error) { alert(error.message); return }
    router.push('/home')
  }

  const hasMarkdownImage = useMemo(() => {
    if (!post?.content) return false
    return /!\[.*?\]\(.*?\)/.test(post.content)
  }, [post?.content])

  if (!post) return <div className="p-6">Loading…</div>

  const canEdit = me === post.user_id

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{post.title}</h1>
          <div className="text-sm text-gray-500">
            {new Date(new Date(post.created_at).getTime() + 9 * 60 * 60 * 1000).toLocaleString('en-US')}
          </div>
          <p className="text-sm text-gray-500">
            Written by:{' '}
            <Link href={`/profile/${post.user_id}`} className="text-blue-600 hover:underline">
              View Profile
            </Link>
          </p>
        </div>
        {canEdit && (
          <div className="shrink-0 space-x-2">
            <button onClick={() => router.push(`/post/${post.id}/edit`)} className="px-3 py-1 rounded border">
              Edit
            </button>
            <button onClick={deletePost} className="px-3 py-1 rounded bg-red-600 text-white">
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="max-w-none [&>p]:mb-3 [&>ul]:mb-3 [&>ol]:mb-3">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={{
            img: (props) => {
              const src = (props.src as string) || ''
              const alt = props.alt || ''
              return (
                <span className="block relative">
                  <Image src={src} alt={alt} width={1200} height={900} className="rounded" unoptimized />
                </span>
              )
            },
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>

      {!hasMarkdownImage && post.image_url && (
        <div className="relative w-full h-64">
          <Image src={post.image_url} alt="post image" fill className="object-contain" unoptimized />
        </div>
      )}

      {/* render comments here */}
      <Comments postId={post.id} /> {/* <-- un-comment and keep this */}
    </div>
  )
}
