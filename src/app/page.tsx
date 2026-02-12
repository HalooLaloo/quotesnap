import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FAQSection } from '@/components/FAQSection'
import { HeroMockup } from '@/components/HeroMockup'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/requests')
  }

  const demoUserId = process.env.NEXT_PUBLIC_DEMO_USER_ID

  return (
    <div className="min-h-screen bg-[#0a1628]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a1628]/90 backdrop-blur-md border-b border-[#1e3a5f]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
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
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-slate-400 hover:text-white text-sm font-medium transition">How it works</a>
              <a href="#features" className="text-slate-400 hover:text-white text-sm font-medium transition">Features</a>
              <a href="#pricing" className="text-slate-400 hover:text-white text-sm font-medium transition">Pricing</a>
              <a href="#faq" className="text-slate-400 hover:text-white text-sm font-medium transition">FAQ</a>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login" className="text-slate-300 hover:text-white text-sm font-medium transition">
                Log in
              </Link>
              <Link href="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-4xl mx-auto mb-16">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm text-blue-400 font-medium">AI-Powered</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              AI runs your quoting.
              <span className="text-blue-400"> You run the business.</span>
            </h1>

            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
              AI chatbot collects project details and photos from your clients. You get ready-made quotes,
              send professional PDFs, track payments, and convert to invoices — all from one dashboard.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              {demoUserId ? (
                <Link
                  href={`/request/${demoUserId}`}
                  className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  See how clients request quotes
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              ) : null}
              <Link
                href="/register"
                className={`w-full sm:w-auto ${demoUserId ? 'border border-slate-600 hover:border-slate-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} px-8 py-4 rounded-xl text-lg font-semibold transition flex items-center justify-center gap-2`}
              >
                Start 3-day free trial
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-slate-500 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>3-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Setup in 5 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* App Screenshot Mockup with tabs */}
          <HeroMockup />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 border-y border-[#1e3a5f] bg-[#0d1f35]/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-white mb-1">Hours → 5 min</p>
              <p className="text-slate-400 text-sm">Quote creation time</p>
            </div>
            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-white mb-1">No site visit</p>
              <p className="text-slate-400 text-sm">Photos + AI interview</p>
            </div>
            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-white mb-1">Zero paperwork</p>
              <p className="text-slate-400 text-sm">100% digital</p>
            </div>
            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-white mb-1">24/7</p>
              <p className="text-slate-400 text-sm">Clients request anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* No App Needed Banner */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left">
            <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-1">No app needed for your clients</h3>
              <p className="text-slate-400">They just click your link, upload photos, and chat with AI. Works on any phone or computer - nothing to download.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How it works
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              From client request to accepted quote in 4 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4 relative">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Share your link</h3>
              <p className="text-slate-400 text-sm">
                Send clients your unique request link. They can attach photos and describe their project.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4 relative">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">AI gathers details</h3>
              <p className="text-slate-400 text-sm">
                AI chatbot asks smart questions and collects all project details. You get a clean summary with photos.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-4 relative">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">One-click quote</h3>
              <p className="text-slate-400 text-sm">
                AI analyzes everything and suggests line items. Review, adjust if needed, and generate a professional PDF.
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-4 relative">
                <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center text-white text-xs font-bold">4</div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Send & get accepted</h3>
              <p className="text-slate-400 text-sm">
                Client receives a professional PDF and can accept your quote online with one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section id="features" className="py-24 px-4 bg-[#0d1f35]/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-sm text-purple-400 font-medium">AI Features</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              AI does the heavy lifting
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Focus on the actual work, not the paperwork
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-6 hover:border-blue-500/50 transition">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Photo Analysis</h3>
              <p className="text-slate-400 text-sm">
                AI recognizes scope of work from client photos. It sees wall conditions, dimensions, and needed repairs.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-6 hover:border-purple-500/50 transition">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Smart Chatbot</h3>
              <p className="text-slate-400 text-sm">
                AI chatbot asks your clients the right questions and gathers all project details for you.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-6 hover:border-green-500/50 transition">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Line Item Suggestions</h3>
              <p className="text-slate-400 text-sm">
                AI suggests all quote items based on project description. Even the ones you might forget.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-6 hover:border-amber-500/50 transition">
              <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Service Catalog</h3>
              <p className="text-slate-400 text-sm">
                Create your price list once and reuse it forever. AI can even help you build it from scratch.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-6 hover:border-red-500/50 transition">
              <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Professional PDFs</h3>
              <p className="text-slate-400 text-sm">
                Generate beautiful quotes and invoices with your logo and company details in one click.
              </p>
            </div>

            {/* Feature 6 - Invoicing */}
            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-6 hover:border-cyan-500/50 transition">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Invoicing Built In</h3>
              <p className="text-slate-400 text-sm">
                Convert accepted quotes to invoices in one click. Track payments, send reminders, and mark as paid.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Built for every trade */}
      <section className="py-24 px-4 bg-[#0d1f35]/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Built for every trade
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Whether you paint walls or rewire houses — BrickQuote handles your quotes and invoices
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: '🎨', name: 'Painters', desc: 'Walls, ceilings, trim' },
              { icon: '🔲', name: 'Tilers', desc: 'Floors, bathrooms, kitchens' },
              { icon: '🔧', name: 'Plumbers', desc: 'Pipes, fixtures, drains' },
              { icon: '⚡', name: 'Electricians', desc: 'Wiring, outlets, panels' },
              { icon: '🪚', name: 'Carpenters', desc: 'Cabinets, doors, decks' },
              { icon: '🏗️', name: 'General', desc: 'Full renovations' },
            ].map((trade) => (
              <div key={trade.name} className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-5 text-center hover:border-blue-500/50 transition">
                <div className="text-3xl mb-3">{trade.icon}</div>
                <h3 className="text-white font-semibold text-sm mb-1">{trade.name}</h3>
                <p className="text-slate-500 text-xs">{trade.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 bg-[#132039] border border-[#1e3a5f] rounded-xl px-6 py-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-slate-300 text-sm text-left">
                <span className="text-white font-medium">Set up your price list once</span> — AI uses it to generate accurate quotes for every new client request.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Start with a 3-day free trial. Cancel anytime.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Monthly */}
            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-blue-600 text-white text-sm font-medium px-3 py-1 rounded-full">
                  3-day free trial
                </span>
              </div>

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Monthly</h3>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-4xl font-bold text-white">$29</span>
                  <span className="text-slate-400">/month</span>
                </div>
                <p className="text-slate-400 text-sm">after 3-day free trial</p>
              </div>

              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">All features included</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">Cancel anytime</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">Flexible billing</span>
                </li>
              </ul>

              <Link
                href="/register"
                className="block text-center w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold transition"
              >
                Start free trial
              </Link>
            </div>

            {/* Yearly */}
            <div className="bg-[#132039] border-2 border-green-500 rounded-xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-green-500 text-white text-sm font-medium px-3 py-1 rounded-full">
                  Best value - Save $99
                </span>
              </div>

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Yearly</h3>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-4xl font-bold text-white">$249</span>
                  <span className="text-slate-400">/year</span>
                </div>
                <p className="text-slate-400 text-sm">
                  <span className="line-through">$348</span> after 3-day free trial
                </p>
              </div>

              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">All features included</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">Save $99 (3+ months free)</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">Priority support</span>
                </li>
              </ul>

              <Link
                href="/register"
                className="block text-center w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition"
              >
                Start free trial - Save $99
              </Link>
            </div>
          </div>

          {/* Features list below */}
          <div className="mt-12 max-w-2xl mx-auto">
            <h4 className="text-center text-white font-semibold mb-6">Everything included in both plans:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                'Unlimited quotes',
                'Unlimited invoices',
                'AI photo analysis',
                'AI quote suggestions',
                'Client request portal',
                'Online acceptance',
                'PDF generation',
                'Email notifications',
                'Service catalog',
                'Payment tracking',
                'Payment reminders',
                'Multi-currency support',
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-400">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-500 text-center mt-8">
            Credit card required for trial • Cancel anytime before trial ends • 30-day money-back guarantee
          </p>

          {/* Money back guarantee */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm text-green-400 font-medium">30-day money-back guarantee</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection />

      {/* Final CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to save hours on every quote?
          </h2>
          <p className="text-slate-400 text-lg mb-8">
            Stop writing quotes by hand. Let AI handle the details
            while you focus on the work that pays.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition"
          >
            Start 3-day free trial
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <p className="text-slate-500 text-sm mt-4">
            3-day free trial • Setup in 5 minutes • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-[#1e3a5f]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#132039] flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="2" y="6" width="9" height="5" rx="0.5" />
                  <rect x="13" y="6" width="9" height="5" rx="0.5" />
                  <rect x="6" y="13" width="9" height="5" rx="0.5" />
                  <rect x="17" y="13" width="5" height="5" rx="0.5" />
                  <rect x="2" y="13" width="2" height="5" rx="0.5" />
                </svg>
              </div>
              <span className="text-lg font-bold text-white">BrickQuote</span>
            </div>

            <div className="flex gap-8 text-sm">
              <Link href="/privacy" className="text-slate-400 hover:text-white transition">Privacy Policy</Link>
              <Link href="/terms" className="text-slate-400 hover:text-white transition">Terms of Service</Link>
              <Link href="/contact" className="text-slate-400 hover:text-white transition">Contact</Link>
            </div>

            <p className="text-slate-500 text-sm">
              © 2026 BrickQuote. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
