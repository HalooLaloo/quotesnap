import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Jeśli zalogowany - przekieruj na dashboard
  if (user) {
    redirect('/requests')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a1628]">
      {/* Header */}
      <header className="border-b border-[#1e3a5f] bg-[#0a1628]/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
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
          <div className="flex gap-3">
            <Link href="/login" className="btn-ghost">
              Zaloguj
            </Link>
            <Link href="/register" className="btn-primary">
              Rejestracja
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-3xl text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Profesjonalne wyceny
            <span className="text-blue-400"> w kilka minut</span>
          </h1>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            Twórz, wysyłaj i zarządzaj wycenami dla swojego biznesu budowlanego.
            Twoje ceny, Twoje usługi, Twój sposób.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register" className="btn-primary text-lg px-8 py-3">
              Rozpocznij za darmo
            </Link>
            <Link href="/login" className="btn-secondary text-lg px-8 py-3">
              Zaloguj się
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="card text-left">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Twój cennik</h3>
              <p className="text-slate-400 text-sm">
                Stwórz własny katalog usług z cenami. Aktualizuj kiedy chcesz.
              </p>
            </div>

            <div className="card text-left">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Zapytania klientów</h3>
              <p className="text-slate-400 text-sm">
                Otrzymuj zapytania o wycenę ze zdjęciami i opisami od klientów.
              </p>
            </div>

            <div className="card text-left">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Szybka akceptacja</h3>
              <p className="text-slate-400 text-sm">
                Klienci mogą przeglądać i akceptować wyceny online. Koniec z wymianą maili.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1e3a5f] py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-500 text-sm">
          © 2025 BrickQuote. Wszelkie prawa zastrzeżone.
        </div>
      </footer>
    </div>
  )
}
