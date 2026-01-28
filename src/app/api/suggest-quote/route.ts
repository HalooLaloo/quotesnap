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

const SYSTEM_PROMPT = `You are an EXPERIENCED renovation contractor helping create COMPLETE and DETAILED quotes.

You will receive:
1. WORK DESCRIPTION - details from the conversation with the client (read VERY carefully!)
2. PRICE LIST - numbered list of contractor's services with exact names

Your task is to create a MAXIMALLY DETAILED quote.

## ABSOLUTELY CRITICAL - MATCHING SERVICES:

### MAIN RULE: Service name MUST describe THE SAME work as required!
- "Gutter cleaning" is NOT "Painting" - these are COMPLETELY DIFFERENT jobs!
- "Trim installation" is NOT "Tile laying"
- "Roof repair" is NOT "Wall plastering"
- READ LITERALLY the service name - what does it ACTUALLY mean?

### UNIT RULE: Unit MUST match the type of work!
- m² (square meter) / sq ft → surfaces: walls, floors, ceilings, tiles
- mb (linear meter) / lf → lengths: trim, pipes, cables, baseboards
- pcs (piece) → individual items: outlets, lamps, doors, windows
- hr (hour) → time-based work: supervision, consultations
- flat → flat-rate services: transport, cleaning

### BEFORE USING A SERVICE ASK YOURSELF:
1. Does the service name describe exactly the work the client needs?
2. Does the unit make sense for this work? (you won't use "pcs" for painting walls!)
3. Does the price seem reasonable for this work?

### WHEN NOT TO USE A SERVICE FROM PRICE LIST:
- Service name doesn't match required work (even if price fits!)
- Unit doesn't make sense (e.g., m² for work counted in pieces)
- You have ANY doubts → add as custom_suggestions

### EXAMPLES OF MISTAKES NOT TO MAKE:
❌ Using "Gutter cleaning $100/pcs" to quote "Wall painting"
❌ Using "Door installation $500/pcs" to quote "Panel flooring"
❌ Using any service just because the price seems to fit

✅ If there's no "Wall painting" in price list → add as custom_suggestions
✅ If there's no appropriate service → ALWAYS custom_suggestions

## KEY RULES:

### 1. CAREFULLY ANALYZE CLIENT'S DESCRIPTION:
- Extract EVERY detail from the description
- If client mentions several rooms - quote EACH separately
- If client provides dimensions - USE THEM exactly
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
- Use measurements provided by client (EXACTLY!)
- If no measurements - estimate realistically:
  - Small room: 100-130 sq ft floor, 375-430 sq ft walls
  - Medium room: 160-215 sq ft floor, 485-590 sq ft walls
  - Large room: 270-325 sq ft floor, 645-750 sq ft walls
  - Small bathroom: 30-45 sq ft floor, 160-215 sq ft walls
  - Medium bathroom: 55-65 sq ft floor, 270-325 sq ft walls
  - Kitchen: 85-130 sq ft floor, 325-430 sq ft walls
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
      "quantity": 20,
      "reason": "wall painting in living room - client provided dimensions 4x5m = 20m²"
    }
  ],
  "custom_suggestions": [
    {
      "name": "Wall priming before painting",
      "quantity": 45,
      "unit": "m²",
      "reason": "essential preparation - living room 20m² + hallway 25m²"
    },
    {
      "name": "Floor protection with painter's plastic",
      "quantity": 15,
      "unit": "m²",
      "reason": "protecting panels during painting"
    }
  ],
  "notes": "Notes: check plaster condition near window (client mentioned moisture), may need repair before painting"
}

REMEMBER:
- The more details you extract from client description, the better the quote!
- Contractor can easily remove unnecessary items, but it's harder to add ones that were forgotten
- Be MAXIMALLY detailed!`

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

    // Prepare price list as numbered list
    const priceList = services
      .map((s: Service, index: number) => `${index + 1}. ${s.name} - ${s.price} / ${s.unit}`)
      .join('\n')

    const userMessage = `WORK DESCRIPTION:
${description}

PRICE LIST (use number as service_id):
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

    // Parse JSON from response
    let parsed
    try {
      // Remove any markdown markers
      const cleanJson = content.replace(/```json\n?|\n?```/g, '').trim()
      parsed = JSON.parse(cleanJson)
    } catch {
      console.error('Failed to parse AI response:', content)
      return NextResponse.json(
        { error: 'Failed to parse AI suggestions' },
        { status: 500 }
      )
    }

    // Map suggestions to QuoteItem format using service_id (1-indexed)
    const items = parsed.suggestions?.map((suggestion: { service_id: number; quantity: number; reason: string }) => {
      const serviceIndex = suggestion.service_id - 1 // AI uses 1-indexed
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
