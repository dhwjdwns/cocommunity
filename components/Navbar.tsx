'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useNotifications } from '@/app/hook/useNotifications'

export default function NavBar() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | undefined>(undefined)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      const { data } = await supabase.auth.getSession()
      if (mounted) setUserId(data.session?.user?.id)
    })()
    
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setUserId(session?.user?.id)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // 알림 훅 사용
  const { items, unread, removeOne, clearAll } = useNotifications(userId)

  // 드롭다운
  const [open, setOpen] = useState(false)
  const toggle = () => setOpen(o => !o)
  const close = () => setOpen(false)

  // 로그아웃
  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  // 메시지 생성
  function getMessage(n: { title?: string | null; body?: string | null }) {
    if (n.title && n.title.trim().length > 0) return n.title
    return (n.body ?? '').slice(0, 80)
  }

  // 알림 클릭
  async function go(n: { id: string; link: string | null }) {
    await removeOne(n.id)
    close()
    router.push(n.link ?? '#')
  }

  // 전체 삭제
  async function clearAllLocal() {
    await clearAll()
  }

  return (
    <nav className="bg-white sticky top-0 z-20">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* 로고 */}
        <Link href="/home" className="text-lg font-bold text-blue-600 hover:text-blue-800">
          <Image
            src="/images/logo_01.png"
            alt="하나 그리고 다음 로고"
            width={250}
            height={120}
            priority
          />
        </Link>

        

          {/* 글쓰기 버튼 */}
          <Link href="/write">
            <Image
              src="/images/logo_03.png"
              alt="글쓰기 버튼"
              width={200}
              height={40}
              className="hover:opacity-80 transition-opacity duration-200"
            />
          </Link>

          {/* 버튼 영역 */}
        <div className="flex items-center space-x-3 relative">
          {/* 🔔 알림 벨 */}
          <div className="relative">
            <button
              onClick={toggle}
              className="relative rounded-full p-2 hover:bg-gray-100"
              aria-label="알림"
            >
              <Image
                src="/images/notifi_button.png" // 🔔 대신 네가 그린 그림 경로
                alt="알림 아이콘"
                width={55} // 사이즈 조정 가능
                height={28}
                className="hover:opacity-80 transition-opacity duration-200"
              />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 text-xs bg-red-500 text-white rounded-full px-1">
                  {unread}
                </span>
              )}
            </button>

            {/* 드롭다운 */}
            {open && (
              <div
                className="absolute right-0 mt-2 w-80 rounded-2xl shadow-lg bg-white border z-30"
                onMouseLeave={close}
              >
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="font-medium">Notification</span>
                  <button
                    onClick={clearAllLocal}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Clear All
                  </button>
                </div>

                <ul className="max-h-96 overflow-auto divide-y">
                  {(items?.length ?? 0) === 0 && (
                    <li className="p-3 text-sm text-gray-500">No Notification</li>
                  )}
                  {items?.map(n => (
                    <li key={n.id} className="p-0">
                      <Link
                        href={n.link ?? '#'}
                        className="block p-3 hover:bg-gray-50"
                        onClick={async (e) => {
                          e.preventDefault()
                          await go(n)
                        }}
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            {getMessage(n)}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 로그아웃 버튼 */}
          <button onClick={logout}>
            <Image
              src="/images/Leave_button.png"
              alt="로그아웃 버튼"
              width={160}
              height={40}
              className="hover:opacity-80 transition-opacity duration-200"
            />
          </button>
        </div>
      </div>
    </nav>
  )
}
