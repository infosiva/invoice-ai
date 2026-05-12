'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewDealPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [brief, setBrief] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, brief, clientEmail }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Failed to create deal')
      setLoading(false)
      return
    }

    router.push(`/deal/${data.deal.id}`)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="text-lg font-black tracking-tight">
            Deal<span className="text-violet-400">Flow</span>
          </Link>
          <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm transition-colors">
            ← Back to dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-black text-white mb-2">New deal</h1>
        <p className="text-slate-400 text-sm mb-8">Describe your project. AI will help draft the scope.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Deal title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              placeholder="e.g. Website redesign for Acme Corp"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Project brief
            </label>
            <textarea
              value={brief}
              onChange={e => setBrief(e.target.value)}
              rows={5}
              placeholder="Describe what you'll deliver, what's included, any constraints or timeline..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm resize-none"
            />
            <p className="text-slate-500 text-xs mt-1">AI will use this to draft scope line items.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Client email
            </label>
            <input
              type="email"
              value={clientEmail}
              onChange={e => setClientEmail(e.target.value)}
              placeholder="client@company.com"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
            />
            <p className="text-slate-500 text-xs mt-1">Leave blank to start as draft. Client gets an invite link.</p>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              {loading ? 'Creating…' : 'Create deal →'}
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-colors text-sm text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
