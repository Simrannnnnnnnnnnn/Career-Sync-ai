import { NextRequest, NextResponse } from 'next/server'

const HF_URL = `${process.env.HF_SPACE_URL}/chat`

export async function POST(req: NextRequest) {
  try {
    const { transcript, role, round } = await req.json()

    if (!transcript?.trim()) {
      return NextResponse.json({ corrected: transcript || '' })
    }

    const systemPrompt = `You are a speech-to-text correction assistant. The speaker is giving a ${round} interview for a ${role} position.

YOUR ONLY JOB:
- Fix mis-transcribed technical terms (e.g. "alga rhythm" → "algorithm", "cube earnest" → "Kubernetes", "react hooks" → "React Hooks")
- Fix obvious grammar errors from speech (e.g. "I were working" → "I was working")
- DO NOT add new content, ideas, or expand answers
- DO NOT make the answer sound smarter or longer
- DO NOT remove any content
- Keep the speaker's original words and tone as much as possible
- Return ONLY the corrected text — no explanation, no prefix, no quotes`

    const response = await fetch(HF_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: transcript }],
        systemPrompt,
        max_tokens: 300,
      }),
    })

    if (!response.ok) {
      // Silently fallback — correction is non-critical
      return NextResponse.json({ corrected: transcript })
    }

    const data = await response.json()
    const corrected = data.reply?.trim() || transcript

    return NextResponse.json({ corrected })
  } catch (error) {
    console.error('Correction API error:', error)
    // Always fallback gracefully — never block the interview
    const body = await req.json().catch(() => ({}))
    return NextResponse.json({ corrected: (body as any)?.transcript || '' })
  }
}