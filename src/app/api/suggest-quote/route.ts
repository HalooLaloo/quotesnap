import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface Service {
  name: string
  price: number
  unit: string
}

const SYSTEM_PROMPT = `Jesteś DOŚWIADCZONYM wykonawcą remontów pomagającym tworzyć KOMPLETNE i SZCZEGÓŁOWE wyceny.

Otrzymasz:
1. OPIS PRAC - szczegóły z rozmowy z klientem (przeczytaj BARDZO uważnie!)
2. CENNIK USŁUG - ponumerowana lista usług wykonawcy z dokładnymi nazwami

Twoim zadaniem jest stworzyć MAKSYMALNIE SZCZEGÓŁOWĄ wycenę.

## ABSOLUTNIE KRYTYCZNE - DOPASOWYWANIE USŁUG:

### ZASADA GŁÓWNA: Nazwa usługi MUSI opisywać TĘ SAMĄ czynność co wymagana praca!
- "Czyszczenie rynien" to NIE jest "Malowanie" - to ZUPEŁNIE INNE prace!
- "Montaż listew" to NIE jest "Kładzenie płytek"
- "Naprawa dachu" to NIE jest "Gładzie na ścianach"
- CZYTAJ DOSŁOWNIE nazwę usługi - co ona FAKTYCZNIE oznacza?

### ZASADA JEDNOSTEK: Jednostka MUSI pasować do typu pracy!
- m² (metr kwadratowy) → powierzchnie: ściany, podłogi, sufity, płytki
- mb (metr bieżący) → długości: listwy, rury, kable, cokoły
- szt. (sztuka) → pojedyncze elementy: gniazdka, lampy, drzwi, okna
- godz. (godzina) → prace czasowe: nadzór, konsultacje
- ryczałt → całościowe usługi: transport, sprzątanie

### PRZED UŻYCIEM USŁUGI ZADAJ SOBIE PYTANIA:
1. Czy nazwa usługi opisuje dokładnie tę pracę którą klient potrzebuje?
2. Czy jednostka ma sens dla tej pracy? (nie użyjesz "szt." do malowania ścian!)
3. Czy cena wydaje się rozsądna dla tej pracy?

### KIEDY NIE UŻYWAĆ USŁUGI Z CENNIKA:
- Nazwa usługi nie pasuje do wymaganej pracy (nawet jeśli cena pasuje!)
- Jednostka nie ma sensu (np. m² dla pracy liczonej w sztukach)
- Masz JAKIEKOLWIEK wątpliwości → dodaj jako custom_suggestions

### PRZYKŁADY BŁĘDÓW KTÓRYCH NIE WOLNO POPEŁNIAĆ:
❌ Używanie "Czyszczenie rynien 100zł/szt" do wyceny "Malowanie ścian"
❌ Używanie "Montaż drzwi 500zł/szt" do wyceny "Kładzenie paneli"
❌ Używanie jakiejkolwiek usługi tylko dlatego że cena wydaje się pasować

✅ Jeśli nie ma "Malowanie ścian" w cenniku → dodaj jako custom_suggestions
✅ Jeśli nie ma odpowiedniej usługi → ZAWSZE custom_suggestions

## KLUCZOWE ZASADY:

### 1. UWAŻNIE ANALIZUJ OPIS KLIENTA:
- Wyciągnij KAŻDY szczegół z opisu
- Jeśli klient wspomina o kilku pomieszczeniach - wyceniaj KAŻDE osobno
- Jeśli klient podaje wymiary - UŻYJ ICH dokładnie
- Jeśli klient wspomina o problemach (wilgoć, grzyb, pęknięcia) - dodaj naprawę
- Jeśli klient wspomina o starych elementach - dodaj demontaż

### 2. ZAWSZE dodawaj prace przygotowawcze:
- Gruntowanie przed malowaniem/gładziami (ZAWSZE!)
- Zabezpieczenie podłóg i mebli folią
- Demontaż listew, gniazdek, włączników przed malowaniem
- Montaż listew, gniazdek po malowaniu
- Szpachlowanie ubytków i pęknięć
- Wyrównanie ścian jeśli krzywe
- Odkurzenie i przygotowanie powierzchni

### 3. ZAWSZE dodawaj prace wykończeniowe:
- Sprzątanie po remoncie
- Wywóz gruzu/odpadów (jeśli demontaż)
- Utylizacja starych materiałów
- Montaż elementów wykończeniowych

### 4. Myśl jak PROFESJONALISTA - rozbijaj na etapy:
- Jeśli malowanie → gruntowanie + zabezpieczenie + gładzie (jeśli potrzebne) + 2x malowanie + sufit
- Jeśli płytki → skucie starych + wyrównanie + hydroizolacja (łazienka!) + klej + płytki + fugowanie + silikon
- Jeśli podłogi → demontaż starych + wyrównanie/wylewka + montaż + listwy przypodłogowe + progi
- Jeśli łazienka → hydraulika + odpływy + armatura + silikony + wentylacja
- Jeśli elektryka → bruzdy + puszki + przewody + osprzęt + oświetlenie

### 5. Szacowanie ilości:
- Użyj metrażu podanego przez klienta (DOKŁADNIE!)
- Jeśli brak metrażu - oszacuj realistycznie:
  - Mały pokój: 10-12m² podłogi, 35-40m² ścian
  - Średni pokój: 15-20m² podłogi, 45-55m² ścian
  - Duży pokój: 25-30m² podłogi, 60-70m² ścian
  - Łazienka mała: 3-4m² podłogi, 15-20m² ścian
  - Łazienka średnia: 5-6m² podłogi, 25-30m² ścian
  - Kuchnia: 8-12m² podłogi, 30-40m² ścian
- Dolicz 10% na odpady/zapas

### 6. PROAKTYWNIE proponuj prace których klient mógł nie uwzględnić:
- Naprawa ubytków tynku
- Wymiana uszczelek
- Regulacja drzwi/okien
- Malowanie sufitu (często pomijane!)
- Malowanie grzejników
- Wymiana kratek wentylacyjnych
- Naprawa/wymiana listew przypodłogowych
- Wyrównanie progów między pomieszczeniami
- Uszczelnienie wokół okien
- Drobne naprawy stolarki

### 7. WAŻNE - bądź SZCZEGÓŁOWY:
- Nie łącz prac - każda czynność osobno
- Podawaj KONKRETNE ilości na podstawie opisu
- Im więcej pozycji tym lepiej - wykonawca sam usunie niepotrzebne
- Każda pozycja z uzasadnieniem dlaczego jest potrzebna

## FORMAT ODPOWIEDZI (TYLKO JSON, bez markdown):
{
  "suggestions": [
    {
      "service_id": 1,
      "quantity": 20,
      "reason": "malowanie ścian w salonie - klient podał wymiary 4x5m = 20m²"
    }
  ],
  "custom_suggestions": [
    {
      "name": "Gruntowanie ścian przed malowaniem",
      "quantity": 45,
      "unit": "m²",
      "reason": "niezbędne przygotowanie - salon 20m² + przedpokój 25m²"
    },
    {
      "name": "Zabezpieczenie podłogi folią malarską",
      "quantity": 15,
      "unit": "m²",
      "reason": "ochrona paneli podczas malowania"
    }
  ],
  "notes": "Uwagi: sprawdzić stan tynku przy oknie (klient wspomniał o wilgoci), może wymagać naprawy przed malowaniem"
}

PAMIĘTAJ:
- Im więcej szczegółów wyciągniesz z opisu klienta, tym lepsza wycena!
- Wykonawca może łatwo usunąć niepotrzebne pozycje, ale trudniej mu dodać te o których zapomniał
- Bądź MAKSYMALNIE szczegółowy!`

