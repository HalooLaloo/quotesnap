import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { PostHogProvider } from '@/components/PostHogProvider'
import { CookieConsent } from '@/components/CookieConsent'
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased`}>
        <PostHogProvider>
          {children}
          <CookieConsent />
        </PostHogProvider>
      </body>
    </html>
  )
}
