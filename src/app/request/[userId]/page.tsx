'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ClientRequestPage() {
  const params = useParams()
  const contractorId = params.userId as string
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Cześć! 👋 Jestem asystentem, który pomoże Ci opisać zakres prac remontowych.\n\nPowiedz mi, co chciałbyś zrobić? Na przykład: pomalować pokój, wyremontować łazienkę, położyć płytki...',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [showContactForm, setShowContactForm] = useState(false)
  const [contactData, setContactData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Licznik pytań (ile odpowiedzi dał użytkownik)
  const userMessagesCount = messages.filter(m => m.role === 'user').length
  const estimatedTotalQuestions = 8 // Szacowana liczba pytań do zebrania pełnych informacji

  // Auto-scroll do najnowszej wiadomości
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus na input po załadowaniu
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    // Dodaj wiadomość użytkownika
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          contractorId,
        }),
      })

      const data = await response.json()

      if (data.error) {
        setMessages([...newMessages, {
          role: 'assistant',
          content: 'Przepraszam, wystąpił błąd. Spróbuj ponownie.',
        }])
      } else {
        setMessages([...newMessages, {
          role: 'assistant',
          content: data.message,
        }])

        // Sprawdź czy jest podsumowanie
        if (data.hasSummary) {
          // Wyciągnij podsumowanie
          const summaryMatch = data.message.match(/---PODSUMOWANIE---([\s\S]*?)---KONIEC---/)
          if (summaryMatch) {
            setSummary(summaryMatch[1].trim())
            setShowContactForm(true)
          }
        }
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages([...newMessages, {
        role: 'assistant',
        content: 'Przepraszam, wystąpił błąd połączenia. Spróbuj ponownie.',
      }])
    }

    setLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleSubmitRequest = async () => {
    if (!contactData.client_name.trim()) {
      alert('Podaj swoje imię')
      return
    }

    setSubmitting(true)

    // Przygotuj pełny opis z rozmowy i podsumowania
    const conversationLog = messages
      .map(m => `${m.role === 'user' ? 'Klient' : 'Asystent'}: ${m.content}`)
      .join('\n\n')

    const fullDescription = `${summary}\n\n---ROZMOWA---\n${conversationLog}`

    const { error } = await supabase
      .from('qs_quote_requests')
      .insert({
        contractor_id: contractorId,
        client_name: contactData.client_name,
        client_email: contactData.client_email || null,
        client_phone: contactData.client_phone || null,
        description: fullDescription,
        photos: [],
        status: 'new',
      })

    if (error) {
      console.error('Error:', error)
      alert('Wystąpił błąd. Spróbuj ponownie.')
    } else {
      setSubmitted(true)
    }

    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Zapytanie wysłane!</h1>
          <p className="text-slate-400 mb-6">
            Dziękujemy! Wykonawca otrzymał Twoje zapytanie i wkrótce przygotuje wycenę.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">Q</span>
          </div>
          <div className="flex-1">
            <h1 className="text-white font-semibold">QuoteSnap</h1>
            <p className="text-slate-400 text-sm">Asystent wycen</p>
          </div>
          {/* Licznik pytań */}
          {!showContactForm && userMessagesCount > 0 && (
            <div className="text-right">
              <div className="text-white font-medium text-sm">
                {userMessagesCount} / ~{estimatedTotalQuestions}
              </div>
              <div className="text-slate-400 text-xs">odpowiedzi</div>
              {/* Pasek postępu */}
              <div className="w-20 h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((userMessagesCount / estimatedTotalQuestions) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-100'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-700 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Contact form overlay */}
      {showContactForm && (
        <div className="bg-slate-800 border-t border-slate-700 px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <div className="card bg-green-600/10 border-green-500/30 mb-4">
              <h3 className="text-white font-semibold mb-2">✅ Zakres prac ustalony!</h3>
              <p className="text-slate-300 text-sm">
                Teraz podaj swoje dane kontaktowe, żeby wykonawca mógł się z Tobą skontaktować z wyceną.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Twoje imię *</label>
                <input
                  type="text"
                  value={contactData.client_name}
                  onChange={(e) => setContactData({ ...contactData, client_name: e.target.value })}
                  className="input"
                  placeholder="Jan Kowalski"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={contactData.client_email}
                    onChange={(e) => setContactData({ ...contactData, client_email: e.target.value })}
                    className="input"
                    placeholder="jan@email.com"
                  />
                </div>
                <div>
                  <label className="label">Telefon</label>
                  <input
                    type="tel"
                    value={contactData.client_phone}
                    onChange={(e) => setContactData({ ...contactData, client_phone: e.target.value })}
                    className="input"
                    placeholder="+48 123 456 789"
                  />
                </div>
              </div>
              <button
                onClick={handleSubmitRequest}
                disabled={submitting}
                className="btn-primary w-full py-3"
              >
                {submitting ? 'Wysyłanie...' : 'Wyślij zapytanie o wycenę'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      {!showContactForm && (
        <div className="bg-slate-800 border-t border-slate-700 px-4 py-4">
          <div className="max-w-2xl mx-auto flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Napisz wiadomość..."
              disabled={loading}
              className="input flex-1"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="btn-primary px-6"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
