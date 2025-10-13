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
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return setError(error.message)
    router.push('/home') // 홈에서 승인 체크
  }

  async function onSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // ✅ 동의 확인 (간단 confirm 창)
    const agree = confirm(
      `회원가입을 위해 아래의 개인정보 수집·이용 및 서비스 약관에 동의해 주세요.
    
      수집 항목: 이메일, 비밀번호(암호화 저장)
      이용 목적: 회원 식별·인증, 서비스 제공, 보안 및 부정 이용 방지
      보유 기간: 회원 탈퇴 시까지 또는 관련 법령에 따른 보존 기간
      동의 거부 권리: 동의하지 않을 수 있으나, 이 경우 회원가입이 제한됩니다.
      또한 서비스 이용약관 및 운영정책에도 동의합니다.
      
      위 내용에 동의하십니까?`
    )
    if (!agree) return // 취소 시 종료

    const now = new Date().toISOString()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          agreed_tos_at: now,
          agreed_privacy_at: now,
        },
      },
    })
    if (error) return setError(error.message)
    router.push('/pending') // 승인 대기 안내
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={onLogin} className="bg-white p-6 rounded-xl shadow-md w-80">
        <h2 className="text-2xl font-semibold mb-4 text-center">Log in</h2>
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 mb-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 mb-4 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">
          Log in
        </button>
        <button
          onClick={onSignup}
          className="w-full bg-gray-200 mt-2 py-2 rounded hover:bg-gray-300"
        >
          Sign up
        </button>
        {error && <p className="text-red-500 text-center mt-2">{error}</p>}
      </form>
    </div>
  )
}
