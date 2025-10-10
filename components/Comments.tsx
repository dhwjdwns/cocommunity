'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type RawComment = {
  id: number
  post_id: number
  user_id: string
  content: string
  parent_id: number | null
  created_at: string
  profiles: { display_name: string | null } | null
}

function nest(comments: RawComment[]) {
  const map = new Map<number, any>()
  const roots: any[] = []
  comments.forEach(c => map.set(c.id, { ...c, children: [] }))
  comments.forEach(c => {
    const node = map.get(c.id)
    if (c.parent_id && map.get(c.parent_id)) map.get(c.parent_id).children.push(node)
    else roots.push(node)
  })
  return roots
}

export default function Comments({ postId }: { postId: number }) {
  const [list, setList] = useState<RawComment[]>([])
  const [content, setContent] = useState('')
  const [replyFor, setReplyFor] = useState<number | null>(null)
  const [me, setMe] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setMe(user?.id ?? null)
    })()
  }, [])

  async function load() {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles:profiles(display_name)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    setList((data as RawComment[]) || [])
  }

  useEffect(() => { load() }, [postId])
  const tree = useMemo(() => nest(list), [list])

  async function submit(parent_id: number | null = null) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    if (!content.trim()) return
    await supabase.from('comments').insert({ post_id: postId, user_id: user.id, content, parent_id })
    setContent('')
    setReplyFor(null)
    load()
  }

  function CommentNode({ c, isChild = false }: { c: any; isChild?: boolean }) {
    const isOwner = me === c.user_id
    const isEditing = editingId === c.id
    const inputRef = useRef<HTMLInputElement>(null)

    async function saveLocal() {
      const val = inputRef.current?.value ?? ''
      if (!val.trim()) return
      const { error } = await supabase.from('comments').update({ content: val }).eq('id', c.id)
      if (!error) {
        setEditingId(null)
        load()
      } else {
        alert(error.message)
      }
    }

    return (
      <li className={isChild ? 'pl-3 border-l space-y-2' : 'border rounded p-3 space-y-2'}>
        <div className="text-sm text-gray-500">
          {c.profiles?.display_name || '익명'} · {new Date(c.created_at).toLocaleString()}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <input
              ref={inputRef}
              defaultValue={c.content}             // ✅ uncontrolled input (IME 깨짐 없음)
              className="w-full border rounded p-2"
              autoFocus
              onFocus={(e) => {
                const input = e.currentTarget
                const len = input.value.length
                // 렌더 직후 커서를 끝으로
                requestAnimationFrame(() => input.setSelectionRange(len, len))
              }}
              // 필요하면 Enter=저장, Esc=취소도 지원
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) saveLocal()
                if (e.key === 'Escape') setEditingId(null)
              }}
            />
            <div className="space-x-2">
              <button onClick={saveLocal} className="px-3 py-1 bg-blue-600 text-white rounded">저장</button>
              <button onClick={() => setEditingId(null)} className="px-3 py-1 border rounded">취소</button>
            </div>
          </div>
        ) : (
          <div className="whitespace-pre-wrap">{c.content}</div>
        )}

        <div className="flex items-center gap-3 text-sm">
          {/* 대댓글에는 답글 달기 숨김 */}
          {!isChild && !isEditing && (
            <button className="text-blue-600" onClick={() => setReplyFor(c.id)}>답글 달기</button>
          )}
          {isOwner && !isEditing && (
            <>
              <button className="text-gray-600" onClick={() => setEditingId(c.id)}>수정</button>
              <button
                className="text-red-600"
                onClick={async () => {
                  if (!confirm('이 댓글을 삭제할까요?')) return
                  const { error } = await supabase.from('comments').delete().eq('id', c.id)
                  if (!error) load(); else alert(error.message)
                }}
              >
                삭제
              </button>
            </>
          )}
        </div>

        {c.children?.length > 0 && (
          <ul className="mt-2 space-y-3">
            {c.children.map((cc: any) => (
              <CommentNode key={cc.id} c={cc} isChild />
            ))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <div className="mt-8">
      <h2 className="font-semibold mb-2">댓글</h2>

      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 border rounded p-2"
          placeholder={replyFor ? '대댓글 입력...' : '댓글 입력...'}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) submit(replyFor)
          }}
        />
        <button onClick={() => submit(replyFor)} className="px-3 py-2 bg-gray-900 text-white rounded">
          등록
        </button>
        {replyFor && (
          <button className="px-3 py-2 rounded border" onClick={() => setReplyFor(null)}>
            취소
          </button>
        )}
      </div>

      <ul className="space-y-4">
        {tree.map((c: any) => <CommentNode key={c.id} c={c} />)}
        {tree.length === 0 && <li className="text-gray-500">첫 댓글을 남겨보세요.</li>}
      </ul>
    </div>
  )
}
