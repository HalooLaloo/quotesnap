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
              <a href="#jak-to-dziala" className="text-slate-400 hover:text-white text-sm font-medium transition">Jak to działa</a>
              <a href="#funkcje" className="text-slate-400 hover:text-white text-sm font-medium transition">Funkcje</a>
              <a href="#cennik" className="text-slate-400 hover:text-white text-sm font-medium transition">Cennik</a>
              <a href="#faq" className="text-slate-400 hover:text-white text-sm font-medium transition">FAQ</a>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login" className="text-slate-300 hover:text-white text-sm font-medium transition">
                Zaloguj
              </Link>
              <Link href="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                Rozpocznij za darmo
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
              <span className="text-sm text-blue-400 font-medium">Wspierane przez AI</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Twórz profesjonalne wyceny
              <span className="text-blue-400"> w kilka minut</span>
            </h1>

            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
              AI analizuje zdjęcia od klientów, sugeruje pozycje i generuje wyceny.
              Ty tylko zatwierdzasz. Koniec z godzinami spędzonymi na mailach i arkuszach kalkulacyjnych.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link
                href="/register"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition flex items-center justify-center gap-2"
              >
                Rozpocznij za darmo
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <a
                href="#jak-to-dziala"
                className="w-full sm:w-auto border border-slate-600 hover:border-slate-500 text-white px-8 py-4 rounded-xl text-lg font-medium transition flex items-center justify-center gap-2"
              >
                Zobacz jak to działa
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-slate-500 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Bez karty kredytowej</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Gotowe w 5 minut</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Darmowy plan na zawsze</span>
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
                    <h3 className="text-white font-semibold">Twoje wyceny</h3>
                    <p className="text-slate-500 text-sm">3 oczekujące na akceptację</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg">+ Nowa wycena</div>
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
                        <p className="text-white font-medium">Remont łazienki - ul. Kwiatowa 15</p>
                        <p className="text-slate-500 text-sm">Jan Kowalski • Zaakceptowana</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">12 500 zł</p>
                      <p className="text-green-400 text-xs">Zaakceptowana</p>
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
                        <p className="text-white font-medium">Malowanie mieszkania 65m²</p>
                        <p className="text-slate-500 text-sm">Anna Nowak • Oczekuje</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">4 200 zł</p>
                      <p className="text-amber-400 text-xs">Wysłana</p>
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
                          Nowe zapytanie
                          <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">AI</span>
                        </p>
                        <p className="text-slate-500 text-sm">Kliknij, aby wygenerować wycenę z AI</p>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg">Generuj wycenę</div>
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
                    <p className="text-xs text-slate-400">Wycena zaakceptowana</p>
                    <p className="text-sm font-medium text-white">+8 500 zł</p>
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
                    <p className="text-xs text-slate-400">AI sugestia</p>
                    <p className="text-sm font-medium text-white">+3 pozycje dodane</p>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-white mb-2">80%</p>
              <p className="text-slate-400">Szybsze tworzenie wycen</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white mb-2">5 min</p>
              <p className="text-slate-400">Średni czas na wycenę</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white mb-2">0 zł</p>
              <p className="text-slate-400">Na start, bez limitu</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white mb-2">24/7</p>
              <p className="text-slate-400">Klienci mogą wysyłać zapytania</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="jak-to-dziala" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Jak to działa?
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Od zapytania klienta do zaakceptowanej wyceny w 4 prostych krokach
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
              <h3 className="text-lg font-semibold text-white mb-2">Udostępnij link</h3>
              <p className="text-slate-400 text-sm">
                Wyślij klientowi unikalny link do formularza zapytania. Może załączyć zdjęcia i opis.
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
              <h3 className="text-lg font-semibold text-white mb-2">AI rozmawia z klientem</h3>
              <p className="text-slate-400 text-sm">
                Nasz chatbot AI zadaje pytania i zbiera wszystkie szczegóły projektu automatycznie.
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
              <h3 className="text-lg font-semibold text-white mb-2">Generuj wycenę jednym klikiem</h3>
              <p className="text-slate-400 text-sm">
                AI analizuje zdjęcia i opis, sugeruje pozycje z Twojego cennika. Ty tylko zatwierdzasz.
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
              <h3 className="text-lg font-semibold text-white mb-2">Wyślij i czekaj na akceptację</h3>
              <p className="text-slate-400 text-sm">
                Klient otrzymuje profesjonalny PDF i może zaakceptować wycenę online jednym klikiem.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section id="funkcje" className="py-24 px-4 bg-[#0d1f35]/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-sm text-purple-400 font-medium">Funkcje AI</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              AI robi za Ciebie brudną robotę
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Skup się na wykonaniu pracy, a nie na papierkowej robocie
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
              <h3 className="text-lg font-semibold text-white mb-2">Analiza zdjęć</h3>
              <p className="text-slate-400 text-sm">
                AI rozpoznaje zakres prac na podstawie zdjęć klienta. Widzi stan ścian, wymiary, potrzebne naprawy.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-6 hover:border-purple-500/50 transition">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Inteligentny chatbot</h3>
              <p className="text-slate-400 text-sm">
                Chatbot zadaje klientowi celne pytania i zbiera wszystkie szczegóły projektu za Ciebie.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-6 hover:border-green-500/50 transition">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Sugestie pozycji</h3>
              <p className="text-slate-400 text-sm">
                AI sugeruje wszystkie pozycje wyceny na podstawie opisu. Nawet te, o których mógłbyś zapomnieć.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-6 hover:border-amber-500/50 transition">
              <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Katalog usług</h3>
              <p className="text-slate-400 text-sm">
                Stwórz swój cennik raz i używaj go wielokrotnie. AI też pomoże Ci go stworzyć od zera.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-6 hover:border-red-500/50 transition">
              <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Profesjonalne PDF</h3>
              <p className="text-slate-400 text-sm">
                Generuj eleganckie wyceny i faktury PDF z Twoim logo i danymi firmy jednym klikiem.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-6 hover:border-cyan-500/50 transition">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Powiadomienia email</h3>
              <p className="text-slate-400 text-sm">
                Wysyłaj wyceny mailem, a system poinformuje Cię gdy klient je otworzy lub zaakceptuje.
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
                <span className="text-sm text-green-400 font-medium">Dla Twoich klientów</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Klienci pokochają prostotę
              </h2>
              <p className="text-slate-400 text-lg mb-8">
                Koniec z niekończącą się wymianą maili. Klient wysyła zapytanie przez link,
                przegląda wycenę online i akceptuje jednym klikiem. Profesjonalnie i bez komplikacji.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Formularz ze zdjęciami</h4>
                    <p className="text-slate-400 text-sm">Klient może załączyć zdjęcia i szczegółowy opis projektu</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Rozmowa z AI</h4>
                    <p className="text-slate-400 text-sm">Chatbot dopyta o wszystkie szczegóły, żebyś Ty nie musiał</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Akceptacja online</h4>
                    <p className="text-slate-400 text-sm">Klient przegląda wycenę i akceptuje bez drukowania czy skanowania</p>
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
                        Dziś, 14:32
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
                        <p className="text-white text-sm">Cześć! Jaki metraż ma łazienka do remontu?</p>
                      </div>
                    </div>

                    {/* User message */}
                    <div className="flex justify-end">
                      <div className="bg-blue-600 rounded-2xl rounded-tr-md p-3 max-w-[80%]">
                        <p className="text-white text-sm">Około 6m², chcę wymienić płytki i armaturę</p>
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
                        <p className="text-white text-sm">Rozumiem! Czy masz już wybrane płytki, czy potrzebujesz pomocy w wyborze?</p>
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
                        <p className="text-slate-500 text-sm">Napisz wiadomość...</p>
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
              Co mówią nasi użytkownicy
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Dołącz do grona zadowolonych wykonawców
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
                "Kiedyś wycena zajmowała mi 2 godziny. Teraz robię to w 10 minut. AI naprawdę rozumie co jest na zdjęciach i podpowiada wszystkie pozycje."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <span className="text-blue-400 font-medium">MK</span>
                </div>
                <div>
                  <p className="text-white font-medium">Marek Kowalczyk</p>
                  <p className="text-slate-500 text-sm">Remonty kompleksowe, Warszawa</p>
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
                "Najlepsze jest to, że klienci sami akceptują wyceny online. Zero dzwonienia, zero 'zaraz oddzwonię'. Wszystko jest jasne i przejrzyste."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-green-400 font-medium">AN</span>
                </div>
                <div>
                  <p className="text-white font-medium">Anna Nowak</p>
                  <p className="text-slate-500 text-sm">Malowanie wnętrz, Kraków</p>
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
                "Link do zapytań to świetna sprawa. Daję go klientom na stronie i oni sami wypełniają wszystko ze zdjęciami. Ja dostaję gotowe zapytanie."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <span className="text-purple-400 font-medium">PW</span>
                </div>
                <div>
                  <p className="text-white font-medium">Piotr Wiśniewski</p>
                  <p className="text-slate-500 text-sm">Hydraulika, Gdańsk</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="cennik" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Prosty, uczciwy cennik
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Zacznij za darmo, rozwijaj się w swoim tempie
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-2">Darmowy</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold text-white">0 zł</span>
                <span className="text-slate-400">/miesiąc</span>
              </div>
              <p className="text-slate-400 text-sm mb-6">Na zawsze, bez limitu czasowego</p>

              <ul className="space-y-3 mb-8">
                {[
                  'Do 10 wycen miesięcznie',
                  'Katalog usług',
                  'Generowanie PDF',
                  'Link do zapytań dla klientów',
                  'Akceptacja wycen online',
                  'Powiadomienia email',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className="block text-center w-full border border-slate-600 hover:border-slate-500 text-white py-3 rounded-lg font-medium transition"
              >
                Rozpocznij za darmo
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-[#132039] border-2 border-blue-500 rounded-xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-blue-600 text-white text-sm font-medium px-3 py-1 rounded-full">
                  Najpopularniejszy
                </span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold text-white">49 zł</span>
                <span className="text-slate-400">/miesiąc</span>
              </div>
              <p className="text-slate-400 text-sm mb-6">Dla profesjonalnych wykonawców</p>

              <ul className="space-y-3 mb-8">
                {[
                  'Nieograniczone wyceny',
                  'AI sugestie pozycji',
                  'AI analiza zdjęć',
                  'AI chatbot dla klientów',
                  'Faktury i śledzenie płatności',
                  'Własne logo na dokumentach',
                  'Priorytetowe wsparcie',
                ].map((feature, index) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className={index < 4 ? "text-blue-300 font-medium" : "text-slate-300"}>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className="block text-center w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition"
              >
                Wypróbuj 14 dni za darmo
              </Link>
              <p className="text-xs text-slate-500 text-center mt-3">
                Bez karty kredytowej
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-4 bg-[#0d1f35]/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Często zadawane pytania
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Czy muszę podawać kartę kredytową, żeby zacząć?',
                a: 'Nie! Plan darmowy jest całkowicie za darmo i nie wymaga karty. Możesz korzystać z niego bez limitu czasowego.',
              },
              {
                q: 'Jak działa AI sugestia pozycji?',
                a: 'Kiedy klient wysyła zapytanie ze zdjęciami i opisem, AI analizuje treść i sugeruje pozycje z Twojego cennika, które pasują do projektu. Ty tylko zatwierdzasz lub modyfikujesz.',
              },
              {
                q: 'Czy mogę używać BrickQuote na telefonie?',
                a: 'Tak! Aplikacja jest w pełni responsywna i działa świetnie na telefonach i tabletach. Twoi klienci też mogą wysyłać zapytania z telefonu.',
              },
              {
                q: 'Co jeśli klient nie ma konta?',
                a: 'Klient nie potrzebuje konta! Wysyłasz mu link, on wypełnia formularz, przegląda wycenę i akceptuje - wszystko bez rejestracji.',
              },
              {
                q: 'Czy mogę anulować subskrypcję w dowolnym momencie?',
                a: 'Oczywiście. Możesz anulować kiedy chcesz, bez żadnych opłat. Twoje dane pozostaną bezpieczne i będziesz mógł wrócić do planu Pro w przyszłości.',
              },
              {
                q: 'Czy BrickQuote obsługuje faktury?',
                a: 'Tak! Plan Pro pozwala tworzyć faktury bezpośrednio z zaakceptowanych wycen, wysyłać je do klientów i śledzić płatności.',
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
            Gotowy, żeby oszczędzać czas na wycenach?
          </h2>
          <p className="text-slate-400 text-lg mb-8">
            Dołącz do setek wykonawców, którzy już używają BrickQuote.
            Twoja pierwsza wycena może być gotowa za 5 minut.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition"
          >
            Rozpocznij za darmo
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <p className="text-slate-500 text-sm mt-4">
            Bez karty kredytowej • Gotowe w 5 minut • Darmowy plan na zawsze
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
              <a href="#" className="text-slate-400 hover:text-white transition">Polityka prywatności</a>
              <a href="#" className="text-slate-400 hover:text-white transition">Regulamin</a>
              <a href="#" className="text-slate-400 hover:text-white transition">Kontakt</a>
            </div>

            <p className="text-slate-500 text-sm">
              © 2025 BrickQuote. Wszelkie prawa zastrzeżone.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
