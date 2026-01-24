import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/requests')
  }

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
              Create professional quotes
              <span className="text-blue-400"> in minutes, not hours</span>
            </h1>

            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
              AI analyzes client photos, suggests line items, and generates quotes automatically.
              You just approve. Stop wasting time on spreadsheets and back-and-forth emails.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link
                href="/register"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition flex items-center justify-center gap-2"
              >
                Start 3-day free trial
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto border border-slate-600 hover:border-slate-500 text-white px-8 py-4 rounded-xl text-lg font-medium transition flex items-center justify-center gap-2"
              >
                See how it works
              </a>
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

          {/* App Screenshot Mockup */}
          <div className="relative max-w-5xl mx-auto">
            {/* Glow effects */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />

            {/* Browser mockup */}
            <div className="relative rounded-xl overflow-hidden border border-[#1e3a5f] bg-[#0d1f35] shadow-2xl">
              {/* Browser header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-[#132039] border-b border-[#1e3a5f]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1.5 rounded-md bg-[#0d1f35] text-slate-400 text-xs flex items-center gap-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                    </svg>
                    app.brickquote.app
                  </div>
                </div>
              </div>

              {/* App content preview */}
              <div className="p-6 bg-[#0a1628]">
                {/* Dashboard header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-white font-semibold">Your Quotes</h3>
                    <p className="text-slate-500 text-sm">3 pending client approval</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg">+ New Quote</div>
                  </div>
                </div>

                {/* Quote cards */}
                <div className="space-y-3">
                  <div className="p-4 bg-[#132039] rounded-lg border border-[#1e3a5f] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium">Bathroom Remodel - 123 Oak Street</p>
                        <p className="text-slate-500 text-sm">John Smith • Accepted</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">$8,500</p>
                      <p className="text-green-400 text-xs">Accepted</p>
                    </div>
                  </div>

                  <div className="p-4 bg-[#132039] rounded-lg border border-[#1e3a5f] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium">Interior Painting - 2,500 sqft</p>
                        <p className="text-slate-500 text-sm">Sarah Johnson • Pending</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">$4,200</p>
                      <p className="text-amber-400 text-xs">Sent</p>
                    </div>
                  </div>

                  <div className="p-4 bg-[#132039] rounded-lg border border-blue-500/50 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent" />
                    <div className="flex items-center gap-4 relative">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium flex items-center gap-2">
                          New Request
                          <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">AI</span>
                        </p>
                        <p className="text-slate-500 text-sm">Click to generate quote with AI</p>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg">Generate Quote</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -left-4 top-1/4 transform -translate-x-full hidden lg:block animate-pulse">
              <div className="bg-[#132039] border border-[#1e3a5f] rounded-lg p-3 shadow-xl">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Quote accepted!</p>
                    <p className="text-sm font-medium text-white">+$8,500</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 top-1/3 transform translate-x-full hidden lg:block animate-pulse" style={{ animationDelay: '1s' }}>
              <div className="bg-[#132039] border border-[#1e3a5f] rounded-lg p-3 shadow-xl">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">AI suggestion</p>
                    <p className="text-sm font-medium text-white">+3 items added</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
              <p className="text-slate-400 text-sm">Quote from photos</p>
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

            {/* Feature 6 */}
            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-6 hover:border-cyan-500/50 transition">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Email Notifications</h3>
              <p className="text-slate-400 text-sm">
                Send quotes via email and get notified when clients open them or accept.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Client Flow Preview */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
                <span className="text-sm text-green-400 font-medium">Client Experience</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Clients will love the simplicity
              </h2>
              <p className="text-slate-400 text-lg mb-8">
                No more endless email chains. Clients submit requests through your link,
                review quotes online, and accept with one click. Professional and hassle-free.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Photo upload form</h4>
                    <p className="text-slate-400 text-sm">Clients can attach photos and detailed project descriptions</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">AI conversation</h4>
                    <p className="text-slate-400 text-sm">Chatbot asks follow-up questions so you don't have to</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Online acceptance</h4>
                    <p className="text-slate-400 text-sm">Clients review and accept quotes without printing or scanning</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone mockup */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl" />
              <div className="relative bg-[#132039] border border-[#1e3a5f] rounded-[2.5rem] p-3 max-w-sm mx-auto">
                <div className="bg-[#0a1628] rounded-[2rem] overflow-hidden">
                  {/* Phone notch */}
                  <div className="h-6 bg-[#0a1628] flex items-center justify-center">
                    <div className="w-20 h-4 bg-black rounded-full" />
                  </div>

                  {/* Chat content */}
                  <div className="p-4 space-y-3">
                    <div className="flex justify-center mb-4">
                      <div className="px-3 py-1 bg-[#1e3a5f] rounded-full text-xs text-slate-400">
                        Today, 2:32 PM
                      </div>
                    </div>

                    {/* AI message */}
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div className="bg-[#1e3a5f] rounded-2xl rounded-tl-md p-3 max-w-[80%]">
                        <p className="text-white text-sm">Hi! What's the square footage of the bathroom you want to remodel?</p>
                      </div>
                    </div>

                    {/* User message */}
                    <div className="flex justify-end">
                      <div className="bg-blue-600 rounded-2xl rounded-tr-md p-3 max-w-[80%]">
                        <p className="text-white text-sm">About 65 sqft, I want new tiles and fixtures</p>
                      </div>
                    </div>

                    {/* AI message */}
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div className="bg-[#1e3a5f] rounded-2xl rounded-tl-md p-3 max-w-[80%]">
                        <p className="text-white text-sm">Got it! Have you already picked out tiles, or do you need recommendations?</p>
                      </div>
                    </div>

                    {/* Typing indicator */}
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div className="bg-[#1e3a5f] rounded-2xl rounded-tl-md p-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Input area */}
                  <div className="p-4 border-t border-[#1e3a5f]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#1e3a5f] rounded-full px-4 py-2">
                        <p className="text-slate-500 text-sm">Type a message...</p>
                      </div>
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 bg-[#0d1f35]/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Loved by contractors
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Join hundreds of contractors who save hours every week
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-6">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <p className="text-slate-300 mb-6">
                "Quotes used to take me 2 hours. Now I'm done in 10 minutes. The AI actually understands what's in the photos and suggests all the right items."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <span className="text-blue-400 font-medium">MJ</span>
                </div>
                <div>
                  <p className="text-white font-medium">Mike Johnson</p>
                  <p className="text-slate-500 text-sm">Johnson Renovations, Sydney</p>
                </div>
              </div>
            </div>

            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-6">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <p className="text-slate-300 mb-6">
                "Best part is clients accept quotes online. No more 'I'll call you back' - they just click accept and it's done. Game changer."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-green-400 font-medium">SW</span>
                </div>
                <div>
                  <p className="text-white font-medium">Sarah Williams</p>
                  <p className="text-slate-500 text-sm">Premier Painting Co, Melbourne</p>
                </div>
              </div>
            </div>

            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-6">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <p className="text-slate-300 mb-6">
                "The request link is brilliant. I put it on my website and clients fill in everything with photos. I just get a ready-to-quote notification."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <span className="text-purple-400 font-medium">DT</span>
                </div>
                <div>
                  <p className="text-white font-medium">David Thompson</p>
                  <p className="text-slate-500 text-sm">Thompson Plumbing, Brisbane</p>
                </div>
              </div>
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
                  <span className="text-slate-300">2 months free</span>
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
                'AI suggestions',
                'Client portal',
                'Online acceptance',
                'PDF generation',
                'Email notifications',
                'Service catalog',
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
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-4 bg-[#0d1f35]/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'How does the free trial work?',
                a: 'You get 3 days of full access to test everything. A credit card is required to start, but you won\'t be charged during the trial. Cancel anytime before it ends - no questions asked.',
              },
              {
                q: 'How does the AI quote generation work?',
                a: 'When a client submits a request with photos and description, our AI analyzes the content and suggests line items from your price list that match the project scope. You review and approve the suggestions, then send the quote.',
              },
              {
                q: 'Can I use BrickQuote on my phone?',
                a: 'Absolutely! BrickQuote is fully responsive and works great on phones and tablets. Your clients can also submit requests from their mobile devices.',
              },
              {
                q: 'Do my clients need an account?',
                a: 'No, clients don\'t need to create an account. They use your unique link to submit requests, view quotes, and accept them - all without signing up.',
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes, you can cancel your subscription at any time with no penalties. Your data stays safe, and you can reactivate anytime.',
              },
              {
                q: 'What currencies and countries do you support?',
                a: 'We support USD, GBP, AUD, CAD, EUR, NZD and more. Tax settings (VAT, GST) are automatically configured based on your country.',
              },
            ].map((faq, index) => (
              <div key={index} className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-6">
                <h3 className="text-white font-medium mb-2">{faq.q}</h3>
                <p className="text-slate-400 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to save hours on every quote?
          </h2>
          <p className="text-slate-400 text-lg mb-8">
            Join hundreds of contractors who already use BrickQuote.
            Start your free trial and send your first AI-powered quote today.
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
