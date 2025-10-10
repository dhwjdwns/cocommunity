'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function onLogin(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return setError(error.message)
    router.push('/home') // 홈에서 승인 체크함
  }

  async function onSignup(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) return setError(error.message)
    router.push('/pending') // 승인 대기 안내
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={onLogin} className="bg-white p-6 rounded-xl shadow-md w-80">
        <h2 className="text-2xl font-semibold mb-4 text-center">로그인</h2>
        <input
          type="email"
          placeholder="이메일"
          className="w-full p-2 mb-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="비밀번호"
          className="w-full p-2 mb-4 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">
          로그인
        </button>
        <button
          onClick={onSignup}
          className="w-full bg-gray-200 mt-2 py-2 rounded hover:bg-gray-300"
        >
          회원가입
        </button>
        {error && <p className="text-red-500 text-center mt-2">{error}</p>}
      </form>
    </div>
  )
}
