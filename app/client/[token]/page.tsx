'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface DealInfo {
  deal: { id: string; title: string; brief: string | null; vendorEmail: string }
  email: string
}

function ClientInviteInner() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const [info, setInfo] = useState<DealInfo | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then(async res => {
        if (!res.ok) {
          const d = await res.json()
          setError(d.error || 'Invalid invite')
        } else {
          const d = await res.json()
          setInfo(d)
        }
      })
      .finally(() => setLoading(false))
  }, [token])

  async function handleAccept() {
    setAccepting(true)
    const res = await fetch('/api/invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Failed to accept invite')
      setAccepting(false)
      return
    }

    router.replace(`/deal/${data.dealId}/scope`)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="text-2xl font-black text-white tracking-tight">Deal<span className="text-violet-400">Flow</span></span>
        </div>

        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
            <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Loading invite…</p>
          </div>
        ) : error ? (
          <div className="bg-slate-900 border border-red-900/50 rounded-2xl p-8 text-center">
            <p className="text-red-400 font-semibold mb-2">Invalid invite</p>
            <p className="text-slate-400 text-sm">{error}</p>
          </div>
        ) : info ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <p className="text-slate-400 text-sm mb-1">You've been invited by</p>
            <p className="text-white font-semibold mb-4">{info.deal.vendorEmail}</p>

            <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Deal</p>
              <p className="text-white font-bold text-lg">{info.deal.title}</p>
              {info.deal.brief && (
                <p className="text-slate-400 text-sm mt-2 leading-relaxed">{info.deal.brief}</p>
              )}
            </div>

            <p className="text-slate-400 text-sm mb-6">
              You'll be signed in as <span className="text-white">{info.email}</span> to review the scope and approve milestones.
            </p>

            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {accepting ? 'Joining…' : 'Accept & view deal →'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function ClientInvitePage() {
  return <Suspense><ClientInviteInner /></Suspense>
}
