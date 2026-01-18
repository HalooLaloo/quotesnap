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

const SYSTEM_PROMPT = `Jesteś asystentem pomagającym wykonawcom remontów tworzyć wyceny.

Otrzymasz:
1. OPIS PRAC - co klient chce zrobić (z rozmowy z botem)
2. CENNIK USŁUG - ponumerowana lista usług wykonawcy

Twoim zadaniem jest przeanalizować opis i zasugerować które usługi pasują do zlecenia.

WAŻNE - użyj NUMERU usługi z cennika (service_id), NIE nazwy!

ZASADY:
- Wybieraj TYLKO usługi z podanego cennika używając ich NUMERÓW
- Szacuj ilości realistycznie na podstawie opisu
- Jeśli klient podał metraż, użyj go
- Jeśli nie podał, oszacuj rozsądnie (np. typowy pokój 12-15m², łazienka 5-8m²)
- Dodaj usługi przygotowawcze jeśli są w cenniku i są potrzebne

Odpowiedz TYLKO w formacie JSON (bez markdown, bez komentarzy):
{
  "suggestions": [
    {
      "service_id": 1,
      "quantity": 20,
      "reason": "malowanie ścian - klient podał 20m²"
    }
  ],
  "notes": "opcjonalne uwagi dla wykonawcy"
}`

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
      temperature: 0.3,
      max_tokens: 1000,
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

    console.log('AI suggestions mapped:', items.length, 'items')

    return NextResponse.json({
      items,
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
