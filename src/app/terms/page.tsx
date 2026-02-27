import Link from 'next/link'
import { BackButton } from '@/components/BackButton'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#0a1628]">
      {/* Navigation */}
      <nav className="border-b border-[#1e3a5f] bg-[#0a1628]" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <div className="w-8 h-8 rounded-lg bg-[#132039] flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="6" width="9.5" height="5" rx="0.7" />
                <rect x="12.5" y="6" width="9.5" height="5" rx="0.7" />
                <rect x="2" y="12.5" width="3.5" height="5" rx="0.7" />
                <rect x="6.5" y="12.5" width="9.5" height="5" rx="0.7" />
                <rect x="17" y="12.5" width="5" height="5" rx="0.7" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">BrickQuote</span>
          </Link>
          <BackButton />
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Terms of Service</h1>

        <div className="prose prose-invert prose-slate max-w-none space-y-6 text-slate-300">
          <p className="text-slate-400">Last updated: January 2026</p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">1. Agreement to Terms</h2>
            <p>
              By accessing or using BrickQuote, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use our service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">2. Description of Service</h2>
            <p>
              BrickQuote is a software-as-a-service (SaaS) platform that helps contractors create, send, and manage quotes and invoices. Our service includes AI-powered features to assist with quote generation.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">3. Account Registration</h2>
            <p>To use BrickQuote, you must:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Be at least 18 years old</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">4. Subscription and Payment</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Free trial: 3 days with full access, credit card required</li>
              <li>After the trial, your card will be charged automatically</li>
              <li>Subscriptions renew automatically unless cancelled</li>
              <li>You may cancel at any time before your next billing cycle</li>
              <li>Refunds are available within 30 days of initial purchase</li>
              <li>Prices may change with 30 days notice</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the service for any illegal purpose</li>
              <li>Upload malicious code or content</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with other users&apos; access to the service</li>
              <li>Resell or redistribute the service without permission</li>
              <li>Use the service to send spam or unsolicited messages</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">6. Your Content</h2>
            <p>
              You retain ownership of all content you upload to BrickQuote. By uploading content, you grant us a limited license to store, process, and display that content as necessary to provide our service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">7. AI-Generated Content</h2>
            <p>
              Our AI features provide suggestions for quote line items. These suggestions are for assistance only. You are responsible for reviewing and approving all content before sending to clients. We do not guarantee the accuracy of AI-generated suggestions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">8. Limitation of Liability</h2>
            <p>
              BrickQuote is provided &quot;as is&quot; without warranties of any kind. We are not liable for any indirect, incidental, special, or consequential damages. Our total liability is limited to the amount you paid us in the 12 months preceding the claim.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">9. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless BrickQuote and its team from any claims arising from your use of the service or violation of these terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">10. Service Availability</h2>
            <p>
              We strive for high availability but do not guarantee uninterrupted service. We may perform maintenance or updates that temporarily affect access. We will provide notice when possible.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">11. Termination</h2>
            <p>
              We may suspend or terminate your account for violation of these terms. You may cancel your account at any time. Upon termination, your right to use the service ceases immediately.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">12. Changes to Terms</h2>
            <p>
              We may modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms. Material changes will be communicated via email.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">13. Governing Law</h2>
            <p>
              These terms are governed by the laws of Australia. Any disputes will be resolved in the courts of New South Wales, Australia.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">14. Contact</h2>
            <p>
              For questions about these Terms, contact us at{' '}
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
