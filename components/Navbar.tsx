'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'

export default function NavBar() {
  const router = useRouter()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav className="bg-white sticky top-0 z-10">
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

        {/* 버튼 영역 */}
        <div className="flex items-center space-x-3">
          {/* 글쓰기 버튼을 이미지로 */}
          <Link href="/write">
            <Image
              src="/images/logo_03.png"  // 🔹 글쓰기 버튼 이미지 파일
              alt="글쓰기 버튼"
              width={200}
              height={40}
              className="hover:opacity-80 transition-opacity duration-200"
            />
          </Link>

          {/* 로그아웃 버튼을 이미지로 */}
          <button onClick={logout}>
            <Image
              src="/images/Leave_button.png"  // 🔹 로그아웃 버튼 이미지 파일
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
