import { redirect, notFound } from 'next/navigation'
import { getSessionUser } from '@/lib/session'
import { db } from '@/lib/db'

export default async function ScopePage({ params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const deal = await db.deal.findFirst({
    where: {
      id: params.id,
      OR: [{ vendorId: user.id }, { clientId: user.id }],
    },
    include: { scopeItems: { orderBy: { order: 'asc' } } },
  })

  if (!deal) notFound()

  const isVendor = deal.vendorId === user.id
  const total = deal.scopeItems.reduce((sum, item) => sum + Number(item.unitPrice) * item.qty, 0)

  return (
    <div className="pb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">Scope</h2>
          <p className="text-slate-400 text-sm mt-0.5">Line items both parties agree to</p>
        </div>
        {isVendor && deal.status === 'DRAFT' && (
          <button className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
            + Add item
          </button>
        )}
      </div>

      {deal.scopeItems.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
          <p className="text-slate-400 text-sm">No scope items yet.</p>
          {isVendor && (
            <p className="text-slate-500 text-xs mt-2">Add line items to define what's included in this deal.</p>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 bg-slate-800/50 px-6 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
            <span className="col-span-6">Description</span>
            <span className="col-span-2 text-right">Qty</span>
            <span className="col-span-2 text-right">Unit price</span>
            <span className="col-span-2 text-right">Total</span>
          </div>
          {deal.scopeItems.map((item, i) => (
            <div
              key={item.id}
              className={`grid grid-cols-12 px-6 py-4 text-sm ${i % 2 === 0 ? '' : 'bg-slate-900/50'}`}
            >
              <span className="col-span-6 text-slate-300">{item.description}</span>
              <span className="col-span-2 text-right text-slate-400">{item.qty}</span>
              <span className="col-span-2 text-right text-slate-400">${Number(item.unitPrice).toLocaleString()}</span>
              <span className="col-span-2 text-right text-white font-semibold">
                ${(Number(item.unitPrice) * item.qty).toLocaleString()}
              </span>
            </div>
          ))}
          <div className="grid grid-cols-12 px-6 py-4 border-t border-slate-800 bg-slate-800/30">
            <span className="col-span-10 text-right text-slate-400 font-semibold text-sm">Total</span>
            <span className="col-span-2 text-right text-white font-black">${total.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Scope approval status */}
      {deal.scopeItems.length > 0 && (
        <div className="mt-6 p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Scope status</p>
              <p className="text-slate-400 text-xs mt-0.5">
                {deal.status === 'SCOPE_AGREED'
                  ? 'Both parties have agreed to this scope.'
                  : deal.status === 'PENDING_CLIENT'
                  ? 'Waiting for client to review and approve.'
                  : 'Scope is being prepared.'}
              </p>
            </div>
            {!isVendor && deal.status === 'PENDING_CLIENT' && (
              <button className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
                Approve scope ✓
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
