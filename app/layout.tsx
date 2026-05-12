import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DealFlow — Vendor-Client Platform | Proposals, Milestones & Payments',
  description: 'The only platform where vendors and clients agree on scope, track milestones, handle change orders, and get paid — all in one place. No more invoice disputes.',
  keywords: 'vendor client platform, freelance invoicing, scope agreement, milestone tracker, invoice disputes, proposal software',
  openGraph: {
    title: 'DealFlow — Scope. Milestone. Pay.',
    description: 'Stop chasing invoices. Stop scope disputes. DealFlow gives vendors and clients one shared workspace — from proposal to payment.',
    url: 'https://dealflow.app',
    siteName: 'DealFlow',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DealFlow — Vendor-Client Platform',
    description: 'Proposals. Milestones. Payments. One platform for vendors and clients.',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://dealflow.app' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'DealFlow',
  applicationCategory: 'BusinessApplication',
  description: 'Vendor-client platform for proposals, scope agreement, milestone tracking, and payments.',
  offers: [
    { '@type': 'Offer', price: '0', priceCurrency: 'USD', name: 'Free' },
    { '@type': 'Offer', price: '12', priceCurrency: 'USD', name: 'Pro', billingDuration: 'P1M' },
  ],
  featureList: [
    'AI proposal drafting',
    'Scope agreement with e-signature',
    'Milestone tracking with proof uploads',
    'Change order management',
    'Stripe payment links',
    'WhatsApp notifications',
    'Dispute evidence trail',
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
