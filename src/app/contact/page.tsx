import Link from 'next/link'

export default function Contact() {
  return (
    <div className="min-h-screen bg-[#0a1628]">
      {/* Navigation */}
      <nav className="border-b border-[#1e3a5f] bg-[#0a1628]">
        <div className="max-w-4xl mx-auto px-4 py-4">
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
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Contact Us</h1>
          <p className="text-slate-400 mb-12">
            Have questions or need help? We're here for you.
          </p>

          <div className="space-y-6">
            {/* Email */}
            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-6">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">Email Support</h2>
              <p className="text-slate-400 mb-4">
                For general inquiries and support
              </p>
              <a
                href="mailto:support@brickquote.app"
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                support@brickquote.app
              </a>
            </div>

            {/* Response Time */}
            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-6">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">Response Time</h2>
              <p className="text-slate-400">
                We typically respond within 24 hours on business days.
                Pro subscribers get priority support.
              </p>
            </div>

            {/* FAQ Link */}
            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-6">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">FAQ</h2>
              <p className="text-slate-400 mb-4">
                Find quick answers to common questions
              </p>
              <Link
                href="/#faq"
                className="text-purple-400 hover:text-purple-300 font-medium"
              >
                View FAQ →
              </Link>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-2">Not a customer yet?</h3>
            <p className="text-slate-400 mb-4">
              Try BrickQuote free for 3 days and see how it transforms your quoting process.
            </p>
            <Link
              href="/register"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              Start Free Trial
            </Link>
          </div>
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
