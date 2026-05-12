import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/session'
import { db } from '@/lib/db'
import Link from 'next/link'

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING_CLIENT: 'Awaiting client',
  SCOPE_AGREED: 'Scope agreed',
  IN_PROGRESS: 'In progress',
  INVOICED: 'Invoiced',
  PAID: 'Paid',
  DISPUTED: 'Disputed',
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-700 text-slate-300',
  PENDING_CLIENT: 'bg-yellow-900/40 text-yellow-300',
  SCOPE_AGREED: 'bg-blue-900/40 text-blue-300',
  IN_PROGRESS: 'bg-violet-900/40 text-violet-300',
  INVOICED: 'bg-orange-900/40 text-orange-300',
  PAID: 'bg-green-900/40 text-green-300',
  DISPUTED: 'bg-red-900/40 text-red-300',
}

export default async function DashboardPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const deals = await db.deal.findMany({
    where: { vendorId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { milestones: true, messages: true } },
    },
  })

  const stats = {
    total: deals.length,
    active: deals.filter(d => ['SCOPE_AGREED', 'IN_PROGRESS'].includes(d.status)).length,
    paid: deals.filter(d => d.status === 'PAID').length,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Your Deals</h1>
          <p className="text-slate-400 text-sm mt-1">Manage proposals, milestones, and payments</p>
        </div>
        <Link
          href="/deal/new"
          className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          + New deal
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total deals', value: stats.total },
          { label: 'Active', value: stats.active },
          { label: 'Paid', value: stats.paid },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-3xl font-black text-white">{s.value}</p>
            <p className="text-slate-400 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Deal list */}
      {deals.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <p className="text-slate-400 mb-4">No deals yet.</p>
          <Link href="/deal/new" className="text-violet-400 hover:underline text-sm">Create your first deal →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {deals.map(deal => (
            <Link
              key={deal.id}
              href={`/deal/${deal.id}`}
              className="block bg-slate-900 border border-slate-800 hover:border-violet-800/60 rounded-2xl p-5 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate">{deal.title}</h3>
                  {deal.clientEmail && (
                    <p className="text-slate-400 text-sm mt-0.5">{deal.clientEmail}</p>
                  )}
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_COLORS[deal.status] ?? 'bg-slate-700 text-slate-300'}`}>
                  {STATUS_LABELS[deal.status] ?? deal.status}
                </span>
              </div>
              <div className="flex gap-4 mt-3 text-xs text-slate-500">
                <span>{deal._count.milestones} milestones</span>
                <span>{deal._count.messages} messages</span>
                {deal.totalAmount && (
                  <span className="text-slate-300 font-semibold">
                    ${Number(deal.totalAmount).toLocaleString()}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
