import { redirect, notFound } from 'next/navigation'
import { getSessionUser } from '@/lib/session'
import { db } from '@/lib/db'

export default async function MessagesPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const deal = await db.deal.findFirst({
    where: {
      id: params.id,
      OR: [{ vendorId: user.id }, { clientId: user.id }],
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { email: true } } },
      },
    },
  })

  if (!deal) notFound()

  return (
    <div className="pb-12">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">Messages</h2>
        <p className="text-slate-400 text-sm mt-0.5">All deal communications in one thread</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {deal.messages.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-slate-400 text-sm">No messages yet. Start the conversation.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800 max-h-96 overflow-y-auto">
            {deal.messages.map(msg => {
              const isMe = msg.authorId === user.id
              return (
                <div key={msg.id} className={`p-4 ${isMe ? 'bg-slate-900' : 'bg-slate-950/50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-violet-400">{msg.author.email}</span>
                    <span className="text-xs text-slate-600">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{msg.body}</p>
                </div>
              )
            })}
          </div>
        )}

        <div className="border-t border-slate-800 p-4">
          <form action={`/api/deals/${params.id}/messages`} method="POST" className="flex gap-3">
            <input
              name="body"
              type="text"
              required
              placeholder="Type a message…"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
            />
            <button
              type="submit"
              className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
