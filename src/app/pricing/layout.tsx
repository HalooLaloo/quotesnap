import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for BrickQuote. Start with a 3-day free trial. Monthly ($29/mo) or Yearly ($249/yr) plans available.',
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
