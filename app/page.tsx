import Link from 'next/link'

const FEATURES = [
  {
    icon: '📋',
    title: 'AI-Drafted Proposals',
    desc: 'Describe your project in plain text or voice. AI writes the full scope and line items.',
  },
  {
    icon: '✍️',
    title: 'Scope Agreement',
    desc: "Both sides sign off on exactly what's included. Scope locks — no more \"I thought it was included.\"",
  },
  {
    icon: '🏁',
    title: 'Milestone Tracking',
    desc: 'Vendor uploads proof. Client approves. Invoice unlocks only from approved milestones.',
  },
  {
    icon: '🔄',
    title: 'Change Orders',
    desc: 'Extra work gets a formal change order. Both sides approve. Evidence stays forever.',
  },
  {
    icon: '💬',
    title: 'Deal Comms',
    desc: 'Every negotiation, revision, and approval in one thread — linked to the deal.',
  },
  {
    icon: '💳',
    title: 'Online Payments',
    desc: 'Stripe payment link per invoice. Client pays in browser. No Stripe account needed on their side.',
  },
  {
    icon: '📱',
    title: 'WhatsApp Alerts',
    desc: 'Scope approved, milestone done, payment received — straight to WhatsApp. Both sides.',
  },
  {
    icon: '🛡️',
    title: 'Dispute Evidence',
    desc: 'If a client disputes, show them: signed scope, approved milestones, full message trail.',
  },
]

const STEPS = [
  { n: '01', title: 'Create a deal', desc: 'Add title, brief, and client email. AI drafts the proposal.' },
  { n: '02', title: 'Client approves scope', desc: 'Client gets a link, reviews line items, signs off.' },
  { n: '03', title: 'Track milestones', desc: 'Upload proof per milestone. Client approves each one.' },
  { n: '04', title: 'Invoice & get paid', desc: 'Invoice auto-generates from milestones. Stripe handles payment.' },
]

