'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function VerifyInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [status, setStatus] = useState<'verifying' | 'error'>('verifying')
  const [error, setError] = useState('')

  useEffect(() => {
    const token = params.get('token')
    if (!token) { setStatus('error'); setError('No token provided'); return }

    fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).then(async res => {
      if (res.ok) {
        router.replace('/dashboard')
      } else {
        const data = await res.json()
        setStatus('error')
        setError(data.error || 'Link expired or already used')
      }
    })
  }, [params, router])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <span className="text-2xl font-black text-white tracking-tight mb-8 block">Deal<span className="text-violet-400">Flow</span></span>
        {status === 'verifying' ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-300 text-sm">Verifying your link…</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-red-900/50 rounded-2xl p-8">
            <p className="text-red-400 font-semibold mb-2">Link expired</p>
            <p className="text-slate-400 text-sm mb-4">{error}</p>
            <a href="/login" className="text-violet-400 text-sm hover:underline">Request a new link →</a>
          </div>
        )}
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return <Suspense><VerifyInner /></Suspense>
}
