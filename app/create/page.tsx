'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import VoiceInput from './VoiceInput'
import InvoiceEditor from './InvoiceEditor'
import SendSheet from './SendSheet'
import type { ParsedInvoice } from '@/app/api/parse-invoice/route'

const PDFPreview = dynamic(
  () => import('@/app/components/InvoicePDF').then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 bg-slate-800 rounded-xl animate-pulse" />
    ),
  }
)

type Stage = 'input' | 'edit' | 'send'

export default function CreatePage() {
  const [stage, setStage] = useState<Stage>('input')
  const [invoice, setInvoice] = useState<ParsedInvoice | null>(null)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleTranscript(text: string) {
    setError(null)
    setParsing(true)
    try {
      const res = await fetch('/api/parse-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error('Parse failed')
      const { invoice: parsed } = await res.json()
      setInvoice(parsed)
      setStage('edit')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse invoice')
    } finally {
      setParsing(false)
    }
  }

  if (stage === 'input') {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-black text-white">Create an Invoice</h1>
        <p className="text-slate-400 mb-12">
          Speak or type — we&apos;ll build the invoice for you.
        </p>
        <VoiceInput onTranscript={handleTranscript} onParsing={setParsing} />
        {parsing && (
          <p className="text-violet-400 animate-pulse mt-4">
            Parsing your invoice...
          </p>
        )}
        {error && <p className="text-red-400 mt-4">{error}</p>}
      </main>
    )
  }

  if (stage === 'edit') {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <InvoiceEditor invoice={invoice!} onChange={setInvoice} />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setInvoice(null)
                  setStage('input')
                }}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
              >
                ← Start over
              </button>
              <button
                onClick={() => setStage('send')}
                className="flex-1 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors"
              >
                Send →
              </button>
            </div>
          </div>
          <div className="hidden lg:block">
            <PDFPreview invoice={invoice!} />
          </div>
        </div>
      </main>
    )
  }

  // send stage
  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <SendSheet invoice={invoice!} onBack={() => setStage('edit')} />
    </main>
  )
}
