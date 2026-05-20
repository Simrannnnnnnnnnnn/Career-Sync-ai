import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { transcript, role, round } = await req.json()

  const systemPrompt = `You are a speech-to-text correction assistant. The user is giving a ${round} interview for a ${role} position.
        
Your job:
- Fix incorrectly transcribed technical terms (e.g. "alga rhythm" → "algorithm", "cube earnest" → "Kubernetes")
- Fix grammar and sentence structure slightly
- Keep the meaning and tone EXACTLY the same — do not add new content
- Do NOT make the answer longer or better — just fix transcription errors
- Return ONLY the corrected text, nothing else, no explanation`

  try {
    const response = await fetch(
      'https://simrankaurrrrr-careersync-ai.hf.space/chat',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: transcript }],
          systemPrompt: systemPrompt
        })
      }
    )

    if (!response.ok) {
      throw new Error(`HF Space error: ${response.status}`)
    }

    const data = await response.json()
    const corrected = data.reply || transcript
    return NextResponse.json({ corrected })

  } catch (error) {
    console.error('AI correction error:', error)
    // Error aaye toh original transcript wapas karo
    return NextResponse.json({ corrected: transcript })
  }
}