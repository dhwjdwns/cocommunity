'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function WritePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    })()
  }, [router])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      let image_url: string | null = null
      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const { error: upErr } = await supabase.storage
          .from('post-images')
          .upload(fileName, file, { upsert: false })
        if (upErr) throw upErr

        const { data: pub } = supabase.storage.from('post-images').getPublicUrl(fileName)
        image_url = pub.publicUrl
      }

      const { data, error: insErr } = await supabase
        .from('posts')
        .insert({ user_id: user.id, title, content, image_url })
        .select('id')
        .single()
      if (insErr) throw insErr

      router.push(`/post/${data!.id}`)
    } catch (e: any) {
      setError(e.message || 'Error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Write</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          className="w-full border rounded p-2"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="w-full border rounded p-2 min-h-[200px]"
          placeholder="Enter the text content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <div>
          <label className="block text-sm text-gray-600 mb-1">Add Photo (Optional)</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
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
