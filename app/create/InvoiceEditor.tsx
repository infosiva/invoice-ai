'use client'

import { useCallback } from 'react'
import type { ParsedInvoice } from '@/app/api/parse-invoice/route'

interface Props {
  invoice: ParsedInvoice
  onChange: (invoice: ParsedInvoice) => void
}

function calcTotal(invoice: ParsedInvoice): number {
  const sub = invoice.lineItems.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  if (!invoice.discount) return sub
  return invoice.discount.type === 'percent'
    ? sub * (1 - invoice.discount.value / 100)
    : sub - invoice.discount.value
}

export default function InvoiceEditor({ invoice, onChange }: Props) {
  const updateItem = useCallback((idx: number, field: keyof ParsedInvoice['lineItems'][0], value: string) => {
    const items = invoice.lineItems.map((item, i) =>
      i === idx
        ? { ...item, [field]: field === 'description' ? value : parseFloat(value) || 0 }
        : item
    )
    onChange({ ...invoice, lineItems: items })
  }, [invoice, onChange])

  const addItem = useCallback(() => {
    onChange({ ...invoice, lineItems: [...invoice.lineItems, { id: Date.now().toString(), description: '', qty: 1, unitPrice: 0 }] })
  }, [invoice, onChange])

  const removeItem = useCallback((idx: number) => {
    onChange({ ...invoice, lineItems: invoice.lineItems.filter((_, i) => i !== idx) })
  }, [invoice, onChange])

  const total = calcTotal(invoice)

  return (
    <div className="space-y-6">
      {/* Client / Vendor */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Client name</label>
          <input
            value={invoice.clientName}
            onChange={e => onChange({ ...invoice, clientName: e.target.value })}
            placeholder="Sarah Chen"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Client email</label>
          <input
            value={invoice.clientEmail}
            onChange={e => onChange({ ...invoice, clientEmail: e.target.value })}
            placeholder="sarah@company.com"
            type="email"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Your name / company</label>
          <input
            value={invoice.vendorName}
            onChange={e => onChange({ ...invoice, vendorName: e.target.value })}
            placeholder="Acme Studio"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Due date</label>
          <input
            value={invoice.dueDate}
            onChange={e => onChange({ ...invoice, dueDate: e.target.value })}
            type="date"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
      </div>

      {/* Line items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Line items</label>
          <button onClick={addItem} className="text-violet-400 hover:text-violet-300 text-xs font-semibold transition-colors">+ Add item</button>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500 border-b border-slate-800">
            <span className="col-span-6">Description</span>
            <span className="col-span-2 text-right">Qty</span>
            <span className="col-span-2 text-right">Price</span>
            <span className="col-span-2 text-right">Total</span>
          </div>
          {invoice.lineItems.map((item, i) => (
            <div key={(item as { id?: string }).id ?? i} className="grid grid-cols-12 px-4 py-2 gap-2 items-center border-b border-slate-800/50 last:border-0 group">
              <input
                value={item.description}
                onChange={e => updateItem(i, 'description', e.target.value)}
                placeholder="Description"
                className="col-span-6 bg-transparent text-white text-sm focus:outline-none focus:bg-slate-800 rounded px-1 py-0.5 transition-colors placeholder-slate-600"
              />
              <input
                value={item.qty}
                onChange={e => updateItem(i, 'qty', e.target.value)}
                type="number"
                min="0"
                className="col-span-2 bg-transparent text-slate-300 text-sm text-right focus:outline-none focus:bg-slate-800 rounded px-1 py-0.5 transition-colors w-full"
              />
              <input
                value={item.unitPrice}
                onChange={e => updateItem(i, 'unitPrice', e.target.value)}
                type="number"
                min="0"
                className="col-span-2 bg-transparent text-slate-300 text-sm text-right focus:outline-none focus:bg-slate-800 rounded px-1 py-0.5 transition-colors w-full"
              />
              <div className="col-span-2 flex items-center justify-end gap-1">
                <span className="text-white text-sm font-semibold">${Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.qty * item.unitPrice)}</span>
                <button
                  onClick={() => removeItem(i)}
                  className="text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all ml-1 text-xs"
                  aria-label="Remove item"
                >✕</button>
              </div>
            </div>
          ))}
          {/* Total row */}
          <div className="grid grid-cols-12 px-4 py-3 border-t border-slate-700 bg-slate-800/30">
            <span className="col-span-10 text-right text-slate-400 text-sm font-semibold">
              {invoice.discount
                ? `Total (after ${invoice.discount.value}${invoice.discount.type === 'percent' ? '%' : '$'} discount)`
                : 'Total'}
            </span>
            <span className="col-span-2 text-right text-white font-black text-base">${Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(total)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Notes (optional)</label>
        <textarea
          value={invoice.notes}
          onChange={e => onChange({ ...invoice, notes: e.target.value })}
          placeholder="Payment terms, project details…"
          rows={2}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm resize-none focus:outline-none focus:border-violet-500 transition-colors"
        />
      </div>
    </div>
  )
}
