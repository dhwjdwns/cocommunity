'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

const palette = [
  { value: '', label: '기본' },
  { value: '#fef3c7', label: '노랑' },
  { value: '#fce7f3', label: '분홍' },
  { value: '#dbeafe', label: '파랑' },
  { value: '#dcfce7', label: '초록' },
  { value: '#ede9fe', label: '보라' },
] as const

type Props = {
  post: { id: number; title: string; created_at: string }
  color: string
  canEditColor: boolean
  onColorSaved: (color: string) => void
}

export default function PostListItem({ post, color, canEditColor, onColorSaved }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const background = palette.find(option => option.value === color)?.value || ''

  async function saveColor(nextColor: string) {
    if (!canEditColor || saving || nextColor === color) return
    setSaving(true)
    setError('')
    try {
      // Returning the affected row also catches writes rejected by row-level security.
      const result = nextColor
        ? await supabase.from('post_backgrounds')
            .upsert({ post_id: post.id, color: nextColor }, { onConflict: 'post_id' })
            .select('post_id').single()
        : await supabase.from('post_backgrounds').delete()
            .eq('post_id', post.id).select('post_id').single()
      if (result.error) throw result.error
      onColorSaved(nextColor)
    } catch {
      setError('배경색을 저장하지 못했습니다. 권한과 연결을 확인한 뒤 다시 시도해 주세요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <li className={`py-3 space-y-2 ${background ? 'px-3 rounded' : ''}`}
      style={background ? { backgroundColor: background, color: '#171717' } : undefined}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link href={`/post/${post.id}`} className="text-lg font-semibold hover:underline break-words">
            {post.title || '(Untitled)'}
          </Link>
          <div className={`text-sm ${background ? 'text-gray-600' : 'text-gray-500 dark:text-gray-400'}`}>
            {new Date(new Date(post.created_at).getTime() + 9 * 60 * 60 * 1000).toLocaleString('en-US')}
          </div>
        </div>
        {canEditColor && (
          <label className="flex items-center gap-2 text-sm shrink-0">
            배경색
            <select aria-label={`${post.title || '제목 없는 글'} 배경색`}
              value={background} disabled={saving}
              onChange={event => void saveColor(event.target.value)}
              className="border border-gray-400 rounded px-2 py-1 bg-white text-gray-900 disabled:opacity-50">
              {palette.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            {saving && <span role="status">저장 중…</span>}
          </label>
        )}
      </div>
      {error && <p role="alert" className={background ? 'text-sm text-red-800' : 'text-sm text-red-600 dark:text-red-400'}>{error}</p>}
    </li>
  )
}
