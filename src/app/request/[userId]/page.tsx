'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'

interface Message {
  role: 'user' | 'assistant'
  content: string
  images?: string[] // URLs zdjęć (jeśli wiadomość zawiera zdjęcia)
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
      content: 'Cześć! 👋 Jestem asystentem, który pomoże Ci opisać zakres prac remontowych.\n\n📸 Możesz wysłać zdjęcia - przeanalizuję je i pomogę dokładniej określić zakres prac oraz przygotować lepszą wycenę.\n\nPowiedz mi, co chciałbyś zrobić? Na przykład: pomalować pokój, wyremontować łazienkę, położyć płytki...',
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
    client_question: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Zdjęcia w chacie
  const [pendingImages, setPendingImages] = useState<string[]>([]) // base64 previews (multiple)
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]) // URLs wszystkich zdjęć
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Dodatkowe zdjęcia w formularzu kontaktowym
  const [contactPhotos, setContactPhotos] = useState<string[]>([])
  const contactFileInputRef = useRef<HTMLInputElement>(null)

  // Licznik pytań (ile odpowiedzi dał użytkownik)
  const userMessagesCount = messages.filter(m => m.role === 'user').length
  const estimatedTotalQuestions = 7 // Szacowana liczba pytań do zebrania pełnych informacji

  // Auto-scroll do najnowszej wiadomości
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus na input po załadowaniu
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Kompresja i konwersja obrazu do base64
  const compressImage = (file: File, maxWidth = 1200): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let { width, height } = img

          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0, width, height)

          resolve(canvas.toDataURL('image/jpeg', 0.8))
        }
        img.onerror = reject
        img.src = e.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Upload zdjęcia do Supabase Storage
  const uploadToStorage = async (base64: string): Promise<string | null> => {
    try {
      // Konwertuj base64 na blob
      const response = await fetch(base64)
      const blob = await response.blob()

      const fileName = `${contractorId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`

      const { data, error } = await supabase.storage
        .from('quote-photos')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        })

      if (error) {
        console.error('Upload error:', error)
        return null
      }

      // Pobierz publiczny URL
      const { data: { publicUrl } } = supabase.storage
        .from('quote-photos')
        .getPublicUrl(data.path)

      return publicUrl
    } catch (error) {
      console.error('Upload error:', error)
      return null
    }
  }

  // Obsługa wyboru zdjęć w chacie (multiple)
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImage(true)

    const newImages: string[] = []
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue

      try {
        const compressed = await compressImage(file)
        newImages.push(compressed)
      } catch (error) {
        console.error('Error compressing image:', error)
      }
    }

    if (newImages.length > 0) {
      setPendingImages(prev => [...prev, ...newImages])
    }

    setUploadingImage(false)
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Usunięcie pending zdjęcia
  const removePendingImage = (index: number) => {
    setPendingImages(prev => prev.filter((_, i) => i !== index))
  }

  // Obsługa wyboru zdjęć w formularzu kontaktowym
  const handleContactPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setUploadingImage(true)

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue

      try {
        const compressed = await compressImage(file)
        const url = await uploadToStorage(compressed)
        if (url) {
          setContactPhotos(prev => [...prev, url])
        }
      } catch (error) {
        console.error('Error uploading photo:', error)
      }
    }

    setUploadingImage(false)
    if (contactFileInputRef.current) contactFileInputRef.current.value = ''
  }

  // Usunięcie zdjęcia z formularza kontaktowego
  const removeContactPhoto = (index: number) => {
    setContactPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const sendMessage = async () => {
    if ((!input.trim() && pendingImages.length === 0) || loading) return

    const userMessage = input.trim()
    const imagesToSend = [...pendingImages]
    setInput('')
    setPendingImages([])
    setLoading(true)

    // Upload zdjęć do storage
    const imageUrls: string[] = []
    for (const img of imagesToSend) {
      const url = await uploadToStorage(img)
      if (url) {
        imageUrls.push(url)
        setUploadedPhotos(prev => [...prev, url])
      }
    }

    // Dodaj wiadomość użytkownika
    const newMessage: Message = {
      role: 'user',
      content: userMessage || (imageUrls.length > 0 ? `[${imageUrls.length} zdjęć]` : ''),
      images: imageUrls.length > 0 ? imageUrls : undefined,
    }
    const newMessages: Message[] = [...messages, newMessage]
    setMessages(newMessages)

    try {
      // Przygotuj wiadomości dla API (z informacją o zdjęciach)
      const apiMessages = newMessages.map(m => ({
        role: m.role,
        content: m.content,
        images: m.images,
      }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          contractorId,
        }),
      })

      const data = await response.json()

      if (response.status === 429) {
        setMessages([...newMessages, {
          role: 'assistant',
          content: '⚠️ Przekroczono limit wiadomości. Ze względów bezpieczeństwa ograniczamy liczbę wiadomości. Spróbuj ponownie za godzinę lub skontaktuj się bezpośrednio z wykonawcą.',
        }])
      } else if (data.error) {
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

    // Dodaj pytanie klienta do opisu jeśli zostało podane
    const clientQuestion = contactData.client_question.trim()
      ? `\n\nPYTANIE DO WYKONAWCY: ${contactData.client_question.trim()}`
      : ''

    const fullDescription = `${summary}${clientQuestion}\n\n---ROZMOWA---\n${conversationLog}`

    // Połącz zdjęcia z chatu i formularza kontaktowego
    const allPhotos = [...uploadedPhotos, ...contactPhotos]

    const { error } = await supabase
      .from('qs_quote_requests')
      .insert({
        contractor_id: contractorId,
        client_name: contactData.client_name,
        client_email: contactData.client_email || null,
        client_phone: contactData.client_phone || null,
        description: fullDescription,
        photos: allPhotos,
        status: 'new',
      })

    if (error) {
      console.error('Error:', error)
      alert('Wystąpił błąd. Spróbuj ponownie.')
    } else {
      // Wyślij powiadomienie email do wykonawcy (nie blokujemy na tym)
      fetch('/api/notify-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractorId,
          clientName: contactData.client_name,
          description: summary || fullDescription.substring(0, 500),
        }),
      }).catch(err => console.error('Notification failed:', err))

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
            <h1 className="text-white font-semibold">BrickQuote</h1>
            <p className="text-slate-400 text-sm">Asystent wycen</p>
          </div>
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
                {message.images && message.images.length > 0 && (
                  <div className={`flex flex-wrap gap-2 ${message.content && !message.content.startsWith('[') ? 'mb-2' : ''}`}>
                    {message.images.map((img, imgIndex) => (
                      <img
                        key={imgIndex}
                        src={img}
                        alt={`Zdjęcie ${imgIndex + 1}`}
                        className="rounded-lg max-h-32 object-cover cursor-pointer hover:opacity-90"
                        onClick={() => window.open(img, '_blank')}
                      />
                    ))}
                  </div>
                )}
                {message.content && !message.content.startsWith('[') && (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
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

              {/* Pytanie do wykonawcy */}
              <div>
                <label className="label">Masz pytanie do wykonawcy? (opcjonalne)</label>
                <textarea
                  value={contactData.client_question}
                  onChange={(e) => setContactData({ ...contactData, client_question: e.target.value })}
                  className="input min-h-[80px] resize-none"
                  placeholder="Np. Czy macie doświadczenie z takimi pracami? Jaki jest orientacyjny czas realizacji?"
                  rows={3}
                />
              </div>

              {/* Opcjonalne zdjęcia */}
              <div>
                <label className="label">Dodatkowe zdjęcia (opcjonalne)</label>
                <p className="text-slate-500 text-xs mb-2">
                  Możesz dodać więcej zdjęć, które pomogą w przygotowaniu dokładniejszej wyceny
                </p>

                {/* Podgląd dodanych zdjęć */}
                {(contactPhotos.length > 0 || uploadedPhotos.length > 0) && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {uploadedPhotos.map((url, index) => (
                      <div key={`chat-${index}`} className="relative">
                        <img
                          src={url}
                          alt={`Zdjęcie z chatu ${index + 1}`}
                          className="h-16 w-16 rounded-lg object-cover opacity-60"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs text-white bg-black/50 px-1 rounded">z chatu</span>
                        </div>
                      </div>
                    ))}
                    {contactPhotos.map((url, index) => (
                      <div key={`contact-${index}`} className="relative group">
                        <img
                          src={url}
                          alt={`Zdjęcie ${index + 1}`}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                        <button
                          onClick={() => removeContactPhoto(index)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Przycisk dodawania zdjęć */}
                <input
                  ref={contactFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleContactPhotoSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => contactFileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-full py-3 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:border-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center gap-2"
                >
                  {uploadingImage ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Przesyłanie...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Dodaj zdjęcia
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={handleSubmitRequest}
                disabled={submitting || uploadingImage}
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
          <div className="max-w-2xl mx-auto">
            {/* Progress indicator */}
            {userMessagesCount > 0 && (
              <div className="mb-3 flex items-center gap-3">
                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((userMessagesCount / estimatedTotalQuestions) * 100, 100)}%` }}
                  />
                </div>
                <div className="text-slate-400 text-sm whitespace-nowrap">
                  {userMessagesCount >= estimatedTotalQuestions
                    ? 'Prawie gotowe!'
                    : `Pytanie ${userMessagesCount} z ~${estimatedTotalQuestions}`}
                </div>
              </div>
            )}

            {/* Podgląd pending zdjęć */}
            {pendingImages.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {pendingImages.map((img, index) => (
                  <div key={index} className="relative">
                    <img
                      src={img}
                      alt={`Podgląd ${index + 1}`}
                      className="h-20 rounded-lg object-cover"
                    />
                    <button
                      onClick={() => removePendingImage(index)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              {/* Hidden file input (multiple) */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />

              {/* Przycisk dodawania zdjęcia */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || uploadingImage}
                className="p-3 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors disabled:opacity-50"
                title="Dodaj zdjęcia - AI przeanalizuje i pomoże w wycenie"
              >
                {uploadingImage ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </button>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Napisz wiadomość lub dodaj zdjęcie..."
                disabled={loading}
                className="input flex-1"
              />
              <button
                onClick={sendMessage}
                disabled={loading || (!input.trim() && pendingImages.length === 0)}
                className="btn-primary px-6"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
