import { NextRequest, NextResponse } from 'next/server'
import { sendMagicLink } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }
  try {
    await sendMagicLink(email)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('sendMagicLink error', err)
    return NextResponse.json({ error: 'Failed to send link' }, { status: 500 })
  }
}
