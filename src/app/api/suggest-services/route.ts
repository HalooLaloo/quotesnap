import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `Jesteś ekspertem od usług remontowo-budowlanych w Polsce. Twoim zadaniem jest przeanalizować opis wykonawcy i zaproponować listę usług które świadczy.

Na podstawie opisu wykonawcy, zwróć listę konkretnych usług z odpowiednimi jednostkami i sugerowanymi cenami rynkowymi.

## ZASADY:
1. Zaproponuj 5-15 konkretnych usług na podstawie opisu
2. Używaj POLSKICH nazw usług, profesjonalnych ale zrozumiałych
3. Dobierz odpowiednią jednostkę:
   - m2 = metr kwadratowy (podłogi, ściany, płytki, malowanie)
   - mb = metr bieżący (listwy, rury, kable, cokoły)
   - szt = sztuka (drzwi, okna, gniazdka, lampy, punkty)
   - godz = godzina (prace specjalistyczne, konsultacje)
   - ryczalt = ryczałt (kompleksowe usługi, transport)
4. Ceny rynkowe dla Polski (2024) - realistyczne, średnie stawki
5. Bądź KONKRETNY - nie "prace wykończeniowe" tylko "Malowanie ścian", "Układanie paneli"
6. Jeśli wykonawca wspomina o specjalizacji - dodaj więcej usług z tej dziedziny

## PRZYKŁADY USŁUG według branży:

MALARZ:
- Malowanie ścian (m2) - 15-25 PLN
- Malowanie sufitów (m2) - 18-30 PLN
- Gruntowanie ścian (m2) - 8-12 PLN
- Gładzie gipsowe (m2) - 35-50 PLN
- Tapetowanie (m2) - 30-50 PLN

PŁYTKARZ:
- Układanie płytek ściennych (m2) - 80-120 PLN
- Układanie płytek podłogowych (m2) - 70-100 PLN
- Fugowanie płytek (m2) - 15-25 PLN
- Hydroizolacja (m2) - 30-50 PLN
- Skuwanie starych płytek (m2) - 30-50 PLN

STOLARZ:
- Meble na wymiar (ryczalt) - od 2000 PLN
- Montaż kuchni (ryczalt) - 800-1500 PLN
- Montaż szafy wnękowej (ryczalt) - 500-1000 PLN
- Renowacja mebli (godz) - 80-120 PLN
- Montaż drzwi wewnętrznych (szt) - 150-250 PLN

HYDRAULIK:
- Montaż baterii (szt) - 100-200 PLN
- Montaż WC (szt) - 200-400 PLN
- Montaż umywalki (szt) - 150-250 PLN
- Wymiana rur (mb) - 80-150 PLN
- Podłączenie pralki/zmywarki (szt) - 100-150 PLN

ELEKTRYK:
- Montaż gniazdka (szt) - 50-80 PLN
- Montaż włącznika (szt) - 40-70 PLN
- Montaż lampy (szt) - 60-100 PLN
- Prowadzenie przewodów (mb) - 30-50 PLN
- Montaż rozdzielni (szt) - 400-800 PLN

## FORMAT ODPOWIEDZI (TYLKO JSON):
{
  "services": [
    {
      "name": "Malowanie ścian",
      "unit": "m2",
      "price": 20
    },
    {
      "name": "Montaż drzwi wewnętrznych",
      "unit": "szt",
      "price": 200
    }
  ]
}

PAMIĘTAJ: Zwróć TYLKO JSON, bez żadnego dodatkowego tekstu czy markdown.`

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json()

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    if (!description || description.trim().length < 10) {
      return NextResponse.json(
        { error: 'Opis jest za krótki' },
        { status: 400 }
      )
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Opis wykonawcy:\n${description}` },
      ],
      temperature: 0.5,
      max_tokens: 1500,
    })

    const content = response.choices[0]?.message?.content || '{}'

    // Parse JSON
    let parsed
    try {
      const cleanJson = content.replace(/```json\n?|\n?```/g, '').trim()
      parsed = JSON.parse(cleanJson)
    } catch {
      console.error('Failed to parse AI response:', content)
      return NextResponse.json(
        { error: 'Nie udało się przetworzyć odpowiedzi AI' },
        { status: 500 }
      )
    }

    // Validate services
    const validUnits = ['m2', 'mb', 'szt', 'godz', 'ryczalt']
    const services = (parsed.services || [])
      .filter((s: { name?: string; unit?: string; price?: number }) =>
        s.name &&
        s.unit &&
        validUnits.includes(s.unit) &&
        typeof s.price === 'number' &&
        s.price >= 0
      )
      .slice(0, 20) // Max 20 services

    return NextResponse.json({ services })
  } catch (error) {
    console.error('Suggest services API error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas generowania sugestii' },
      { status: 500 }
    )
  }
}
