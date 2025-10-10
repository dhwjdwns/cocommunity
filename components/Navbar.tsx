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
        <Link href="/home" className="text-lg font-bold text-blue-600 hover:text-blue-800">
          <Image
            src="/images/logo_01.png"        // public 폴더 안의 파일 이름
            alt="하나 그리고 다음 로고" // 대체 텍스트
            width={250}             // 이미지 가로 크기(px)
            height={120}             // 세로 크기(px)
            priority                // (선택) 첫 로딩 시 우선적으로 불러옴
          />
        </Link>
        <div className="space-x-3">
          <Link
            href="/write"
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            글쓰기
          </Link>
          <button
            onClick={logout}
            className="px-3 py-1 border rounded text-gray-700 hover:bg-gray-100"
          >
            로그아웃
          </button>
        </div>
      </div>
    </nav>
  )
}
