import { NextRequest, NextResponse } from 'next/server'

const HF_URL = 'https://simrankaurrrrr-careersync-ai.hf.space/chat'

// How many Q's before wrapping up
const MAX_QUESTIONS = 8

export async function POST(req: NextRequest) {
  try {
    const { role, round, difficulty, messages } = await req.json()

    // ── Count how many questions interviewer has already asked ──
    const questionCount = (messages || []).filter(
      (m: any) => m.role === 'assistant'
    ).length

    // ── Signal frontend to end session ──
    if (questionCount >= MAX_QUESTIONS) {
      return NextResponse.json({
        reply: 'INTERVIEW_COMPLETE',
      })
    }

    // ── Build conversation history for LLaMA ──
    // Keep last 10 messages max to stay within context
    const recentMessages = (messages || []).slice(-10).map((m: any) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }))

    // ── System prompt ──
    const isOpening = questionCount === 0
    const systemPrompt = `You are a professional ${round} interviewer conducting a mock interview for a ${role} position at ${difficulty} level.

STRICT RULES:
- Ask EXACTLY ONE interview question. Nothing more.
- Do NOT number the question.
- Do NOT give feedback, hints, or explanations.
- Do NOT say "Great answer" or comment on their previous response.
- Keep the question concise — 1-3 sentences max.
- Vary question types: behavioral, situational, technical, scenario-based.
${
  isOpening
    ? `- This is the opening. Start with a warm greeting and ask them to introduce themselves.`
    : `- This is question ${questionCount + 1} of ${MAX_QUESTIONS}. Keep the conversation flowing naturally based on their last answer.`
}
${
  questionCount === MAX_QUESTIONS - 1
    ? `- This is the FINAL question. Make it a strong closing question.`
    : ''
}`

    const response = await fetch(HF_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: recentMessages,
        systemPrompt,
        max_tokens: 200, // Questions are short
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('HF Space error:', response.status, errText)
      throw new Error(`HF Space returned ${response.status}`)
    }

    const data = await response.json()
    const reply = data.reply?.trim()

    if (!reply) throw new Error('Empty reply from HF Space')

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Interview API error:', error)
    return NextResponse.json(
      { reply: 'Could you tell me about a challenging project you worked on recently?' },
      { status: 200 } // Return 200 with fallback so frontend doesn't crash
    )
  }
}