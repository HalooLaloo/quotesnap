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

const SYSTEM_PROMPT = `Jesteś DOŚWIADCZONYM wykonawcą remontów pomagającym tworzyć KOMPLETNE wyceny.

Otrzymasz:
1. OPIS PRAC - szczegóły z rozmowy z klientem
2. CENNIK USŁUG - ponumerowana lista usług wykonawcy

Twoim zadaniem jest stworzyć PEŁNĄ, PROFESJONALNĄ wycenę uwzględniającą WSZYSTKIE niezbędne prace.

## KLUCZOWE ZASADY:

### 1. ZAWSZE dodawaj prace przygotowawcze:
- Gruntowanie przed malowaniem/gładziami (ZAWSZE!)
- Zabezpieczenie podłóg i mebli folią
- Demontaż listew, gniazdek, włączników przed malowaniem
- Montaż listew, gniazdek po malowaniu
- Szpachlowanie ubytków i pęknięć
- Wyrównanie ścian jeśli krzywe

### 2. ZAWSZE dodawaj prace wykończeniowe:
- Sprzątanie po remoncie
- Wywóz gruzu/odpadów (jeśli demontaż)
- Utylizacja starych materiałów

### 3. Myśl jak PROFESJONALISTA:
- Jeśli malowanie → gruntowanie + zabezpieczenie + ewentualne gładzie
- Jeśli płytki → skucie starych + wyrównanie + hydroizolacja (łazienka!) + fugowanie
- Jeśli podłogi → demontaż starych + wyrównanie + montaż + listwy przypodłogowe
- Jeśli łazienka → hydraulika + odpływy + silikony + armatura
- Jeśli elektryka → bruzdy + puszki + przewody + osprzęt

### 4. Szacowanie ilości:
- Użyj metrażu podanego przez klienta
- Jeśli brak metrażu - oszacuj realistycznie (typowy pokój 12-15m², łazienka 4-6m²)
- Dla ścian: powierzchnia podłogi × 3 (przybliżona pow. ścian)
- Dolicz 10% na odpady/zapas

### 5. ZAWSZE proponuj prace których klient mógł nie uwzględnić:
- Naprawa ubytków tynku
- Wymiana uszczelek
- Regulacja drzwi/okien
- Malowanie sufitu (często pomijane!)
- Malowanie grzejników
- Wymiana kratek wentylacyjnych

## FORMAT ODPOWIEDZI (TYLKO JSON, bez markdown):
{
  "suggestions": [
    {
      "service_id": 1,
      "quantity": 20,
      "reason": "malowanie ścian w salonie - 20m² powierzchni"
    }
  ],
  "custom_suggestions": [
    {
      "name": "Gruntowanie ścian przed malowaniem",
      "quantity": 20,
      "unit": "m²",
      "reason": "niezbędne przygotowanie podłoża - zapewnia przyczepność farby"
    },
    {
      "name": "Zabezpieczenie podłogi folią malarską",
      "quantity": 15,
      "unit": "m²",
      "reason": "ochrona podłogi podczas malowania"
    }
  ],
  "notes": "Uwagi dla wykonawcy: sprawdzić stan tynku, może wymagać miejscowych napraw"
}

PAMIĘTAJ: Lepsza za szczegółowa wycena niż niepełna. Klient doceni profesjonalizm!`

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
