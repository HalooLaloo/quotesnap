import Link from 'next/link'
import { Metadata } from 'next'
import { BackButton } from '@/components/BackButton'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'BrickQuote privacy policy. Learn how we handle your data and protect your privacy.',
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0a1628]">
      {/* Navigation */}
      <nav className="border-b border-[#1e3a5f] bg-[#0a1628]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <div className="w-8 h-8 rounded-lg bg-[#132039] flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="6" width="9" height="5" rx="0.5" />
                <rect x="13" y="6" width="9" height="5" rx="0.5" />
                <rect x="6" y="13" width="9" height="5" rx="0.5" />
                <rect x="17" y="13" width="5" height="5" rx="0.5" />
                <rect x="2" y="13" width="2" height="5" rx="0.5" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">BrickQuote</span>
          </Link>
          <BackButton />
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>

        <div className="prose prose-invert prose-slate max-w-none space-y-6 text-slate-300">
          <p className="text-slate-400">Last updated: January 2026</p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">1. Introduction</h2>
            <p>
              BrickQuote (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">2. Information We Collect</h2>
            <p>We collect information you provide directly to us, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account information (name, email, password)</li>
              <li>Business information (company name, address, phone number)</li>
              <li>Quote and invoice data you create</li>
              <li>Photos uploaded by you or your clients</li>
              <li>Communications with our support team</li>
              <li>Payment information (processed securely by Stripe)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Analyze usage patterns to improve user experience</li>
              <li>Detect and prevent fraud and abuse</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">4. AI Processing</h2>
            <p>
              Our service uses artificial intelligence to analyze photos and project descriptions to suggest quote line items. This processing is done to provide you with accurate and efficient quoting capabilities. We do not use your data to train AI models.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">5. Data Sharing</h2>
            <p>We do not sell your personal information. We may share your information with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Service providers who assist in our operations (hosting, payment processing)</li>
              <li>Professional advisors (lawyers, accountants) when necessary</li>
              <li>Law enforcement when required by law</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">6. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information. All data is encrypted in transit and at rest. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">7. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide you services. You can request deletion of your data at any time by contacting us.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">8. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">9. Cookies</h2>
            <p>
              We use cookies and similar technologies to maintain your session and preferences. You can control cookies through your browser settings.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:contact@brickquote.app" className="text-blue-400 hover:text-blue-300">
                contact@brickquote.app
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-[#1e3a5f]">
        <div className="max-w-4xl mx-auto text-center text-slate-500 text-sm">
          © 2026 BrickQuote. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
