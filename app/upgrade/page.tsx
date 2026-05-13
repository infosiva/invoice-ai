import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/session'
import { db } from '@/lib/db'
import UpgradeClient from './UpgradeClient'

export default async function UpgradePage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { plan: true } })
  const isPro = dbUser?.plan === 'PRO'

  return <UpgradeClient isPro={isPro} />
}
