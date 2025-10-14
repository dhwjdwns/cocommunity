'use client'

import { useEffect, useRef, useState, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Image from 'next/image'

export default function WritePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('') // markdown body
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return router.push('/login')

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (!error && profile && profile.status !== 'approved') {
        router.push('/pending')
      }
    })()
  }, [router])

  /** insert text at current cursor position in textarea */
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

  /** upload selected images to Supabase and insert markdown image tags */
  async function uploadImagesAndInsert(files: FileList | null) {
    if (!files || files.length === 0) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop() || 'png'
      const fileName = `${user.id}-${Date.now()}-${crypto.randomUUID()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('post-images').upload(fileName, file)
      if (uploadError) {
        alert(uploadError.message)
        continue
      }
      const { data: pub } = supabase.storage.from('post-images').getPublicUrl(fileName)
      if (pub?.publicUrl) insertAtCursor(`\n![image](${pub.publicUrl})\n`)
    }
  }

  /** handle form submission */
  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      const { data, error: insertError } = await supabase
        .from('posts')
        .insert({ user_id: user.id, title, content, image_url: null })
        .select('id')
        .single()

      if (insertError) throw insertError
      router.push(`/post/${data!.id}`)
    } catch (e: any) {
      setError(e.message || 'An error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Write</h1>
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

      <form onSubmit={onSubmit} className="space-y-4">
        <input
          className="w-full border rounded p-2"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {!preview ? (
          <textarea
            ref={textareaRef}
            className="w-full border rounded p-2 min-h-[240px]"
            placeholder="Write your post."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        ) : (
          <div className="prose max-w-none border rounded p-3">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                img: (props) => {
                  const src = (props.src as string) || '' // <-- fix red underline
                  const alt = props.alt || ''
                  return (
                    <span className="block relative">
                      <Image
                        src={src}
                        alt={alt}
                        width={800}
                        height={600}
                        className="rounded"
                        unoptimized
                      />
                    </span>
                  )
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}

        {error && <p className="text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Upload'}
        </button>
      </form>
    </div>
  )
}
