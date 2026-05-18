import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  const { transcript, role, round } = await req.json()

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `You are a speech-to-text correction assistant. The user is giving a ${round} interview for a ${role} position.
        
Your job:
- Fix incorrectly transcribed technical terms (e.g. "alga rhythm" → "algorithm", "cube earnest" → "Kubernetes")
- Fix grammar and sentence structure slightly
- Keep the meaning and tone EXACTLY the same — do not add new content
- Do NOT make the answer longer or better — just fix transcription errors
- Return ONLY the corrected text, nothing else, no explanation`
      },
      {
        role: 'user',
        content: transcript
      }
    ],
    max_tokens: 500,
  })

  const corrected = completion.choices[0].message.content || transcript
  return NextResponse.json({ corrected })
}