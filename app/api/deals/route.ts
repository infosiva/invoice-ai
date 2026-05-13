import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { sendMagicLink } from '@/lib/auth'
import crypto from 'crypto'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const deals = await db.deal.findMany({
    where: { vendorId: session.userId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { milestones: true, messages: true } } },
  })

  return NextResponse.json({ deals })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, brief, clientEmail } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  // Enforce free plan limit
  const [dbUser, dealCount] = await Promise.all([
    db.user.findUnique({ where: { id: session.userId }, select: { plan: true } }),
    db.deal.count({ where: { vendorId: session.userId } }),
  ])
  if (dbUser?.plan !== 'PRO' && dealCount >= 3) {
    return NextResponse.json({ error: 'Free plan limit reached. Upgrade to Pro for unlimited deals.' }, { status: 403 })
  }

  const deal = await db.deal.create({
    data: {
      title: title.trim(),
      brief: brief?.trim() ?? null,
      clientEmail: clientEmail?.trim() ?? null,
      vendorId: session.userId,
      status: clientEmail?.trim() ? 'PENDING_CLIENT' : 'DRAFT',
    },
  })

  // If client email provided, create invite token and send email
  if (clientEmail?.trim()) {
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await db.inviteToken.create({
      data: { token, dealId: deal.id, email: clientEmail.trim(), expiresAt },
    })

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/client/${token}`

    // Send invite email via Resend
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      const vendor = await db.user.findUnique({ where: { id: session.userId } })

      await resend.emails.send({
        from: 'DealFlow <noreply@dealflow.app>',
        to: clientEmail.trim(),
        subject: `${vendor?.email ?? 'Someone'} invited you to review a deal`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#7c3aed">You've been invited to DealFlow</h2>
            <p>${vendor?.email ?? 'A vendor'} has shared a deal: <strong>${title}</strong></p>
            <p>Click below to review the scope and terms:</p>
            <a href="${inviteUrl}" style="display:inline-block;background:#7c3aed;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:12px 0">
              View deal →
            </a>
            <p style="color:#888;font-size:12px">Link expires in 7 days.</p>
          </div>
        `,
      })
    } catch {
      // Non-fatal — deal is created, invite email failed
    }
  }

  return NextResponse.json({ deal }, { status: 201 })
}
