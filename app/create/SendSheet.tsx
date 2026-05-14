'use client'

import { useState } from 'react'
import type { ParsedInvoice } from '@/app/api/parse-invoice/route'

type Props = {
  invoice: ParsedInvoice
  onBack: () => void
}

type UIState = 'idle' | 'loading' | 'done' | 'error'

function isEmail(value: string) {
  return value.trim().length > 0 && value.includes('@')
}

export default function SendSheet({ invoice, onBack }: Props) {
  const [senderEmail, setSenderEmail] = useState(
    isEmail(invoice.vendorName) ? invoice.vendorName : ''
  )
  const [clientEmail, setClientEmail] = useState(invoice.clientEmail ?? '')
  const [uiState, setUiState] = useState<UIState>('idle')
  const [paymentUrl, setPaymentUrl] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [validationError, setValidationError] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleGenerate() {
    setValidationError('')
    if (!isEmail(senderEmail)) {
      setValidationError('Enter a valid sender email.')
      return
    }
    if (!isEmail(clientEmail)) {
      setValidationError('Enter a valid client email.')
      return
    }

    setUiState('loading')
    try {
      const res = await fetch('/api/stripe/payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice, senderEmail }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }
      const { url } = await res.json()
      setPaymentUrl(url)
      setUiState('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
      setUiState('error')
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(paymentUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inputClass =
    'bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white w-full focus:outline-none focus:ring-2 focus:ring-violet-500'
  const labelClass = 'block text-sm font-medium text-slate-300 mb-1'
  const noteClass = 'text-xs text-slate-500 mt-1'

  return (
    <div className="space-y-6">
      {/* Heading */}
      <h2 className="text-xl font-semibold text-white">Send payment link</h2>

      {uiState !== 'done' ? (
        <>
          {/* Sender email */}
          <div>
            <label className={labelClass}>Your email</label>
            <input
              type="email"
              placeholder="you@email.com"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              className={inputClass}
            />
            <p className={noteClass}>We&apos;ll send you a receipt when paid</p>
          </div>

          {/* Client email */}
          <div>
            <label className={labelClass}>Client email</label>
            <input
              type="email"
              placeholder="client@company.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className={inputClass}
            />
            <p className={noteClass}>Client will receive the payment link here</p>
          </div>

          {/* Validation error */}
          {validationError && (
            <p className="text-sm text-red-400">{validationError}</p>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={uiState === 'loading'}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {uiState === 'loading' ? 'Generating…' : 'Generate Payment Link →'}
          </button>

          {/* API error */}
          {uiState === 'error' && (
            <p className="text-sm text-red-400">Failed: {errorMsg}</p>
          )}
        </>
      ) : (
        /* Done state */
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-green-400 text-green-400 text-lg font-bold">
              ✓
            </span>
            <span className="text-lg font-semibold text-white">Payment link created!</span>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 text-sm break-all select-all font-mono">
            {paymentUrl}
          </div>

          <button
            onClick={handleCopy}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>

          <p className="text-xs text-slate-500 text-center">
            <a href="/register" className="hover:text-violet-400 transition-colors underline underline-offset-2">
              Track when it&apos;s paid — create free account →
            </a>
          </p>
        </div>
      )}

      {/* Back button */}
      <button
        onClick={onBack}
        className="text-sm text-slate-400 hover:text-white transition-colors mt-2"
      >
        ← Edit
      </button>
    </div>
  )
}
