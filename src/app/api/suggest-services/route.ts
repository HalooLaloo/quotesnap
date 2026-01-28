import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `You are an expert in renovation and construction services. Your task is to analyze the contractor's description and suggest a list of services they provide.

Based on the contractor's description, return a list of specific services with appropriate units and suggested market prices.

## RULES:
1. Suggest 5-15 specific services based on the description
2. Use professional but understandable service names
3. Choose the appropriate unit:
   - m2 = square meter (floors, walls, tiles, painting)
   - mb = linear meter (trim, pipes, cables, baseboards)
   - pcs = piece (doors, windows, outlets, lamps, points)
   - hr = hour (specialized work, consultations)
   - flat = flat rate (comprehensive services, transport)
4. Market prices - realistic, average rates
5. Be SPECIFIC - not "finishing work" but "Wall painting", "Panel flooring installation"
6. If contractor mentions a specialization - add more services from that field

## EXAMPLE SERVICES by trade:

PAINTER:
- Wall painting (m2) - $3-5
- Ceiling painting (m2) - $4-6
- Wall priming (m2) - $2-3
- Skim coating (m2) - $8-12
- Wallpapering (m2) - $7-12

TILER:
- Wall tile installation (m2) - $18-28
- Floor tile installation (m2) - $16-24
- Tile grouting (m2) - $3-6
- Waterproofing (m2) - $7-12
- Old tile removal (m2) - $7-12

CARPENTER:
- Custom furniture (flat) - from $500
- Kitchen installation (flat) - $200-350
- Built-in wardrobe installation (flat) - $120-250
- Furniture restoration (hr) - $20-30
- Interior door installation (pcs) - $35-60

PLUMBER:
- Faucet installation (pcs) - $25-50
- Toilet installation (pcs) - $50-100
- Sink installation (pcs) - $35-60
- Pipe replacement (mb) - $20-35
- Washer/dishwasher connection (pcs) - $25-35

ELECTRICIAN:
- Outlet installation (pcs) - $12-20
- Switch installation (pcs) - $10-17
- Light fixture installation (pcs) - $15-25
- Wire routing (mb) - $7-12
- Panel installation (pcs) - $100-200

## RESPONSE FORMAT (JSON ONLY):
{
  "services": [
    {
      "name": "Wall painting",
      "unit": "m2",
      "price": 4
    },
    {
      "name": "Interior door installation",
      "unit": "pcs",
      "price": 50
    }
  ]
}

REMEMBER: Return ONLY JSON, without any additional text or markdown.`

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
        { error: 'Description is too short' },
        { status: 400 }
      )
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Contractor description:\n${description}` },
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
        { error: 'Failed to process AI response' },
        { status: 500 }
      )
    }

    // Validate services
    const validUnits = ['m2', 'mb', 'pcs', 'hr', 'flat']
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
      { error: 'An error occurred while generating suggestions' },
      { status: 500 }
    )
  }
}
