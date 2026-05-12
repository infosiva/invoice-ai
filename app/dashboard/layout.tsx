import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/session'
import Link from 'next/link'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="text-lg font-black tracking-tight">
            Deal<span className="text-violet-400">Flow</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm">{user.email}</span>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="text-slate-500 hover:text-white text-sm transition-colors">
                Log out
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
