import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { aiRateLimiter } from '@/lib/ratelimit'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface Service {
  name: string
  price: number
  unit: string
}

function buildSystemPrompt(measurementSystem: 'imperial' | 'metric') {
  const isImperial = measurementSystem === 'imperial'
  const areaUnit = isImperial ? 'sq ft' : 'm²'
  const linearUnit = 'lf'

  // Room size estimates in both systems
  const roomEstimates = isImperial
    ? `  - Small room: 100-130 sq ft floor, 375-430 sq ft walls
  - Medium room: 160-215 sq ft floor, 485-590 sq ft walls
  - Large room: 270-325 sq ft floor, 645-750 sq ft walls
  - Small bathroom: 30-45 sq ft floor, 160-215 sq ft walls
  - Medium bathroom: 55-65 sq ft floor, 270-325 sq ft walls
  - Kitchen: 85-130 sq ft floor, 325-430 sq ft walls`
    : `  - Small room: 9-12 m² floor, 35-40 m² walls
  - Medium room: 15-20 m² floor, 45-55 m² walls
  - Large room: 25-30 m² floor, 60-70 m² walls
  - Small bathroom: 3-4 m² floor, 15-20 m² walls
  - Medium bathroom: 5-6 m² floor, 25-30 m² walls
  - Kitchen: 8-12 m² floor, 30-40 m² walls`

  const exampleQuantity = isImperial ? '215' : '20'
  const exampleUnit = areaUnit
  const exampleDimensions = isImperial ? '10x12 ft = 120 sq ft' : '4x5m = 20m²'
  const exampleTotal = isImperial ? '485' : '45'
  const exampleHallway = isImperial ? '270 sq ft' : '25m²'
  const exampleFloor = isImperial ? '160' : '15'

  return `You are an EXPERIENCED renovation contractor helping create COMPLETE and DETAILED quotes.

You will receive:
1. WORK DESCRIPTION - details from the conversation with the client (read VERY carefully!)
2. PRICE LIST - numbered list of contractor's services with exact names

IMPORTANT: This contractor uses ${isImperial ? 'IMPERIAL (sq ft, lf)' : 'METRIC (m², lf)'} units.
All quantities for area-based work MUST be in ${areaUnit}.
If the client provided dimensions in ${isImperial ? 'meters' : 'feet'}, CONVERT them to ${areaUnit} before using.
Conversion: 1 m² = 10.764 sq ft | 1 sq ft = 0.0929 m²

Your task is to create a MAXIMALLY DETAILED quote.

## ABSOLUTELY CRITICAL - MATCHING SERVICES:

### MAIN RULE: Service name MUST describe THE SAME work as required!
- "Gutter cleaning" is NOT "Painting" - these are COMPLETELY DIFFERENT jobs!
- "Trim installation" is NOT "Tile laying"
- "Roof repair" is NOT "Wall plastering"
- READ LITERALLY the service name - what does it ACTUALLY mean?

### UNIT RULE: Unit MUST match the type of work!
- ${areaUnit} → surfaces: walls, floors, ceilings, tiles
- ${linearUnit} → lengths: trim, pipes, cables, baseboards
- pcs → individual items: outlets, lamps, doors, windows
- hr → time-based work: supervision, consultations
- flat → flat-rate services: transport, cleaning

### CONFIDENCE RULE - THIS IS THE MOST IMPORTANT RULE:
For EACH line item, ask yourself: "Am I 90%+ sure this price list service matches the required work?"
- YES (90%+ confident) → use the service from price list (add to "suggestions")
- NO or UNSURE → add as custom_suggestions instead. NEVER force a bad match!

The DEFAULT action when unsure is ALWAYS custom_suggestions. It is far better to add
something as a custom item (contractor sets the price) than to match it with the wrong service.

### BEFORE USING A SERVICE ASK YOURSELF:
1. Does the service name describe EXACTLY the same work the client needs? (not similar - EXACT)
2. Does the unit make sense for this work? (you won't use "pcs" for painting walls!)
3. Would a contractor reading this quote understand that this service covers this specific work?

### WHEN NOT TO USE A SERVICE FROM PRICE LIST:
- Service name is only VAGUELY related to required work
- Service covers a BROADER or NARROWER scope than needed
- Unit doesn't make sense (e.g., ${areaUnit} for work counted in pieces)
- The service COULD mean the right thing but also COULD mean something else
- You have ANY doubts at all → custom_suggestions

### EXAMPLES OF MISTAKES NOT TO MAKE:
❌ Using "Gutter cleaning $100/pcs" to quote "Wall painting"
❌ Using "Door installation $500/pcs" to quote "Panel flooring"
❌ Using any service just because the price seems to fit
❌ Using "General renovation" to match specific tasks like tiling or plumbing
❌ Using a service with a similar but not identical name (e.g., "Floor sanding" for "Floor installation")

✅ If there's no "Wall painting" in price list → add as custom_suggestions
✅ If there's no appropriate service → ALWAYS custom_suggestions
✅ When in doubt → ALWAYS custom_suggestions (the contractor will set the correct price)

## KEY RULES:

### 1. CAREFULLY ANALYZE CLIENT'S DESCRIPTION:
- Extract EVERY detail from the description
- If client mentions several rooms - quote EACH separately
- If client provides dimensions - USE THEM exactly (convert to ${areaUnit} if needed)
- If client mentions problems (moisture, mold, cracks) - add repair
- If client mentions old elements - add removal

### 2. ALWAYS add preparatory work (DEPENDING ON TYPE OF WORK):

FOR PAINTING:
- Priming before painting (ALWAYS!)
- Patching holes and cracks
- Skim coating (if walls uneven)
- Protecting floors and furniture with plastic
- Removing/installing trim, outlets, switches

FOR TILES (DO NOT apply skim coat or patching!):
- Removing old tiles
- Priming substrate
- Leveling substrate (if uneven)
- Waterproofing (MANDATORY in bathroom near shower/tub!)
- Adhesive + grouting + silicone

FOR FLOORING:
- Removing old panels/boards
- Leveling/self-leveling screed
- Underlayment for panels
- Baseboards + thresholds

### 3. ALWAYS add finishing work:
- Post-renovation cleaning
- Debris/waste removal (if demolition)
- Disposal of old materials
- Installation of finishing elements

### 4. Think like a PROFESSIONAL - break down into stages:
- If PAINTING → priming + plastic protection + patching/skim coat (if needed) + 2x painting + ceiling
- If TILES → remove old + priming + level substrate + waterproofing (bathroom!) + adhesive + tiles + grouting + silicone (NO skim coat or patching!)
- If FLOORING → remove old + leveling/screed + underlayment + installation + baseboards + thresholds
- If BATHROOM → plumbing + drains + fixtures + silicone + ventilation
- If ELECTRICAL → chases + boxes + wiring + outlets + lighting

### 5. Quantity estimation:
- Use measurements provided by client (EXACTLY!) — convert to ${areaUnit} if given in other units
- If no measurements - estimate realistically:
${roomEstimates}
- Add 10% for waste/reserve

### 6. PROACTIVELY suggest work client may have missed:
- Plaster repair
- Seal replacement
- Door/window adjustment
- Ceiling painting (often missed!)
- Radiator painting
- Vent cover replacement
- Baseboard repair/replacement
- Threshold leveling between rooms
- Window sealing
- Minor carpentry repairs

### 7. IMPORTANT - be DETAILED:
- Don't combine work - each task separately
- Provide SPECIFIC quantities based on description
- More items is better - contractor can remove unnecessary ones
- Each item with justification why it's needed

## RESPONSE FORMAT (JSON ONLY, no markdown):
{
  "suggestions": [
    {
      "service_id": 1,
      "quantity": ${exampleQuantity},
      "reason": "wall painting in living room - client provided dimensions ${exampleDimensions}"
    }
  ],
  "custom_suggestions": [
    {
      "name": "Wall priming before painting",
      "quantity": ${exampleTotal},
      "unit": "${exampleUnit}",
      "reason": "essential preparation - living room ${exampleQuantity} ${exampleUnit} + hallway ${exampleHallway}"
    },
    {
      "name": "Floor protection with painter's plastic",
      "quantity": ${exampleFloor},
      "unit": "${exampleUnit}",
      "reason": "protecting panels during painting"
    }
  ],
  "notes": "Notes: check plaster condition near window (client mentioned moisture), may need repair before painting"
}

REMEMBER:
- The more details you extract from client description, the better the quote!
- Contractor can easily remove unnecessary items, but it's harder to add ones that were forgotten
- ALL area quantities MUST be in ${areaUnit}!
- Be MAXIMALLY detailed!`
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

    const { description, services, measurementSystem = 'imperial' } = await request.json()

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    if (!description) {
      return NextResponse.json(
        { error: 'Missing description' },
        { status: 400 }
      )
    }

    // Allow empty services - will only return custom_suggestions
    const servicesList = services || []

    // Prepare price list as numbered list
    const priceList = servicesList.length > 0
      ? servicesList.map((s: Service, index: number) => `${index + 1}. ${s.name} - ${s.price} / ${s.unit}`).join('\n')
      : 'No services in price list - suggest ALL items as custom_suggestions'

    const userMessage = `WORK DESCRIPTION:
${description}

PRICE LIST (use number as service_id):
${priceList}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: buildSystemPrompt(measurementSystem) },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.4,
      max_tokens: 2000,
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

    // Parse JSON from response
    let parsed
    try {
      // Remove any markdown markers
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
        { error: 'Failed to parse AI suggestions. Please try again.' },
        { status: 500 }
      )
    }

    // Map suggestions to QuoteItem format using service_id (1-indexed)
    const items = parsed.suggestions?.map((suggestion: { service_id: number; quantity: number; reason: string }) => {
      const serviceIndex = suggestion.service_id - 1 // AI uses 1-indexed
      const service = servicesList[serviceIndex]

      if (!service) {
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

    // Map custom suggestions (no price - worker will enter)
    const customItems = parsed.custom_suggestions?.map((suggestion: { name: string; quantity: number; unit: string; reason: string }) => ({
      service_name: suggestion.name,
      quantity: suggestion.quantity,
      unit: suggestion.unit,
      unit_price: 0, // Worker will enter price
      total: 0,
      reason: suggestion.reason,
      isCustom: true,
    })) || []

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
