import { NextRequest, NextResponse } from 'next/server'
import { generateInterviewQuestion } from '@/lib/ai'

const MAX_QUESTIONS = 8

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

export async function POST(req: NextRequest) {
  try {
    const { role, round, difficulty, messages } = await req.json()

    const questionCount = (messages || []).filter(
      (m: any) => m.role === 'assistant'
    ).length

    if (questionCount >= MAX_QUESTIONS) {
      return NextResponse.json({ reply: '__INTERVIEW_COMPLETE__' })
    }

    const askedQuestions = (messages || [])
      .filter((m: any) => m.role === 'assistant')
      .map((m: any, i: number) => `${i + 1}. ${m.content}`)
      .join('\n')

    const recentMessages = (messages || []).slice(-10).map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const isOpening = questionCount === 0

    const systemPrompt = `You are a professional ${round} interviewer conducting a mock interview for a ${role} position at ${difficulty} level.

STRICT RULES:
- Ask EXACTLY ONE interview question. Nothing more.
- Do NOT number the question.
- Do NOT give feedback, hints, explanations, or assessments.
- Do NOT say "Great answer", "Interesting", "Sure!", "Absolutely!", or any filler response.
- Keep the question concise — 1–3 sentences max.
- Vary question types: behavioral, situational, technical, scenario-based.
- CRITICAL: Do NOT repeat, rephrase, or closely paraphrase any question already asked.
${isOpening
  ? `- This is the opening question. Greet the candidate warmly and ask them to introduce themselves.`
  : `- This is question ${questionCount + 1} of ${MAX_QUESTIONS}. Do NOT greet again — jump straight to the next question.`
}
${questionCount === MAX_QUESTIONS - 1 ? `- This is the FINAL question. Make it a strong closing question.` : ''}
${askedQuestions ? `\nQuestions already asked — do NOT repeat:\n${askedQuestions}` : ''}`

    try {
      const reply = await generateInterviewQuestion({
        messages: [
          { role: 'system', content: systemPrompt },
          ...recentMessages,
        ],
        maxTokens: 200,
        temperature: 0.7,
      })

      return NextResponse.json({ reply: reply.trim() })

    } catch (aiError) {
      console.error('All AI providers failed, using fallback:', aiError)
      const pool = FALLBACK_QUESTIONS_BY_ROUND[round] || DEFAULT_FALLBACKS
      return NextResponse.json({ reply: pool[questionCount % pool.length] })
    }

  } catch (error) {
    console.error('Interview API error:', error)
    return NextResponse.json({ reply: DEFAULT_FALLBACKS[0] }, { status: 200 })
  }
}