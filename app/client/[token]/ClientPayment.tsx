'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

type Props = {
  dealId: string
  token: string
  amount: number
  depositLabel: string
}

function CheckoutForm({ token, amount }: { token: string; amount: number }) {
  const stripe = useStripe()
  const elements = useElements()
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setPaying(true)
    setError('')
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
    })
    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed')
      setPaying(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || paying}
        className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
      >
        {paying ? 'Paying…' : `Pay $${(amount / 100).toFixed(2)}`}
      </button>
    </form>
  )
}

export default function ClientPayment({ dealId, token, amount, depositLabel }: Props) {
  const [clientSecret, setClientSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleApprove() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/client/${token}/approve`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }
      const { clientSecret: cs } = await res.json()
      setClientSecret(cs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve')
    } finally {
      setLoading(false)
    }
  }

  if (clientSecret) {
    return (
      <div className="space-y-4">
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm token={token} amount={amount} />
        </Elements>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleApprove}
        disabled={loading}
        className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-lg transition-colors"
      >
        {loading ? 'Processing…' : `${depositLabel} $${(amount / 100).toFixed(2)} →`}
      </button>
      {error && <p className="text-sm text-red-400 text-center">{error}</p>}
      <p className="text-xs text-slate-500 text-center">Secure payment via Stripe</p>
    </div>
  )
}
