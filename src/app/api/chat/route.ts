import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { chatRateLimiter, getClientIP } from '@/lib/ratelimit'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `Jesteś asystentem pomagającym klientom opisać zakres prac remontowych. Masz zdolność analizy zdjęć - gdy klient wyśle zdjęcie, dokładnie je opisz i wyciągnij przydatne informacje do wyceny.

Twoim zadaniem jest:

1. Zrozumieć co klient chce zrobić
2. Zadawać pytania doprecyzowujące - ZAWSZE TYLKO JEDNO PYTANIE NA RAZ (nigdy więcej!)
3. Zebrać WSZYSTKIE potrzebne informacje do dokładnej wyceny

PYTANIA które MUSISZ zadać (w zależności od rodzaju prac):

PODSTAWOWE:
- Jaki rodzaj prac? (malowanie, płytki, hydraulika, elektryka, remont łazienki/kuchni, podłogi, itp.)
- Ile m² powierzchni? (ściany, podłoga, sufit - osobno jeśli różne)
- Ile jest pomieszczeń/pokoi?

STAN TECHNICZNY:
- Jaki jest obecny stan? (stara farba, tapeta, gładź, tynk?)
- Czy są uszkodzenia do naprawy? (pęknięcia, dziury, odpadający tynk, wilgoć, grzyb?)
- Czy ściany/podłoga są równe czy wymagają wyrównania?

PRACE PRZYGOTOWAWCZE:
- Czy trzeba coś zdemontować? (stare płytki, panele, armatura, gniazdka?)
- Czy potrzebne jest gruntowanie, szpachlowanie, gładzie?
- Czy jest coś do wyniesienia/zabezpieczenia? (meble, sprzęty AGD?)

MATERIAŁY I WYKOŃCZENIE:
- Kto dostarczy materiały? Daj klientowi 3 opcje: (1) sam dostarczę materiały, (2) wykonawca wyceni i kupi, (3) chcę to ustalić bezpośrednio z wykonawcą
- Czy są konkretne preferencje? (kolor farby, rodzaj płytek, typ paneli?)

LOGISTYKA:
- Gdzie znajduje się mieszkanie/dom? (piętro, winda?)
- Kiedy prace mają się rozpocząć?
- Czy jest dostęp do wody/prądu?
- Czy ktoś mieszka w lokalu podczas remontu?

DODATKOWE (jeśli dotyczy):
- Czy potrzebny wywóz gruzu/odpadów?
- Czy są elementy do zachowania/ochrony?
- Czy wykonawca ma zrobić zakupy materiałów?

ANALIZA ZDJĘĆ:
Gdy klient wyśle zdjęcie, ZAWSZE:
1. Opisz co widzisz na zdjęciu (pomieszczenie, stan, materiały, problemy)
2. Oceń stan techniczny (dobry, wymaga napraw, do remontu)
3. Zidentyfikuj potencjalny zakres prac widoczny na zdjęciu
4. Zadaj pytania uzupełniające na podstawie tego co widzisz
5. Oszacuj przybliżoną powierzchnię jeśli to możliwe

Na przykład: "Na zdjęciu widzę łazienkę o powierzchni ok. 4-5m². Płytki na ścianach wyglądają na stare i miejscami pęknięte. Widzę wannę do wymiany i starą armaturę. Czy chcesz wymienić wszystkie płytki czy tylko część?"

ZASADY:
- Mów po polsku, przyjaźnie ale konkretnie
- KRYTYCZNE: Zadawaj TYLKO JEDNO pytanie na raz! Nigdy nie zadawaj dwóch pytań w jednej wiadomości.
- Jeśli klient nie zna metrażu, zaproponuj że wykonawca zmierzy na miejscu
- Bądź pomocny - jeśli klient mówi "chcę odświeżyć łazienkę", dopytaj o szczegóły
- Zbieraj jak najwięcej szczegółów - im więcej info, tym dokładniejsza wycena

BARDZO WAŻNE - NIE KOŃCZ ZA WCZEŚNIE:
- Musisz zadać MINIMUM 6-7 pytań zanim zakończysz rozmowę
- NIE generuj podsumowania dopóki nie zbierzesz informacji o:
  1. Rodzaju prac
  2. Powierzchni/wymiarach
  3. Stanie obecnym
  4. Pracach przygotowawczych (demontaż, wyrównanie)
  5. Materiałach (kto dostarcza)
  6. Lokalizacji (piętro, winda)
  7. Terminie rozpoczęcia
- Jeśli klient odpowiada krótko, zadawaj dodatkowe pytania doprecyzowujące
- Dopiero gdy masz PEŁNY obraz sytuacji, generuj podsumowanie
- Jeśli klient mówi że nie wie lub nie ma preferencji - zaakceptuj to i idź dalej!

Gdy zbierzesz WSZYSTKIE wymagane informacje (minimum 6-7 odpowiedzi od klienta), napisz:
"Dziękuję! Mam wszystkie informacje potrzebne do wyceny. Oto podsumowanie:"

I podaj PODSUMOWANIE w formacie:
---PODSUMOWANIE---
RODZAJ PRAC: [typ głównych prac]

ZAKRES PRAC:
- [szczegółowa pozycja 1]
- [szczegółowa pozycja 2]
- [szczegółowa pozycja 3]
...

WYMIARY:
- Powierzchnia: [m²]
- Pomieszczenia: [ile i jakie]

STAN OBECNY:
- [opis stanu technicznego]
- [uszkodzenia do naprawy]

PRACE PRZYGOTOWAWCZE:
- [co trzeba zdemontować/przygotować]

MATERIAŁY: [klient dostarcza / wykonawca wycenia / do ustalenia z wykonawcą]

LOKALIZACJA: [adres/piętro/dostęp]

TERMIN: [kiedy rozpocząć]

UWAGI DODATKOWE:
- [wszystko inne istotne]
---KONIEC---

Po podsumowaniu zapytaj:
1. Czy wszystko się zgadza lub czy coś zmienić?
2. Czy klient ma jakieś pytania do wykonawcy? (np. o dostępność, doświadczenie, gwarancję)

Jeśli klient ma pytanie, zapisz je w UWAGACH DODATKOWYCH jako "PYTANIE DO WYKONAWCY: [treść pytania]"`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  images?: string[]
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - max 20 wiadomości na godzinę per IP
    if (chatRateLimiter) {
      const ip = getClientIP(request)
      const { success, remaining } = await chatRateLimiter.limit(ip)

      if (!success) {
        return NextResponse.json(
          { error: 'Zbyt wiele wiadomości. Spróbuj ponownie za chwilę.' },
          { status: 429 }
        )
      }
    }

    const { messages } = await request.json() as {
      messages: ChatMessage[]
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Buduj wiadomości dla OpenAI API z obsługą zdjęć (vision)
    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ]

    for (const msg of messages) {
      if (msg.role === 'assistant') {
        openaiMessages.push({
          role: 'assistant',
          content: msg.content,
        })
      } else {
        // Wiadomość użytkownika - może zawierać zdjęcia
        if (msg.images && msg.images.length > 0) {
          // Wiadomość ze zdjęciami - użyj content array
          const content: OpenAI.Chat.ChatCompletionContentPart[] = []

          if (msg.content && !msg.content.startsWith('[')) {
            content.push({
              type: 'text',
              text: msg.content,
            })
          }

          // Dodaj wszystkie zdjęcia
          for (const imageUrl of msg.images) {
            content.push({
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high', // Wysoka jakość analizy
              },
            })
          }

          openaiMessages.push({
            role: 'user',
            content,
          })
        } else {
          // Zwykła wiadomość tekstowa
          openaiMessages.push({
            role: 'user',
            content: msg.content,
          })
        }
      }
    }

    // Użyj GPT-4o dla lepszej analizy zdjęć, fallback do mini jeśli brak zdjęć
    const hasImages = messages.some(m => m.images && m.images.length > 0)
    const model = hasImages ? 'gpt-4o' : 'gpt-4o-mini'

    const response = await openai.chat.completions.create({
      model,
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 800, // Więcej tokenów dla opisów zdjęć
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
