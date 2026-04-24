import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "InvoiceMint — Free AI Invoice & Quote Generator",
  description:
    "Generate professional invoices, quotes, and payment terms instantly with AI. Free invoice generator for freelancers and small businesses. No signup required.",
  keywords:
    "free invoice generator, AI invoice generator, quote generator, invoice description, professional invoice, freelance invoice, small business invoice",
  metadataBase: new URL("https://invoicemint.cloud"),
  openGraph: {
    title: "InvoiceMint — Free AI Invoice & Quote Generator",
    description:
      "Generate professional invoices and quotes instantly. Free AI tool for freelancers and businesses. No signup required.",
    type: "website",
    url: "https://invoicemint.cloud",
  },
  alternates: {
    canonical: "https://invoicemint.cloud",
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`}
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
