import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Free AI Invoice Description Generator | Professional Invoice Text",
  description:
    "Generate professional invoice line items, payment terms, and thank-you notes instantly with AI. Free invoice description generator for freelancers and small businesses.",
  keywords:
    "invoice description generator, AI invoice generator, free invoice tool, invoice line items, professional invoice text",
  openGraph: {
    title: "Free AI Invoice Description Generator",
    description:
      "Generate professional invoice descriptions instantly. Free AI tool for freelancers and businesses.",
    type: "website",
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
