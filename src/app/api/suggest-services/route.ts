import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { aiRateLimiter } from '@/lib/ratelimit'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function buildSuggestServicesPrompt(measurementSystem: 'imperial' | 'metric') {
  const isImperial = measurementSystem === 'imperial'
  const areaUnit = isImperial ? 'sqft' : 'm2'
  const areaLabel = isImperial ? 'sq ft' : 'm²'
  const linearUnit = isImperial ? 'lft' : 'mb'
  const linearLabel = isImperial ? 'lf (linear foot)' : 'lf (linear meter)'

  return `You are an expert in renovation and construction services. Your task is to analyze the contractor's description and suggest a list of services they provide.

Based on the contractor's description, return a list of specific services with appropriate units and suggested market prices.

## RULES:
1. Suggest 15-25 specific services based on the description — more is better, the user can remove what they don't need
2. Group services logically (e.g. flooring first, then walls, then installations, then finishing touches)
3. Use professional but understandable service names
4. Choose the appropriate unit:
   - ${areaUnit} = ${areaLabel} (floors, walls, tiles, painting)
   - ${linearUnit} = ${linearLabel} (trim, pipes, cables, baseboards)
   - pcs = piece (doors, windows, outlets, lamps, points)
   - hr = hour (specialized work, consultations)
   - flat = flat rate (comprehensive services, transport)
5. Market prices - realistic, average rates${isImperial ? ' in USD (per sq ft)' : ''}
6. Be SPECIFIC - not "finishing work" but "Wall painting", "Panel flooring installation"
7. If contractor mentions a specialization - add more services from that field

## EXAMPLE SERVICES by trade:

PAINTER:
- Wall painting (${areaUnit}) - ${isImperial ? '$1-2' : '$3-5'}
- Ceiling painting (${areaUnit}) - ${isImperial ? '$1.5-2.5' : '$4-6'}
- Wall priming (${areaUnit}) - ${isImperial ? '$0.50-1' : '$2-3'}
- Skim coating (${areaUnit}) - ${isImperial ? '$2-4' : '$8-12'}
- Wallpapering (${areaUnit}) - ${isImperial ? '$2-4' : '$7-12'}

TILER:
- Wall tile installation (${areaUnit}) - ${isImperial ? '$5-10' : '$18-28'}
- Floor tile installation (${areaUnit}) - ${isImperial ? '$4-8' : '$16-24'}
- Tile grouting (${areaUnit}) - ${isImperial ? '$1-2' : '$3-6'}
- Waterproofing (${areaUnit}) - ${isImperial ? '$2-4' : '$7-12'}
- Old tile removal (${areaUnit}) - ${isImperial ? '$2-4' : '$7-12'}

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
- Pipe replacement (${linearUnit}) - ${isImperial ? '$6-12' : '$20-35'}
- Washer/dishwasher connection (pcs) - $25-35

ELECTRICIAN:
- Outlet installation (pcs) - $12-20
- Switch installation (pcs) - $10-17
- Light fixture installation (pcs) - $15-25
- Wire routing (${linearUnit}) - ${isImperial ? '$2-4' : '$7-12'}
- Panel installation (pcs) - $100-200

## RESPONSE FORMAT (JSON ONLY):
{
  "services": [
    {
      "name": "Wall painting",
      "unit": "${areaUnit}",
      "price": ${isImperial ? '1.5' : '4'}
    },
    {
      "name": "Interior door installation",
      "unit": "pcs",
      "price": 50
    }
  ]
}

REMEMBER: Return ONLY JSON, without any additional text or markdown.`
}

export async function POST(request: NextRequest) {
  try {
    // Auth check - only logged-in users
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // AI rate limiting per user
    if (aiRateLimiter) {
      const { success } = await aiRateLimiter.limit(user.id)
      if (!success) {
        return NextResponse.json(
          { error: 'AI usage limit reached. Please try again later.' },
          { status: 429 }
        )
      }
    }

    const { description, measurementSystem = 'imperial' } = await request.json()

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
        { role: 'system', content: buildSuggestServicesPrompt(measurementSystem) },
        { role: 'user', content: `Contractor description:\n${description}` },
      ],
      temperature: 0.5,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content

    if (!content) {
      console.error('Empty AI response')
      return NextResponse.json(
        { error: 'AI returned empty response. Please try again.' },
        { status: 500 }
      )
    }

    // Parse JSON - try multiple formats
    let parsed
    try {
      // Remove markdown code blocks if present
      let cleanJson = content
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim()

      // Try to extract JSON object if there's extra text
      const jsonMatch = cleanJson.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cleanJson = jsonMatch[0]
      }

      parsed = JSON.parse(cleanJson)
    } catch (parseError) {
      console.error('Failed to parse AI response:', content)
      console.error('Parse error:', parseError)
      return NextResponse.json(
        { error: 'Failed to process AI response. Please try again.' },
        { status: 500 }
      )
    }

    // Validate services
    const validUnits = ['m2', 'mb', 'pcs', 'hr', 'flat', 'sqft', 'lft']
    const services = (parsed.services || [])
      .filter((s: { name?: string; unit?: string; price?: number }) =>
        s.name &&
        s.unit &&
        validUnits.includes(s.unit) &&
        typeof s.price === 'number' &&
        s.price >= 0
      )
      .slice(0, 30) // Max 30 services

    if (services.length === 0) {
      console.error('No valid services extracted. Raw parsed:', JSON.stringify(parsed))
      return NextResponse.json(
        { error: 'Could not generate services. Please describe your work in more detail.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ services })
  } catch (error) {
    console.error('Suggest services API error:', error)
    return NextResponse.json(
      { error: 'An error occurred while generating suggestions' },
      { status: 500 }
    )
  }
}
