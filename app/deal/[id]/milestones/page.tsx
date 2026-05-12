import { redirect, notFound } from 'next/navigation'
import { getSessionUser } from '@/lib/session'
import { db } from '@/lib/db'

const MS_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-slate-700 text-slate-300',
  SUBMITTED: 'bg-yellow-900/40 text-yellow-300',
  APPROVED: 'bg-green-900/40 text-green-300',
  REJECTED: 'bg-red-900/40 text-red-300',
}

export default async function MilestonesPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const deal = await db.deal.findFirst({
    where: {
      id: params.id,
      OR: [{ vendorId: user.id }, { clientId: user.id }],
    },
    include: { milestones: { orderBy: { dueDate: 'asc' } } },
  })

  if (!deal) notFound()

  const isVendor = deal.vendorId === user.id

  return (
    <div className="pb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">Milestones</h2>
          <p className="text-slate-400 text-sm mt-0.5">Track deliverables and proof uploads</p>
        </div>
        {isVendor && (
          <button className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
            + Add milestone
          </button>
        )}
      </div>

      {deal.milestones.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
          <p className="text-slate-400 text-sm">No milestones yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deal.milestones.map(ms => (
            <div key={ms.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-white">{ms.title}</h3>
                  {ms.description && (
                    <p className="text-slate-400 text-sm mt-1">{ms.description}</p>
                  )}
                  {ms.dueDate && (
                    <p className="text-slate-500 text-xs mt-2">
                      Due {new Date(ms.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${MS_STATUS_COLORS[ms.status] ?? 'bg-slate-700 text-slate-300'}`}>
                  {ms.status}
                </span>
              </div>

              {ms.status === 'PENDING' && isVendor && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <button className="text-violet-400 hover:text-violet-300 text-sm font-semibold transition-colors">
                    Upload proof →
                  </button>
                </div>
              )}

              {ms.status === 'SUBMITTED' && !isVendor && (
                <div className="mt-4 pt-4 border-t border-slate-800 flex gap-3">
                  <button className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                    Approve ✓
                  </button>
                  <button className="bg-red-900/30 hover:bg-red-900/50 text-red-400 text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                    Request revision
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
