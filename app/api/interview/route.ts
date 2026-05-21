import { NextRequest, NextResponse } from 'next/server'

const HF_URL = `${process.env.HF_SPACE_URL}/chat`

const MAX_QUESTIONS = 8

// Rotating fallbacks — never repeat the same question
const FALLBACK_QUESTIONS_BY_ROUND: Record<string, string[]> = {
  hr: [
    "Tell me about yourself and your background.",
    "Why are you interested in this role?",
    "What's your greatest professional strength?",
    "Describe a time you worked well in a team.",
    "Where do you see yourself in 5 years?",
    "How do you handle pressure or tight deadlines?",
    "What motivates you in your work?",
    "Tell me about a conflict at work and how you resolved it.",
  ],
  technical: [
    "Walk me through a challenging technical problem you solved.",
    "How do you approach debugging a complex issue?",
    "Describe your experience with system design.",
    "What's your process for code reviews?",
    "Tell me about a project you're most proud of technically.",
    "How do you stay updated with new technologies?",
    "Describe a time you had to optimize performance in your code.",
    "What's your approach to writing maintainable code?",
  ],
  analytical: [
    "Walk me through how you would approach an unfamiliar problem.",
    "Describe a time you used data to make a decision.",
    "How do you prioritize when everything seems urgent?",
    "Tell me about a time your initial solution didn't work.",
    "How would you measure the success of a project?",
    "Describe a situation where you had incomplete information.",
    "How do you break down a complex problem into smaller parts?",
    "Tell me about a time you identified a non-obvious root cause.",
  ],
}

const DEFAULT_FALLBACKS = [
  "Can you walk me through your most recent project?",
  "What's a challenge you overcame recently at work?",
  "How do you approach learning something new?",
  "Describe your preferred way of working in a team.",
  "What's a skill you've been actively improving?",
  "Tell me about a time you had to adapt quickly.",
  "How do you handle feedback or criticism?",
  "What does a productive workday look like for you?",
]

function getFallbackQuestion(round: string, usedFallbackIndex: number): string {
  const pool = FALLBACK_QUESTIONS_BY_ROUND[round] || DEFAULT_FALLBACKS
  return pool[usedFallbackIndex % pool.length]
}

async function callHFSpace(body: object, retries = 2): Promise<Response> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(HF_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000), // 15s timeout per attempt
      })
      if (res.ok) return res
      // If 503 (HF Space sleeping), wait before retry
      if (res.status === 503 && attempt < retries - 1) {
        await new Promise(r => setTimeout(r, 3000))
        continue
      }
      const errText = await res.text()
      console.error(`HF Space error (attempt ${attempt + 1}):`, res.status, errText)
      lastError = new Error(`HF Space returned ${res.status}: ${errText}`)
    } catch (err: any) {
      console.error(`HF Space fetch failed (attempt ${attempt + 1}):`, err.message)
      lastError = err
      if (attempt < retries - 1) {
        await new Promise(r => setTimeout(r, 2000))
      }
    }
  }
  throw lastError || new Error('HF Space unreachable')
}

export async function POST(req: NextRequest) {
  try {
    const { role, round, difficulty, messages } = await req.json()

    const questionCount = (messages || []).filter(
      (m: any) => m.role === 'assistant'
    ).length

    if (questionCount >= MAX_QUESTIONS) {
      return NextResponse.json({ reply: 'INTERVIEW_COMPLETE' })
    }

    // Keep last 10 messages max
    const recentMessages = (messages || []).slice(-10).map((m: any) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }))

    // Build asked-questions list so AI doesn't repeat
    const askedQuestions = (messages || [])
      .filter((m: any) => m.role === 'assistant')
      .map((m: any, i: number) => `${i + 1}. ${m.content}`)
      .join('\n')

    const isOpening = questionCount === 0

    const systemPrompt = `You are a professional ${round} interviewer conducting a mock interview for a ${role} position at ${difficulty} level.

STRICT RULES:
- Ask EXACTLY ONE interview question. Nothing more.
- Do NOT number the question.
- Do NOT give feedback, hints, or explanations.
- Do NOT say "Great answer" or comment on their previous response.
- Keep the question concise — 1-3 sentences max.
- Vary question types: behavioral, situational, technical, scenario-based.
- CRITICAL: Do NOT repeat or rephrase any question already asked.
${isOpening
  ? `- This is the opening. Start with a warm greeting and ask them to introduce themselves.`
  : `- This is question ${questionCount + 1} of ${MAX_QUESTIONS}. Keep the conversation flowing naturally based on their last answer.`
}
${questionCount === MAX_QUESTIONS - 1
  ? `- This is the FINAL question. Make it a strong closing question.`
  : ''}
${askedQuestions
  ? `\nQuestions already asked (DO NOT repeat these):\n${askedQuestions}`
  : ''}`

    try {
      const response = await callHFSpace({
        messages: recentMessages,
        systemPrompt,
        max_tokens: 200,
      })

      const data = await response.json()
      const reply = data.reply?.trim()

      if (!reply) throw new Error('Empty reply from HF Space')

      return NextResponse.json({ reply })

    } catch (hfError) {
      // HF Space failed — use rotating fallback based on question index
      console.error('HF Space unreachable, using fallback:', hfError)
      const fallback = getFallbackQuestion(round, questionCount)
      return NextResponse.json({ reply: fallback })
    }

  } catch (error) {
    console.error('Interview API error:', error)
    return NextResponse.json(
      { reply: DEFAULT_FALLBACKS[0] },
      { status: 200 }
    )
  }
}