export async function POST(request: NextRequest) {
  try {
    const { description, services } = await request.json()

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    if (!description || !services || services.length === 0) {
      return NextResponse.json(
        { error: 'Missing description or services' },
        { status: 400 }
      )
    }

    // Przygotuj cennik jako ponumerowaną listę
    const priceList = services
      .map((s: Service, index: number) => `${index + 1}. ${s.name} - ${s.price} PLN / ${s.unit}`)
      .join('\n')

    const userMessage = `OPIS PRAC:
${description}

CENNIK USŁUG (użyj numeru jako service_id):
${priceList}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.4,
      max_tokens: 2000,
    })

    const content = response.choices[0]?.message?.content || '{}'

    // Parsuj JSON z odpowiedzi
    let parsed
    try {
      // Usuń ewentualne znaczniki markdown
      const cleanJson = content.replace(/```json\n?|\n?```/g, '').trim()
      parsed = JSON.parse(cleanJson)
    } catch {
      console.error('Failed to parse AI response:', content)
      return NextResponse.json(
        { error: 'Failed to parse AI suggestions' },
        { status: 500 }
      )
    }

    // Mapuj sugestie na format QuoteItem używając service_id (1-indexed)
    const items = parsed.suggestions?.map((suggestion: { service_id: number; quantity: number; reason: string }) => {
      const serviceIndex = suggestion.service_id - 1 // AI używa 1-indexed
      const service = services[serviceIndex]

      if (!service) {
        console.log(`Service not found for id ${suggestion.service_id}`)
        return null
      }

      return {
        service_name: service.name,
        quantity: suggestion.quantity,
        unit: service.unit,
        unit_price: service.price,
        total: suggestion.quantity * service.price,
        reason: suggestion.reason,
      }
    }).filter(Boolean) || []

    // Mapuj custom suggestions (bez ceny - worker wpisze)
    const customItems = parsed.custom_suggestions?.map((suggestion: { name: string; quantity: number; unit: string; reason: string }) => ({
      service_name: suggestion.name,
      quantity: suggestion.quantity,
      unit: suggestion.unit,
      unit_price: 0, // Worker wpisze cenę
      total: 0,
      reason: suggestion.reason,
      isCustom: true,
    })) || []

    console.log('AI suggestions mapped:', items.length, 'from pricelist,', customItems.length, 'custom')

    return NextResponse.json({
      items,
      customItems,
      notes: parsed.notes || null,
    })
  } catch (error) {
    console.error('Suggest quote API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    )
  }
}
