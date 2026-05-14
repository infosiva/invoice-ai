import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import type { ParsedInvoice } from '@/app/api/parse-invoice/route'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { invoice, senderEmail }: { invoice: ParsedInvoice; senderEmail: string } = await req.json()

    if (!invoice?.lineItems?.length) {
      return NextResponse.json({ error: 'Invoice has no line items' }, { status: 400 })
    }

    // Calculate total
    const subtotal = invoice.lineItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
    const discountAmount = invoice.discount
      ? invoice.discount.type === 'percent'
        ? subtotal * (invoice.discount.value / 100)
        : invoice.discount.value
      : 0
    const total = Math.round((subtotal - discountAmount) * 100) // cents

    if (total < 50) {
      return NextResponse.json({ error: 'Amount too small (minimum $0.50)' }, { status: 400 })
    }

    // Build line item name
    const lineItemName = invoice.lineItems.length === 1
      ? invoice.lineItems[0].description
      : `Invoice: ${invoice.lineItems.map(i => i.description).join(', ')}`

    // Create a price inline
    const price = await stripe.prices.create({
      currency: 'usd',
      unit_amount: total,
      product_data: {
        name: lineItemName.slice(0, 255),
      },
    })

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      after_completion: {
        type: 'hosted_confirmation',
        hosted_confirmation: { custom_message: 'Payment received. Thank you!' },
      },
      metadata: {
        clientEmail: invoice.clientEmail ?? '',
        senderEmail: senderEmail ?? '',
        dueDate: invoice.dueDate ?? '',
      },
    })

    return NextResponse.json({ url: paymentLink.url, id: paymentLink.id })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Stripe error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
