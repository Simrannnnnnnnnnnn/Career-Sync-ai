import { NextRequest, NextResponse } from 'next/server'

const MAX_QUESTIONS = 8

// ── Roles jinmein coding questions aate hain ──────────────────────────────────
const CODING_ROLE_KEYWORDS = [
  'software', 'developer', 'engineer', 'frontend', 'backend', 'full stack', 'fullstack',
  'data scientist', 'ml engineer', 'machine learning', 'devops', 'sre', 'site reliability',
  'mobile', 'android', 'ios', 'data engineer', 'qa', 'sdet', 'test engineer',
  'cloud engineer', 'platform engineer', 'systems engineer', 'embedded', 'firmware',
]

function isCodingRole(role: string): boolean {
  const lower = role.toLowerCase()
  return CODING_ROLE_KEYWORDS.some(keyword => lower.includes(keyword))
}

// Technical round phase — only for coding roles
// Q1-2: Theory, Q3-6: Coding, Q7-8: System Design
function getTechnicalPhase(questionCount: number): 'theory' | 'coding' | 'analysis' {
  if (questionCount < 2) return 'theory'
  if (questionCount < 6) return 'coding'
  return 'analysis'
}

const FALLBACK_QUESTIONS: Record<string, string[]> = {
  hr: ["Tell me about yourself.", "Why are you interested in this role?", "What's your greatest strength?", "Describe teamwork experience.", "Where do you see yourself in 5 years?", "How do you handle pressure?", "What motivates you?", "Describe a conflict you resolved."],
  technical: ["Walk me through a technical problem you solved.", "How do you debug complex issues?", "Describe your system design experience.", "What's your code review process?", "Tell me about your proudest project.", "How do you stay updated with tech?", "Describe a performance optimization you did.", "How do you write maintainable code?"],
  analytical: ["How do you approach unfamiliar problems?", "Describe using data to make a decision.", "How do you prioritize urgent tasks?", "Tell me about a failed solution.", "How do you measure project success?", "Describe working with incomplete information.", "How do you break down complex problems?", "Tell me about finding a non-obvious root cause."],
}

// ── Cerebras ──────────────────────────────────────────────────────────────────
async function tryCerebras(systemPrompt: string, messages: any[], maxTokens: number): Promise<string> {
  const key = process.env.CEREBRAS_API_KEY
  if (!key) throw new Error('No Cerebras key')
  const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`Cerebras ${res.status}`)
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error('Cerebras empty')
  return text
}

// ── Groq ──────────────────────────────────────────────────────────────────────
async function tryGroq(systemPrompt: string, messages: any[], maxTokens: number): Promise<string> {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('No Groq key')
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}`)
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error('Groq empty')
  return text
}

// ── HF Space ──────────────────────────────────────────────────────────────────
async function tryHFSpace(systemPrompt: string, messages: any[], maxTokens: number): Promise<string> {
  const url = process.env.HF_SPACE_URL
  if (!url) throw new Error('No HF Space URL')
  const res = await fetch(`${url}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, messages, max_tokens: maxTokens }),
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`HF Space ${res.status}`)
  const data = await res.json()
  const text = data.reply?.trim()
  if (!text) throw new Error('HF Space empty')
  return text
}

export async function POST(req: NextRequest) {
  try {
    const { role, round, difficulty, messages } = await req.json()

    const questionCount = (messages || []).filter((m: any) => m.role === 'assistant').length

    if (questionCount >= MAX_QUESTIONS) {
      return NextResponse.json({ reply: '__INTERVIEW_COMPLETE__' })
    }

    const askedQuestions = (messages || [])
      .filter((m: any) => m.role === 'assistant')
      .map((m: any, i: number) => `${i + 1}. ${m.content}`)
      .join('\n')

    const recentMessages = (messages || []).slice(-10).map((m: any) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }))

    const isOpening    = questionCount === 0
    const codingRole   = round === 'technical' && isCodingRole(role)
    const phase        = codingRole ? getTechnicalPhase(questionCount) : null

    // ── Phase-aware instructions ──────────────────────────────────────────────
    let phaseInstructions = ''

    if (codingRole && phase === 'theory') {
      phaseInstructions = `
PHASE — Theory (${questionCount + 1}/2):
- Ask a conceptual CS/programming question (data structures, algorithms, OOP, etc.)
- Pure theory only. Do NOT ask for any code yet.`

    } else if (codingRole && phase === 'coding') {
      phaseInstructions = `
PHASE — Coding (coding Q${questionCount - 1}/4):
- Ask a CODING problem where the candidate must write actual code.
- IMPORTANT: Start your question with exactly "CODING_QUESTION:" — no space before it.
- Describe what the function should do, inputs, and expected output clearly.
- Keep difficulty appropriate for ${difficulty} level.
- Example: "CODING_QUESTION: Write a function that returns the second largest number in an array. Handle edge cases like duplicates and arrays with fewer than 2 elements."
- Do NOT ask for explanation, just the coding problem.`

    } else if (codingRole && phase === 'analysis') {
      phaseInstructions = `
PHASE — System Design / Analysis (${questionCount - 5}/2):
- Ask a system design or architecture question. No live coding needed.
- Focus on scalability, trade-offs, real-world decisions.
- Example topics: designing an API, caching strategy, database choice, load balancing.`
    }
    // Non-coding roles (PM, HR, Designer etc.) get no phaseInstructions → normal questions only

    const systemPrompt = `You are a professional ${round} interviewer for a ${role} position at ${difficulty} level.

RULES:
- Ask EXACTLY ONE question, nothing else.
- No numbering, no feedback, no filler words like "Great!", "Sure!", "Absolutely!".
- Keep it concise — 1-3 sentences max.
- Do NOT repeat or rephrase questions already asked.
${isOpening
  ? '- Greet warmly and ask candidate to introduce themselves briefly.'
  : `- Question ${questionCount + 1} of ${MAX_QUESTIONS}. Jump straight to question, no greeting.`}
${questionCount === MAX_QUESTIONS - 1 ? '- This is the FINAL question. Make it strong and memorable.' : ''}
${phaseInstructions}
${askedQuestions ? `\nAlready asked — do NOT repeat:\n${askedQuestions}` : ''}`

    // ── Provider chain ────────────────────────────────────────────────────────
    const providers = [
      { name: 'Cerebras', fn: () => tryCerebras(systemPrompt, recentMessages, 200) },
      { name: 'Groq',     fn: () => tryGroq(systemPrompt, recentMessages, 200) },
      { name: 'HFSpace',  fn: () => tryHFSpace(systemPrompt, recentMessages, 200) },
    ]

    for (const provider of providers) {
      try {
        const reply = await provider.fn()
        return NextResponse.json({ reply })
      } catch (err: any) {
        console.warn(`[Interview] ${provider.name} failed: ${err.message}`)
      }
    }

    // All providers failed — fallback pool
    const pool = FALLBACK_QUESTIONS[round] || FALLBACK_QUESTIONS.hr
    return NextResponse.json({ reply: pool[questionCount % pool.length] })

  } catch (error: any) {
    console.error('[Interview] Error:', error.message)
    return NextResponse.json({ reply: 'Tell me about yourself and your background.' })
  }
}