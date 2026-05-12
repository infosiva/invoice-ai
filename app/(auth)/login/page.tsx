'use client'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Failed'); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-2xl font-black text-white tracking-tight">Deal<span className="text-violet-400">Flow</span></span>
          <p className="text-slate-400 text-sm mt-2">Vendor-client deals, scoped and paid.</p>
        </div>
        {sent ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-white font-bold text-lg mb-2">Check your email</h2>
            <p className="text-slate-400 text-sm">Login link sent to <span className="text-white">{email}</span>. Expires in 15 minutes.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
              />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              {loading ? 'Sending…' : 'Send login link →'}
            </button>
            <p className="text-center text-xs text-slate-500">No password. No spam. Just a link.</p>
          </form>
        )}
      </div>
    </div>
  )
}
