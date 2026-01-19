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

Twoim zadaniem jest:
1. Zasugerować usługi Z CENNIKA które pasują do zlecenia (użyj numerów)
2. Zasugerować DODATKOWE prace które mogą być potrzebne, ale NIE MA ich w cenniku

ZASADY:
- Dla usług z cennika: użyj ich NUMERÓW (service_id)
- Szacuj ilości realistycznie (jeśli klient podał metraż - użyj go, jeśli nie - oszacuj)
- Dla dodatkowych prac: opisz co trzeba zrobić, podaj jednostkę i szacowaną ilość
- Pomyśl co może być potrzebne: przygotowanie podłoża, transport materiałów, wywóz gruzu, drobne naprawy, etc.

Odpowiedz TYLKO w formacie JSON (bez markdown):
{
  "suggestions": [
    {
      "service_id": 1,
      "quantity": 20,
      "reason": "malowanie ścian - klient podał 20m²"
    }
  ],
  "custom_suggestions": [
    {
      "name": "Naprawa pęknięć w ścianie",
      "quantity": 3,
      "unit": "szt",
      "reason": "klient wspomniał o pęknięciach"
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
