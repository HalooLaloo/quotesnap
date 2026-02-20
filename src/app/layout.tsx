import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { PostHogProvider } from '@/components/PostHogProvider'
import { CookieConsent } from '@/components/CookieConsent'
import { CapacitorInit } from '@/components/CapacitorInit'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'latin-ext'] })

export const metadata: Metadata = {
  title: {
    default: 'BrickQuote - AI Quotes & Invoices for Contractors',
    template: '%s | BrickQuote',
  },
  description: 'AI runs your quoting. Chatbot collects project details from clients, generates ready-made quotes, and converts them to invoices. Start your free trial.',
  keywords: ['quote software', 'contractor quotes', 'AI quotes', 'construction quotes', 'invoice generator', 'trade business software'],
  metadataBase: new URL('https://brickquote.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://brickquote.app',
    siteName: 'BrickQuote',
    title: 'BrickQuote - AI Quotes & Invoices for Contractors',
    description: 'AI chatbot collects project details from your clients. You get ready-made quotes, professional PDFs, and invoicing — all from one dashboard.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BrickQuote - AI Quotes & Invoices for Contractors',
    description: 'AI chatbot collects project details from your clients. You get ready-made quotes, professional PDFs, and invoicing — all from one dashboard.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <PostHogProvider>
          <CapacitorInit />
          {children}
          <CookieConsent />
        </PostHogProvider>
      </body>
    </html>
  )
}
