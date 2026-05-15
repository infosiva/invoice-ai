'use client'

import { useState } from 'react'

type Message = {
  id: string
  body: string
  createdAt: string
  author: { email: string }
}

type Props = {
  dealId: string
  token: string
  messages: Message[]
}

export default function MessageThread({ dealId, token, messages: initial }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(initial)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')

  async function handleSend() {
    if (!draft.trim()) return
    setSending(true)
    setSendError('')
    try {
      const res = await fetch(`/api/client/${token}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: draft.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }
      const { message } = await res.json()
      setMessages((prev) => [...prev, message])
      setDraft('')
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="border-t border-slate-800 pt-6">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors"
      >
        <span>{open ? '▾' : '▸'} Messages ({messages.length})</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {messages.length === 0 ? (
            <p className="text-slate-500 text-sm">No messages yet.</p>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => (
                <div key={m.id} className="bg-slate-800 rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-violet-400">
                      {m.author.email.split('@')[0]}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">{m.body}</p>
                </div>
              ))}
            </div>
          )}

          {sendError && <p className="text-sm text-red-400">{sendError}</p>}

          <div className="flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask a question…"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              onClick={handleSend}
              disabled={sending || !draft.trim()}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {sending ? '…' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
