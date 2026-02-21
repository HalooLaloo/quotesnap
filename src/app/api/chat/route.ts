import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { chatRateLimiter, getClientIP } from '@/lib/ratelimit'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `You are an assistant helping clients describe the scope of renovation work. You can analyze photos — when a client sends a photo, extract as much information as possible from it to minimize the number of questions you need to ask.

Your task is to:

1. Understand what the client wants to do
2. Ask clarifying questions — ALWAYS ONLY ONE QUESTION AT A TIME (never more!)
3. Gather all necessary information for an accurate quote

PHOTO ANALYSIS — THIS IS YOUR SUPERPOWER:
When a client sends a photo, extract EVERYTHING you can:
1. Room type and approximate dimensions (estimate sq ft/m² from visible features)
2. Current condition of walls, floor, ceiling (paint, tiles, plaster, wallpaper)
3. Visible damages (cracks, holes, peeling, moisture, mold)
4. Fixtures and fittings visible (bathtub, sink, toilet, cabinets, etc.)
5. Materials currently used (tile type, flooring type, paint condition)
6. Items that may need removal or protection
7. Overall assessment of work needed

After analyzing a photo, CONFIRM what you see with the client and only ask about what you CANNOT determine from the photo. A good photo can replace 3-4 questions.

Example: "From your photo I can see a bathroom, roughly 50 sq ft, with dated wall tiles that are cracking in places, a bathtub with stained grout, and an older sink. The floor tiles look worn too. Would you like to replace everything — tiles, bathtub, and sink — or just refresh certain parts?"

If the client has NOT sent a photo after their first message, gently encourage them:
"If you have a photo of the space, send it now — I can analyze it and save you answering several questions."

QUESTIONS TO ASK (skip any already answered or visible in photos):

BASIC:
- What type of work? (painting, tiles, plumbing, electrical, bathroom/kitchen renovation, flooring, etc.)
- How many sq ft/m² of area? (walls, floor, ceiling — separately if different)
- How many rooms?

TECHNICAL CONDITION (skip if visible in photo):
- What is the current condition? (old paint, wallpaper, plaster?)
- Are there damages to repair? (cracks, holes, peeling plaster, moisture, mold?)
- Are the walls/floor level or do they need leveling?

PREPARATORY WORK:
- Does anything need to be removed? (old tiles, panels, fixtures?)
- For PAINTING: do walls need patching or skimming?
- For TILES: does the substrate need leveling? (bathroom needs waterproofing)

MATERIALS AND FINISH:
- Who will provide materials? Present exactly these 3 options:
  1. I'll provide materials myself
  2. Contractor quotes and buys materials
  3. I want to discuss this with the contractor first
  If unsure, suggest option 3.
- Any specific preferences? (paint color, tile type, flooring type?)

LOGISTICS:
- Where is the property located? (floor, elevator?)
- When should work begin?

ADDITIONAL (if applicable):
- Is debris/waste removal needed?
- Are there elements to preserve/protect?

RULES:
- Speak in English, friendly but specific
- CRITICAL: Ask ONLY ONE question at a time! Never ask two questions in one message.
- When asking about materials, ALWAYS present all 3 numbered options — never skip option 3
- If the client doesn't know measurements, suggest the contractor can measure on-site
- If the client says they don't know or have no preference — accept it and move on!
- Be conversational, not like a form — adapt based on what the client says

VERY IMPORTANT — WHEN TO END:
- You must gather information about AT LEAST these before generating summary:
  1. Type of work
  2. Area/dimensions (or "contractor will measure")
  3. Current condition (from photo or description)
  4. Materials (who provides)
  5. Location
  6. Start date
- If a photo provided most details, you may need only 3-4 questions total
- If no photo, aim for 5-6 questions
- Don't ask questions whose answers are already clear from context or photos

When you have gathered ALL required information (minimum 6-7 responses from client), write:
"Thank you! I have all the information needed for the quote. Here's the summary:"

And provide the SUMMARY in this format:
---SUMMARY---
TYPE OF WORK: [main type of work]

SCOPE OF WORK:
- [detailed item 1]
- [detailed item 2]
- [detailed item 3]
...

DIMENSIONS:
- Area: [sq ft/m²]
- Rooms: [how many and what kind]

CURRENT CONDITION:
- [description of technical condition]
- [damages to repair]

PREPARATORY WORK:
- [what needs to be removed/prepared]

MATERIALS: [client provides / contractor quotes / to discuss with contractor]

LOCATION: [address/floor/access]

TIMELINE: [when to start]

ADDITIONAL NOTES:
- [anything else relevant]
---END---

After the summary, ask:
1. Is everything correct or would you like to change anything?
2. Does the client have any questions for the contractor? (e.g., about availability, experience, warranty)

If the client has a question, record it in ADDITIONAL NOTES as "QUESTION FOR CONTRACTOR: [question content]"`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  images?: string[]
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - max 20 messages per hour per IP
    if (chatRateLimiter) {
      const ip = getClientIP(request)
      const { success } = await chatRateLimiter.limit(ip)

      if (!success) {
        return NextResponse.json(
          { error: 'Too many messages. Please try again later.' },
          { status: 429 }
        )
      }
    }

    const { messages } = await request.json() as {
      messages: ChatMessage[]
    }

    // Limit conversation size to prevent abuse
    if (!messages || messages.length > 40) {
      return NextResponse.json(
        { error: 'Conversation too long. Please start a new request.' },
        { status: 400 }
      )
    }

    // Limit total images per conversation (GPT-4o vision is expensive)
    const totalImages = messages.reduce((sum, m) => sum + (m.images?.length || 0), 0)
    if (totalImages > 5) {
      return NextResponse.json(
        { error: 'Too many images. Maximum 5 photos per conversation.' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Build messages for OpenAI API with image support (vision)
    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ]

    for (const msg of messages) {
      if (msg.role === 'assistant') {
        openaiMessages.push({
          role: 'assistant',
          content: msg.content,
        })
      } else {
        // User message - may contain images
        if (msg.images && msg.images.length > 0) {
          // Message with images - use content array
          const content: OpenAI.Chat.ChatCompletionContentPart[] = []

          if (msg.content && !msg.content.startsWith('[')) {
            content.push({
              type: 'text',
              text: msg.content,
            })
          }

          // Add all images
          for (const imageUrl of msg.images) {
            content.push({
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high', // High quality analysis
              },
            })
          }

          openaiMessages.push({
            role: 'user',
            content,
          })
        } else {
          // Regular text message
          openaiMessages.push({
            role: 'user',
            content: msg.content,
          })
        }
      }
    }

    // Use GPT-4o for better image analysis, fallback to mini if no images
    const hasImages = messages.some(m => m.images && m.images.length > 0)
    const model = hasImages ? 'gpt-4o' : 'gpt-4o-mini'

    const response = await openai.chat.completions.create({
      model,
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 800, // More tokens for image descriptions
    })

    const assistantMessage = response.choices[0]?.message?.content || 'Sorry, an error occurred.'

    // Check if message contains summary
    const hasSummary = assistantMessage.includes('---SUMMARY---')

    return NextResponse.json({
      message: assistantMessage,
      hasSummary,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}
