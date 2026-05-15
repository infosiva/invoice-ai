import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import Stripe from 'stripe'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Find InviteToken with its deal and scopeItems
    const invite = await db.inviteToken.findUnique({
      where: { token },
      include: {
        deal: {
          include: {
            scopeItems: true,
          },
        },
      },
    })

    // Return 404 if not found
    if (!invite) {
      return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
    }

    // Return 410 if expired
    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This link has expired' }, { status: 410 })
    }

    // Calculate totalAmount in cents
    const totalAmount = invite.deal.scopeItems.reduce(
      (sum, item) => sum + Number(item.unitPrice) * item.qty,
      0
    )
    const totalCents = Math.round(totalAmount * 100)

    // Update deal status to SCOPE_AGREED
    await db.deal.update({
      where: { id: invite.dealId },
      data: { status: 'SCOPE_AGREED' },
    })

    // Create Stripe PaymentIntent
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'usd',
      metadata: { dealId: invite.dealId },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: totalCents,
    })
  } catch (error) {
    console.error('Error in approve route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
