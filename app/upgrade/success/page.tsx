import Link from 'next/link'

export default function UpgradeSuccessPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-violet-600/20 border border-violet-600/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🎉</span>
        </div>
        <h1 className="text-3xl font-black text-white mb-3">Welcome to Pro!</h1>
        <p className="text-slate-400 mb-2">Your subscription is active.</p>
        <p className="text-slate-500 text-sm mb-8">Unlimited deals, WhatsApp alerts, AI drafting — all unlocked.</p>
        <Link
          href="/dashboard"
          className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-8 py-3 rounded-xl transition-colors"
        >
          Go to dashboard →
        </Link>
      </div>
    </div>
  )
}
