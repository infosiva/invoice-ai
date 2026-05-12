import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  const invite = await db.inviteToken.findUnique({
    where: { token },
    include: { deal: true },
  })

  if (!invite) return NextResponse.json({ error: 'Invalid invite' }, { status: 404 })
  if (invite.usedAt) return NextResponse.json({ error: 'Invite already used' }, { status: 410 })
  if (invite.expiresAt < new Date()) return NextResponse.json({ error: 'Invite expired' }, { status: 410 })

  // Upsert client user
  const client = await db.user.upsert({
    where: { email: invite.email },
    update: {},
    create: { email: invite.email, role: 'CLIENT' },
  })

  // Link client to deal and mark invite used
  await db.$transaction([
    db.deal.update({
      where: { id: invite.dealId },
      data: { clientId: client.id, status: 'PENDING_CLIENT' },
    }),
    db.inviteToken.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    }),
  ])

  await createSession(client.id)

  return NextResponse.json({ dealId: invite.dealId })
}
