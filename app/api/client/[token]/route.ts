import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // Look up InviteToken in DB
  const invite = await db.inviteToken.findUnique({
    where: { token },
    include: {
      deal: {
        include: {
          vendor: { select: { email: true, name: true } },
          scopeItems: { orderBy: { order: 'asc' } },
          milestones: { orderBy: { createdAt: 'asc' } },
          messages: {
            orderBy: { createdAt: 'asc' },
            include: { author: { select: { email: true } } },
          },
        },
      },
    },
  })

  // If not found → 404
  if (!invite) {
    return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
  }

  // If expired → 410
  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: 'This link has expired' }, { status: 410 })
  }

  // Compute total from scope items
  const total = invite.deal.scopeItems.reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.qty,
    0
  )

  // Return 200 with deal data
  return NextResponse.json({
    deal: {
      id: invite.deal.id,
      title: invite.deal.title,
      brief: invite.deal.brief,
      status: invite.deal.status,
      clientEmail: invite.email,
      totalAmount: total,
      depositAmount: total,
      vendor: invite.deal.vendor,
      scopeItems: invite.deal.scopeItems.map(item => ({
        id: item.id,
        description: item.description,
        qty: item.qty,
        unitPrice: Number(item.unitPrice),
        total: Number(item.unitPrice) * item.qty,
      })),
      milestones: invite.deal.milestones.map(m => ({
        id: m.id,
        title: m.title,
        status: m.status,
        dueDate: m.dueDate,
      })),
      messages: invite.deal.messages.map(msg => ({
        id: msg.id,
        body: msg.body,
        authorEmail: msg.author.email,
        createdAt: msg.createdAt,
      })),
    },
  })
}
