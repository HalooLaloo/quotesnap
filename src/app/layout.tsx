import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { PostHogProvider } from '@/components/PostHogProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'latin-ext'] })

export const metadata: Metadata = {
  title: {
    default: 'BrickQuote - AI-Powered Quotes for Contractors',
    template: '%s | BrickQuote',
  },
  description: 'Create professional quotes in minutes, not hours. AI analyzes client photos, suggests line items, and generates quotes automatically. Start your free trial.',
  keywords: ['quote software', 'contractor quotes', 'AI quotes', 'construction quotes', 'invoice generator', 'trade business software'],
  metadataBase: new URL('https://brickquote.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://brickquote.app',
    siteName: 'BrickQuote',
    title: 'BrickQuote - AI-Powered Quotes for Contractors',
    description: 'Create professional quotes in minutes, not hours. AI analyzes client photos, suggests line items, and generates quotes automatically.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BrickQuote - AI-Powered Quotes for Contractors',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BrickQuote - AI-Powered Quotes for Contractors',
    description: 'Create professional quotes in minutes, not hours. AI analyzes client photos and generates quotes automatically.',
    images: ['/og-image.png'],
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
        </PostHogProvider>
      </body>
    </html>
  )
}
