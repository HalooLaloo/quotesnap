import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `Jesteś asystentem pomagającym klientom opisać zakres prac remontowych. Twoim zadaniem jest:

1. Zrozumieć co klient chce zrobić
2. Zadawać pytania doprecyzowujące (jedno lub dwa na raz, nie więcej)
3. Zebrać wszystkie potrzebne informacje

PYTANIA które powinieneś zadać (w zależności od rodzaju prac):
- Jaki rodzaj prac? (malowanie, płytki, hydraulika, elektryka, remont łazienki/kuchni, itp.)
- Ile m² / jaki metraż?
- Czy są uszkodzenia do naprawy? (pęknięcia, dziury, nierówności)
- Czy potrzebne są prace przygotowawcze? (gruntowanie, gładzie, skuwanie)
- Materiały - klient dostarcza czy wykonawca?
- Kiedy prace mają się rozpocząć?
- Dostęp do mieszkania (godziny, klucze)
- Czy meble/sprzęty do wyniesienia?

ZASADY:
- Mów po polsku, przyjaźnie ale konkretnie
- Zadawaj 1-2 pytania na raz, nie bombarduj
- Jeśli klient nie wie (np. metrażu), zaproponuj przybliżone oszacowanie
- Bądź pomocny - jeśli klient mówi "chcę odświeżyć łazienkę", dopytaj co dokładnie

Gdy zbierzesz wystarczająco informacji, napisz:
"Dziękuję! Mam wszystkie informacje. Oto podsumowanie:"

I podaj PODSUMOWANIE w formacie:
---PODSUMOWANIE---
RODZAJ PRAC: [typ]
ZAKRES:
- [pozycja 1]
- [pozycja 2]
...
METRAŻ: [m²]
STAN: [opis stanu - czy wymaga napraw]
MATERIAŁY: [klient/wykonawca]
TERMIN: [kiedy]
UWAGI: [dodatkowe info]
---KONIEC---

Po podsumowaniu zapytaj czy wszystko się zgadza lub czy coś zmienić.`

export async function POST(request: NextRequest) {
  try {
    const { messages, contractorId } = await request.json()

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const assistantMessage = response.choices[0]?.message?.content || 'Przepraszam, wystąpił błąd.'

    // Sprawdź czy wiadomość zawiera podsumowanie
    const hasSummary = assistantMessage.includes('---PODSUMOWANIE---')

    return NextResponse.json({
      message: assistantMessage,
      hasSummary,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}
