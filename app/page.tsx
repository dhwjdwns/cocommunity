'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Image
        src="/images/home_image_02.png"
        alt="main"
        width={4000}
        height={4000}
        onClick={() => router.push('/login')}
        className="cursor-pointer transition-transform hover:scale-105"
      />
    </div>
  )
}
