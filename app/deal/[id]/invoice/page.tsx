import { redirect, notFound } from 'next/navigation'
import { getSessionUser } from '@/lib/session'
import { db } from '@/lib/db'

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const deal = await db.deal.findFirst({
    where: {
      id: params.id,
      OR: [{ vendorId: user.id }, { clientId: user.id }],
    },
    include: {
      invoices: { orderBy: { createdAt: 'desc' } },
      milestones: { where: { status: 'APPROVED' } },
    },
  })

  if (!deal) notFound()

  const isVendor = deal.vendorId === user.id

  return (
    <div className="pb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">Invoice</h2>
          <p className="text-slate-400 text-sm mt-0.5">Generated from approved milestones</p>
        </div>
        {isVendor && deal.milestones.length > 0 && deal.invoices.length === 0 && (
          <button className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
            Generate invoice
          </button>
        )}
      </div>

      {deal.invoices.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
          <p className="text-slate-400 text-sm">No invoices yet.</p>
          {isVendor && deal.milestones.length === 0 && (
            <p className="text-slate-500 text-xs mt-2">
              Invoices unlock after milestones are approved by the client.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {deal.invoices.map(inv => (
            <div key={inv.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-bold text-white">Invoice #{inv.number}</p>
                  <p className="text-slate-400 text-sm mt-0.5">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-white">${Number(inv.amount).toLocaleString()}</p>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full mt-1 inline-block ${
                    inv.status === 'PAID'
                      ? 'bg-green-900/40 text-green-300'
                      : inv.status === 'SENT'
                      ? 'bg-yellow-900/40 text-yellow-300'
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {inv.status}
                  </span>
                </div>
              </div>

              {inv.stripeUrl && (
                <a
                  href={inv.stripeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                >
                  Pay now via Stripe →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
