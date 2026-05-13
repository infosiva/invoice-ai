'use client'

import { useState } from 'react'
import Link from 'next/link'

const PRO_FEATURES = [
  'Unlimited deals',
  'WhatsApp notifications',
  'Custom invoice branding',
  'AI proposal drafting',
  'Dispute evidence trail',
  'Priority support',
]

const FREE_FEATURES = [
  '3 active deals',
  'Scope + milestone tracking',
  'Online payments',
  'Deal comms thread',
]

export default function UpgradeClient({ isPro }: { isPro: boolean }) {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  if (isPro) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-violet-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h1 className="text-2xl font-black text-white mb-2">You're on Pro</h1>
          <p className="text-slate-400 mb-6">Enjoy unlimited deals and all Pro features.</p>
          <Link href="/dashboard" className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm">
            Go to dashboard →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Upgrade to Pro</h1>
        <p className="text-slate-400 text-sm mt-1">Unlock unlimited deals and premium features</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 max-w-2xl">
        {/* Free */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <h3 className="font-black text-white text-xl mb-1">Free</h3>
          <p className="text-3xl font-black text-white mb-4">
            $0 <span className="text-slate-500 text-base font-normal">forever</span>
          </p>
          <ul className="space-y-2 text-sm text-slate-300 mb-8">
            {FREE_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2">
                <span className="text-violet-400">✓</span>{f}
              </li>
            ))}
          </ul>
          <div className="block w-full text-center bg-slate-800 text-slate-400 font-semibold py-3 rounded-xl text-sm cursor-default">
            Current plan
          </div>
        </div>

        {/* Pro */}
        <div className="bg-violet-600 rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">Popular</div>
          <h3 className="font-black text-white text-xl mb-1">Pro</h3>
          <p className="text-3xl font-black text-white mb-4">
            $12 <span className="text-violet-200 text-base font-normal">/ month</span>
          </p>
          <ul className="space-y-2 text-sm text-white mb-8">
            {PRO_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2">
                <span className="text-white/70">✓</span>{f}
              </li>
            ))}
          </ul>
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="block w-full text-center bg-white text-violet-700 font-bold py-3 rounded-xl transition-opacity hover:opacity-90 text-sm disabled:opacity-60"
          >
            {loading ? 'Redirecting…' : 'Upgrade to Pro →'}
          </button>
        </div>
      </div>

      <p className="text-slate-500 text-xs mt-6">
        Secure payment via Stripe. Cancel anytime from your account settings.
      </p>
    </div>
  )
}
