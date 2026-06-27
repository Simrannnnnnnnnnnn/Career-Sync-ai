import { NextRequest, NextResponse } from 'next/server'
import { correctSpeech } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const { transcript, role, round } = await req.json()

    if (!transcript?.trim()) {
      return NextResponse.json({ corrected: '' })
    }

    const systemPrompt = `You are a speech-to-text correction assistant for a ${round} interview for a ${role} position.

Your job:
- Fix grammar, spelling, and punctuation mistakes
- Keep the meaning and words exactly the same
- Do NOT add new content or change the answer
- Do NOT give feedback or suggestions
- Return ONLY the corrected text, nothing else`

    const userPrompt = `Correct this interview answer transcript:\n\n"${transcript}"`

    try {
      const corrected = await correctSpeech({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        maxTokens: 300,
        temperature: 0.2,
      })

      return NextResponse.json({ corrected: corrected.trim() })
    } catch {
      // If all providers fail, return original transcript
      return NextResponse.json({ corrected: transcript })
    }

  } catch (error) {
    console.error('Correction error:', error)
    return NextResponse.json({ corrected: '' }, { status: 500 })
  }
}