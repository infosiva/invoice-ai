import { db } from './db'
import { Resend } from 'resend'
import { addMinutes } from 'date-fns'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendMagicLink(email: string): Promise<void> {
  const user = await db.user.upsert({
    where: { email },
    update: {},
    create: { email, role: 'VENDOR' },
  })

  const token = crypto.randomUUID()
  await db.authToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: addMinutes(new Date(), 15),
    },
  })

  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify?token=${token}`

  await resend.emails.send({
    from: 'DealFlow <noreply@dealflow.app>',
    to: email,
    subject: 'Your login link for DealFlow',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="margin:0 0 16px">Log in to DealFlow</h2>
        <p style="color:#555">Click the button below to log in. This link expires in 15 minutes.</p>
        <a href="${url}" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
          Log in →
        </a>
        <p style="color:#999;font-size:12px">If you didn't request this, ignore this email.</p>
      </div>
    `,
  })
}

export async function verifyMagicToken(token: string): Promise<{ userId: string; email: string } | null> {
  const record = await db.authToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!record) return null
  if (record.usedAt) return null
  if (record.expiresAt < new Date()) return null

  await db.authToken.update({ where: { id: record.id }, data: { usedAt: new Date() } })

  return { userId: record.user.id, email: record.user.email }
}
