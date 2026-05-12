import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicToken } from '@/lib/auth'
import { createSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  const result = await verifyMagicToken(token)
  if (!result) return NextResponse.json({ error: 'Invalid or expired link' }, { status: 401 })

  await createSession(result.userId)
  return NextResponse.json({ ok: true })
}
