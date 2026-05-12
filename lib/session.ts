import { cookies } from 'next/headers'
import { db } from './db'

const SESSION_COOKIE = 'df_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export async function createSession(userId: string): Promise<void> {
  const cookieStore = await cookies()
  const value = Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString('base64')
  cookieStore.set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
}

export async function getSession(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(SESSION_COOKIE)?.value
  if (!raw) return null
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64').toString())
    return { userId: parsed.userId }
  } catch {
    return null
  }
}

export async function getSessionUser() {
  const session = await getSession()
  if (!session) return null
  return db.user.findUnique({ where: { id: session.userId } })
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}
