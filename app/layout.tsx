import './globals.css'

export const metadata = {
  title: 'Community',
  description: 'Hello',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 min-h-screen text-gray-900">
        {/* 초기화면(/)에는 네비바가 없음 */}
        <main className="max-w-3xl mx-auto p-4">{children}</main>
      </body>
    </html>
  )
}
