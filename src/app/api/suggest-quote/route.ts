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
2. CENNIK USŁUG - lista usług wykonawcy z cenami

Twoim zadaniem jest przeanalizować opis i zasugerować które usługi z cennika pasują do zlecenia oraz oszacować ilości.

ZASADY:
- Używaj TYLKO usług z podanego cennika (dokładne nazwy!)
- Szacuj ilości realistycznie na podstawie opisu
- Jeśli klient podał metraż, użyj go
- Jeśli nie podał, oszacuj rozsądnie (np. typowy pokój 12-15m², łazienka 5-8m²)
- Dodaj usługi przygotowawcze jeśli są potrzebne (gruntowanie, skuwanie, etc.)
- Nie dodawaj usług których nie ma w cenniku

Odpowiedz TYLKO w formacie JSON (bez markdown):
{
  "suggestions": [
    {
      "service_name": "dokładna nazwa z cennika",
      "quantity": liczba,
      "reason": "krótkie uzasadnienie"
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

    // Przygotuj cennik jako tekst
    const priceList = services
      .map((s: Service) => `- ${s.name}: ${s.price} PLN / ${s.unit}`)
      .join('\n')

    const userMessage = `OPIS PRAC:
${description}

CENNIK USŁUG:
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

    // Mapuj sugestie na format QuoteItem
    const items = parsed.suggestions?.map((suggestion: { service_name: string; quantity: number; reason: string }) => {
      const service = services.find((s: Service) => s.name === suggestion.service_name)
      if (!service) return null

      return {
        service_name: service.name,
        quantity: suggestion.quantity,
        unit: service.unit,
        unit_price: service.price,
        total: suggestion.quantity * service.price,
        reason: suggestion.reason,
      }
    }).filter(Boolean) || []

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
