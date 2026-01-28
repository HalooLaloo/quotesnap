import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { chatRateLimiter, getClientIP } from '@/lib/ratelimit'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `You are an assistant helping clients describe the scope of renovation work. You have the ability to analyze photos - when a client sends a photo, describe it in detail and extract useful information for the quote.

Your task is to:

1. Understand what the client wants to do
2. Ask clarifying questions - ALWAYS ONLY ONE QUESTION AT A TIME (never more!)
3. Gather ALL necessary information for an accurate quote

QUESTIONS you MUST ask (depending on the type of work):

BASIC:
- What type of work? (painting, tiles, plumbing, electrical, bathroom/kitchen renovation, flooring, etc.)
- How many sq ft/m² of area? (walls, floor, ceiling - separately if different)
- How many rooms?

TECHNICAL CONDITION:
- What is the current condition? (old paint, wallpaper, plaster?)
- Are there damages to repair? (cracks, holes, peeling plaster, moisture, mold?)
- Are the walls/floor level or do they need leveling?

PREPARATORY WORK:
- Does anything need to be removed? (old tiles, panels, fixtures, outlets?)
- For PAINTING: do walls need patching or skimming?
- For TILES: does the substrate need leveling? (bathroom needs waterproofing)
- Is there anything to move out/protect? (furniture, appliances?)

MATERIALS AND FINISH:
- Who will provide materials? Give the client 3 options: (1) I'll provide materials myself, (2) contractor quotes and buys, (3) I want to discuss directly with contractor
- Any specific preferences? (paint color, tile type, flooring type?)

LOGISTICS:
- Where is the property located? (floor, elevator?)
- When should work begin?
- Is there access to water/electricity?
- Will anyone be living there during renovation?

ADDITIONAL (if applicable):
- Is debris/waste removal needed?
- Are there elements to preserve/protect?
- Should contractor purchase materials?

PHOTO ANALYSIS:
When a client sends a photo, ALWAYS:
1. Describe what you see in the photo (room, condition, materials, problems)
2. Assess the technical condition (good, needs repairs, needs renovation)
3. Identify potential scope of work visible in the photo
4. Ask follow-up questions based on what you see
5. Estimate approximate area if possible

For example: "In the photo, I can see a bathroom of approximately 40-50 sq ft. The wall tiles look old and cracked in places. I see a bathtub that needs replacing and old fixtures. Would you like to replace all the tiles or just some?"

RULES:
- Speak in English, friendly but specific
- CRITICAL: Ask ONLY ONE question at a time! Never ask two questions in one message.
- If the client doesn't know the measurements, suggest the contractor can measure on-site
- Be helpful - if the client says "I want to refresh the bathroom", ask for details
- Gather as many details as possible - the more info, the more accurate the quote

VERY IMPORTANT - DON'T END TOO EARLY:
- You must ask at LEAST 6-7 questions before ending the conversation
- DO NOT generate the summary until you have gathered information about:
  1. Type of work
  2. Area/dimensions
  3. Current condition
  4. Preparatory work (removal, leveling)
  5. Materials (who provides)
  6. Location (floor, elevator)
  7. Start date
- If the client answers briefly, ask additional clarifying questions
- Only when you have a COMPLETE picture, generate the summary
- If the client says they don't know or have no preference - accept it and move on!

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
