'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

type CommentTree = RawComment & { children: CommentTree[] }

function nest(comments: RawComment[]) {
  const map = new Map<number, CommentTree>()
  const roots: CommentTree[] = []
  comments.forEach(c => map.set(c.id, { ...c, children: [] }))
  comments.forEach(c => {
    const node = map.get(c.id)!
    if (c.parent_id && map.get(c.parent_id)) map.get(c.parent_id)!.children.push(node)
    else roots.push(node)
  })
  return roots
}

export default function Comments({ postId }: { postId: number }) {
  const [list, setList] = useState<RawComment[]>([])
  const [content, setContent] = useState('')
  const [me, setMe] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const submitLock = useRef(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setMe(user?.id ?? null)
    })()
  }, [])

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles:profiles(display_name)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    setList((data as RawComment[]) || [])
  }, [postId])

  useEffect(() => { void load() }, [load])
  const tree = useMemo(() => nest(list), [list])

  async function submit() {
    if (!content.trim() || submitLock.current) return
    submitLock.current = true
    setSubmitting(true)
    setSubmitError('')
    try {
      await insertComment(postId, content, null)
      setContent('')
      await load()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to post comment. Please try again.')
    } finally {
      submitLock.current = false
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-8">
      <h2 className="font-semibold mb-2">Comments</h2>

      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 border rounded p-2"
          placeholder="Enter comment..."
          aria-label="New comment"
          disabled={submitting}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) submit()
          }}
        />
        <button disabled={submitting || !content.trim()} onClick={() => void submit()} className="px-3 py-2 bg-gray-900 text-white rounded disabled:opacity-50">
          {submitting ? 'Sending…' : 'go'}
        </button>
      </div>

      {submitError && <p role="alert" className="mb-4 text-sm text-red-600">{submitError}</p>}
      <ul className="space-y-4">
        {tree.map((c) => <CommentNode key={c.id} c={c} me={me} editingId={editingId} setEditingId={setEditingId} load={load} />)}
        {tree.length === 0 && <li className="text-gray-500">Be the first comment.</li>}
      </ul>
    </div>
  )
}

// Keep comment nodes outside Comments so typing does not remount inputs or interrupt IME.
function CommentNode({ c, isChild = false, me, editingId, setEditingId, load }: {
  c: CommentTree
  isChild?: boolean
  me: string | null
  editingId: number | null
  setEditingId: (id: number | null) => void
  load: () => Promise<void>
}) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [replyError, setReplyError] = useState('')
  const [sending, setSending] = useState(false)
  const replyLock = useRef(false)

  async function sendReply() {
    if (!replyContent.trim() || replyLock.current) return
    replyLock.current = true
    setSending(true)
    setReplyError('')
    try {
      await insertComment(c.post_id, replyContent, c.id)
      setReplyContent('')
      setReplyOpen(false)
      await load()
    } catch (error) {
      setReplyError(error instanceof Error ? error.message : 'Failed to post reply. Please try again.')
    } finally {
      replyLock.current = false
      setSending(false)
    }
  }
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
        {c.profiles?.display_name || 'anonymity'} · {new Date(c.created_at).toLocaleString()}
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
            <button onClick={saveLocal} className="px-3 py-1 bg-blue-600 text-white rounded">save</button>
            <button onClick={() => setEditingId(null)} className="px-3 py-1 border rounded">cancel</button>
          </div>
        </div>
      ) : (
        <div className="whitespace-pre-wrap">{c.content}</div>
      )}

      <div className="flex items-center gap-3 text-sm">
        {!isEditing && (
          <button className="text-blue-600" aria-expanded={replyOpen} aria-controls={`reply-${c.id}`} onClick={() => setReplyOpen(true)}>Reply</button>
        )}
        {isOwner && !isEditing && (
          <>
            <button className="text-gray-600" onClick={() => setEditingId(c.id)}>Edit</button>
            <button
              className="text-red-600"
              onClick={async () => {
                if (!confirm('Do you want to delete this comment?')) return
                const { error } = await supabase.from('comments').delete().eq('id', c.id)
                if (!error) load(); else alert(error.message)
              }}
            >
              Delete
            </button>
          </>
        )}
      </div>

      {replyOpen && (
        <div id={`reply-${c.id}`} className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <input
              autoFocus
              aria-label={`Reply to ${c.profiles?.display_name || 'anonymity'}`}
              className="min-w-0 flex-1 border rounded p-2"
              placeholder="Enter reply..."
              value={replyContent}
              disabled={sending}
              onChange={event => setReplyContent(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                  event.preventDefault()
                  void sendReply()
                }
                if (event.key === 'Escape' && !event.nativeEvent.isComposing && !sending) setReplyOpen(false)
              }}
            />
            <button disabled={sending || !replyContent.trim()} onClick={() => void sendReply()}
              className="px-3 py-2 bg-gray-900 text-white rounded disabled:opacity-50">
              {sending ? 'Sending…' : 'go'}
            </button>
            <button disabled={sending} className="px-3 py-2 rounded border disabled:opacity-50"
              onClick={() => setReplyOpen(false)}>cancel</button>
          </div>
          {replyError && <p role="alert" className="text-sm text-red-600">{replyError}</p>}
        </div>
      )}

      {c.children?.length > 0 && (
        <ul className="mt-2 space-y-3">
          {c.children.map((cc) => (
            <CommentNode key={cc.id} c={cc} isChild me={me} editingId={editingId} setEditingId={setEditingId} load={load} />
          ))}
        </ul>
      )}
    </li>
  )
}

async function insertComment(postId: number, content: string, parentId: number | null) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Please log in again to post a comment.')
  const { error } = await supabase.from('comments').insert({
    post_id: postId, user_id: user.id, content: content.trim(), parent_id: parentId,
  })
  if (error) throw new Error('Failed to save. Please check your connection and try again.')
}
