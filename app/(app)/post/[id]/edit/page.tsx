'use client'

import { useEffect, useRef, useState, ChangeEvent, FormEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import remarkBreaks from 'remark-breaks'

type PostRow = { title: string; content: string; user_id: string }

export default function EditPostPage() {
  const params = useParams() as { id: string }
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      const { data: post, error } = await supabase
        .from('posts')
        .select('title, content, user_id')
        .eq('id', Number(params.id))
        .single<PostRow>()
      if (error) {
        router.push('/home')
        return
      }
      if (post.user_id !== session.user.id) {
        router.push(`/post/${params.id}`)
        return
      }
      setTitle(post.title)
      setContent(post.content ?? '')
      setLoading(false)
    })()
  }, [params.id, router])

  function insertAtCursor(text: string) {
    const ta = textareaRef.current
    if (!ta) {
      setContent((prev) => prev + text)
      return
    }
    const start = ta.selectionStart ?? ta.value.length
    const end = ta.selectionEnd ?? ta.value.length
    const before = ta.value.slice(0, start)
    const after = ta.value.slice(end)
    const next = before + text + after
    setContent(next)
    requestAnimationFrame(() => {
      ta.focus()
      const caret = start + text.length
      ta.setSelectionRange(caret, caret)
    })
  }

  async function uploadImagesAndInsert(files: FileList | null) {
    if (!files || files.length === 0) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop() || 'png'
      const fileName = `${user.id}-${Date.now()}-${crypto.randomUUID()}.${ext}`
      const { error: upErr } = await supabase.storage.from('post-images').upload(fileName, file)
      if (upErr) {
        alert(upErr.message)
        continue
      }
      const { data: pub } = supabase.storage.from('post-images').getPublicUrl(fileName)
      if (pub?.publicUrl) insertAtCursor(`\n![image](${pub.publicUrl})\n`)
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase
        .from('posts')
        .update({ title, content }) // image_url no longer needed for markdown flow
        .eq('id', Number(params.id))
      if (error) throw error
      router.push(`/post/${params.id}`)
    } catch (err: any) {
      alert(err.message || 'Save error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6">Loading…</div>

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Writing</h1>
        <div className="flex gap-2">
          <label className="px-3 py-1 border rounded text-sm cursor-pointer">
            Upload Image
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) => uploadImagesAndInsert(e.target.files)}
            />
          </label>
          <button
            type="button"
            className="px-3 py-1 border rounded text-sm"
            onClick={() => setPreview((p) => !p)}
          >
            {preview ? 'Edit' : 'Preview'}
          </button>
        </div>
      </div>

      <form onSubmit={save} className="space-y-4">
        <input
          className="w-full border rounded p-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {!preview ? (
          <textarea
            ref={textareaRef}
            className="w-full border rounded p-2 min-h-[240px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        ) : (
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
              {content}
            </ReactMarkdown>
          </div>
        )}

        <div className="space-x-2">
          <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={() => router.push(`/post/${params.id}`)} className="px-4 py-2 border rounded">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
