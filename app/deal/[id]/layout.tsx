import { redirect, notFound } from 'next/navigation'
import { getSessionUser } from '@/lib/session'
import { db } from '@/lib/db'
import Link from 'next/link'

const TABS = [
  { label: 'Scope', path: 'scope' },
  { label: 'Milestones', path: 'milestones' },
  { label: 'Messages', path: 'messages' },
  { label: 'Invoice', path: 'invoice' },
]

export default async function DealLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const deal = await db.deal.findFirst({
    where: {
      id: params.id,
      OR: [{ vendorId: user.id }, { clientId: user.id }],
    },
  })

  if (!deal) notFound()

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="text-lg font-black tracking-tight">
            Deal<span className="text-violet-400">Flow</span>
          </Link>
          <span className="text-slate-400 text-sm">{user.email}</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 pt-8">
        <div className="mb-6">
          <Link href="/dashboard" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
            ← Dashboard
          </Link>
          <h1 className="text-xl font-black text-white mt-2">{deal.title}</h1>
          {deal.clientEmail && (
            <p className="text-slate-400 text-sm mt-0.5">{deal.clientEmail}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-800 mb-8">
          {TABS.map(tab => (
            <Link
              key={tab.path}
              href={`/deal/${params.id}/${tab.path}`}
              className="px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white border-b-2 border-transparent hover:border-slate-600 transition-colors -mb-px"
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {children}
      </div>
    </div>
  )
}