const COMPARE = [
  { feature: 'Scope agreement (both sign)', xero: false, freshbooks: false, us: true },
  { feature: 'Milestone proof uploads', xero: false, freshbooks: false, us: true },
  { feature: 'Change order tracking', xero: false, freshbooks: false, us: true },
  { feature: 'Per-deal threaded comms', xero: false, freshbooks: 'basic', us: true },
  { feature: 'WhatsApp notifications', xero: false, freshbooks: false, us: true },
  { feature: 'Client portal (no login)', xero: false, freshbooks: false, us: true },
  { feature: 'AI proposal drafting', xero: false, freshbooks: false, us: true },
  { feature: 'Dispute evidence trail', xero: false, freshbooks: false, us: true },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-black tracking-tight">Deal<span className="text-violet-400">Flow</span></span>
          <div className="flex items-center gap-3">
            <Link href="/generate" className="text-slate-400 hover:text-white text-sm transition-colors">Quick Invoice</Link>
            <Link href="/login" className="text-slate-400 hover:text-white text-sm transition-colors">Log in</Link>
            <Link href="/login" className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              Get started free →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-12">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-violet-300 text-xs font-semibold mb-6">
            ✦ The platform Xero and FreshBooks never built
          </div>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
            Scope it. Prove it.<br />
            <span className="text-violet-400">Get paid.</span>
          </h1>
          <p className="text-slate-400 text-lg mb-8 leading-relaxed">
            One shared workspace for vendors and clients — AI proposals, signed scope,
            milestone proofs, change orders, and Stripe payments. No more invoice disputes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-8 py-4 rounded-xl transition-colors text-base"
            >
              Start free — 3 deals included →
            </Link>
            <a
              href="#how-it-works"
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-8 py-4 rounded-xl transition-colors text-base"
            >
              See how it works
            </a>
          </div>
          <p className="text-slate-500 text-xs mt-4">No credit card · No password · Free forever for 3 deals</p>
        </div>

        {/* Social proof pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-10">
          {[
            '✅ Scope disputes eliminated',
            '📎 Milestone proof uploads',
            '💬 WhatsApp alerts',
            '🛡️ Dispute evidence trail',
            '🤖 AI proposal drafting',
          ].map(p => (
            <span key={p} className="bg-slate-900 border border-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-full font-medium">{p}</span>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-black text-center mb-10">From lead to paid in 4 steps</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map(s => (
            <div key={s.n} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <span className="text-3xl font-black text-violet-400/40">{s.n}</span>
              <h3 className="font-bold text-white mt-2 mb-1">{s.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-black text-center mb-2">Everything vendors and clients need</h2>
        <p className="text-slate-400 text-center text-sm mb-10">All industries. Any project size.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-violet-800/60 transition-colors">
              <span className="text-2xl mb-3 block">{f.icon}</span>
              <h3 className="font-bold text-white mb-1 text-sm">{f.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-black text-center mb-10">Why not just use Xero or FreshBooks?</h2>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-4 bg-slate-800/50 px-6 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
            <span className="col-span-1">Feature</span>
            <span className="text-center">Xero</span>
            <span className="text-center">FreshBooks</span>
            <span className="text-center text-violet-400">DealFlow</span>
          </div>
          {COMPARE.map((row, i) => (
            <div key={row.feature} className={`grid grid-cols-4 px-6 py-3 text-sm ${i % 2 === 0 ? '' : 'bg-slate-900/50'}`}>
              <span className="text-slate-300 text-xs">{row.feature}</span>
              <span className="text-center">{row.xero ? '✅' : '❌'}</span>
              <span className="text-center">{row.freshbooks === 'basic' ? '⚠️' : row.freshbooks ? '✅' : '❌'}</span>
              <span className="text-center">{row.us ? '✅' : '❌'}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-black text-center mb-10">Simple pricing</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <h3 className="font-black text-white text-xl mb-1">Free</h3>
            <p className="text-3xl font-black text-white mb-4">$0 <span className="text-slate-500 text-base font-normal">forever</span></p>
            <ul className="space-y-2 text-sm text-slate-300 mb-8">
              {['3 active deals', 'Scope + milestone tracking', 'Online payments', 'Deal comms thread'].map(f => (
                <li key={f} className="flex items-center gap-2"><span className="text-violet-400">✓</span>{f}</li>
              ))}
            </ul>
            <Link href="/login" className="block w-full text-center bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
              Start free →
            </Link>
          </div>
          <div className="bg-violet-600 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">Popular</div>
            <h3 className="font-black text-white text-xl mb-1">Pro</h3>
            <p className="text-3xl font-black text-white mb-4">$12 <span className="text-violet-200 text-base font-normal">/ month</span></p>
            <ul className="space-y-2 text-sm text-white mb-8">
              {[
                'Unlimited deals',
                'WhatsApp notifications',
                'Custom invoice branding',
                'AI proposal drafting',
                'Dispute evidence trail',
                'Priority support',
              ].map(f => (
                <li key={f} className="flex items-center gap-2"><span className="text-white/70">✓</span>{f}</li>
              ))}
            </ul>
            <Link href="/login" className="block w-full text-center bg-white text-violet-700 font-bold py-3 rounded-xl transition-opacity hover:opacity-90 text-sm">
              Start Pro →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-black text-center mb-10">Frequently asked questions</h2>
        <div className="space-y-4">
          {[
            { q: 'What is DealFlow?', a: 'DealFlow is a vendor-client platform that covers the full project lifecycle — from AI-drafted proposals and scope agreements through milestone tracking, change orders, and Stripe-powered payments. Unlike Xero or FreshBooks, it starts before the invoice.' },
            { q: 'Who uses DealFlow?', a: 'Any vendor who works on projects: freelancers, agencies, contractors, consultants, home service providers, software developers. Clients are invited by the vendor and get their own portal.' },
            { q: 'How does scope agreement work?', a: "The vendor creates scope line items (description, qty, unit price). The client reviews and approves each one. Once approved, scope locks — any extra work requires a signed change order. This eliminates \"that wasn't included\" disputes." },
            { q: 'Does the client need to sign up?', a: 'Yes — the client creates a free account when they accept the invite link. This gives both parties a shared deal workspace.' },
            { q: 'How does payment work?', a: 'DealFlow generates a Stripe payment link per invoice. The client pays in their browser. No Stripe account needed on the client side.' },
            { q: 'What are WhatsApp notifications?', a: 'Vendors and clients can opt in to receive WhatsApp messages when key events happen: scope approved, milestone complete, invoice paid, new message. Powered by Twilio.' },
          ].map(({ q, a }) => (
            <details key={q} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 group">
              <summary className="font-semibold text-white cursor-pointer list-none flex justify-between items-center text-sm">
                {q}
                <span className="text-slate-500 group-open:rotate-180 transition-transform">↓</span>
              </summary>
              <p className="text-slate-400 text-sm mt-3 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-black mb-4">Stop losing deals to scope disputes</h2>
        <p className="text-slate-400 mb-8">Start with 3 free deals. No credit card. No password.</p>
        <Link href="/login" className="inline-block bg-violet-600 hover:bg-violet-700 text-white font-bold px-10 py-4 rounded-xl transition-colors text-base">
          Create your first deal →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-xs">
        <div className="mb-2 font-black text-white text-sm">Deal<span className="text-violet-400">Flow</span></div>
        <p>Vendor-client platform — proposals, milestones, payments.</p>
        <p className="mt-1">© {new Date().getFullYear()} DealFlow · <a href="/privacy" className="hover:text-white transition-colors">Privacy</a> · <a href="/terms" className="hover:text-white transition-colors">Terms</a></p>
      </footer>
    </div>
  )
}
