import NavBar from '@/components/Navbar'

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      <main className="max-w-3xl mx-auto p-4">{children}</main>
    </>
  )
}
