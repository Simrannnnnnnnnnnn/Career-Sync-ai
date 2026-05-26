import { NextRequest, NextResponse } from 'next/server'

const HF_URL = `${process.env.HF_SPACE_URL}/chat`

async function callHFSpace(body: object, retries = 2): Promise<Response> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(HF_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(25000),
      })
      if (res.ok) return res
      if (res.status === 503 && attempt < retries - 1) {
        await new Promise(r => setTimeout(r, 3000))
        continue
      }
      lastError = new Error(`HF Space returned ${res.status}`)
    } catch (err: any) {
      lastError = err
      if (attempt < retries - 1) await new Promise(r => setTimeout(r, 2000))
    }
  }
  throw lastError || new Error('HF Space unreachable')
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface ModelAnswer {
  situation: string
  task: string
  action: string
  result: string
}

// ─── Minimal fallback — only used if ALL 3 AI providers fail ─────────────────
const EMERGENCY_FALLBACK = {
  question: "Tell me about a time you solved a challenging technical problem.",
  modelAnswer: {
    situation: "In my final year project, our platform was crashing under load during exam season — 200+ students hitting it simultaneously and the backend was running on SQLite with zero concurrency handling.",
    task: "I was the sole backend developer, so diagnosing and fixing the entire database and API layer was on me. We had an exam scheduled in 48 hours.",
    action: `Before touching any code, I profiled the system to find the actual bottlenecks rather than guessing. I used Python's cProfile and some manual timing logs and found three root causes: SQLite's file-lock blocking concurrent writes, no session caching so every request hit the database directly, and a race condition on simultaneous quiz submissions.

I migrated from SQLite to MongoDB Atlas — the document model was a natural fit for nested quiz data (questions, options, responses). On top of that I added Redis for session caching which brought database load down by around 60% immediately. For the submission race condition I built a lightweight in-memory queue with retry logic so submissions were serialised per user.

I Dockerised the whole stack and deployed on HuggingFace Spaces, then ran a load test with Locust simulating 300 concurrent users before declaring it ready.`,
    result: "Zero crashes across the next three exam cycles. Page load time dropped from 8 seconds to under 1.5 seconds. The biggest lesson: always profile before optimising — I was convinced the problem was on the frontend until the data told me otherwise."
  },
  tips: [
    "Profile before you optimise — assumptions about bottlenecks are almost always wrong",
    "Quantify before/after impact: load time, error rate, user count",
    "Show you considered tradeoffs, not just 'I used X technology'",
    "End with a lesson that shows you'll carry this forward",
  ]
}

export async function POST(req: NextRequest) {
  try {
    const { role, round, difficulty, askedQuestions = [] } = await req.json()
    const askedIndex = askedQuestions.length

    const askedList = askedQuestions.length > 0
      ? `Already asked — DO NOT repeat or rephrase these:\n${askedQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}`
      : ''

    const systemPrompt = `You are a world-class interview coach. Generate ONE unique interview question and a complete model answer written from the perspective of a strong candidate speaking out loud in an interview.

Generate for:
- Role: ${role}
- Round: ${round}
- Level: ${difficulty}

${askedList}

CRITICAL: Return ONLY a valid JSON object. No markdown, no backticks, no extra text.

The modelAnswer must sound like a real candidate actually speaking — confident, specific, first-person narrative. NOT a framework, NOT a list of tips or bullet points. Each field is what the candidate would actually say out loud.

The "action" field is the most important part. It must be 3-5 paragraphs of flowing narrative that:
- Describes the problem-solving process with phases (diagnosis → decision → implementation → validation)
- Names specific tools, technologies, algorithms relevant to the ${role} role
- Includes real-sounding before/after metrics or numbers
- Has at least one moment of unexpected finding or course-correction
- Sounds like a senior engineer telling a story from memory, not reading a textbook

JSON format (exact fields, no extras):
{
  "question": "<a specific, realistic interview question for this role and round>",
  "modelAnswer": {
    "situation": "<2-3 sentences, first person. Sets the scene: project context, the problem, what was at stake. Be specific — mention the type of company, team size, technology environment.>",
    "task": "<1-2 sentences. YOUR specific ownership. What decisions were yours to make? What would break if you failed?>",
    "action": "<3-5 paragraphs of continuous narrative. Walk through what you did: how you diagnosed the problem, what you tried, why you made key decisions over alternatives, what surprised you, what you had to course-correct. Name specific tools and methods (e.g. EXPLAIN ANALYZE, Redis TTL, React.lazy, MICE imputation, base62 encoding, Evidently AI, MLflow, k6 load testing). Never use bullet points or numbered lists inside this field.>",
    "result": "<2-3 sentences. Quantified outcome with before/after numbers. End with a transferable insight that shows the lesson stuck.>"
  },
  "tips": [
    "<specific actionable tip for answering this exact type of question>",
    "<specific actionable tip>",
    "<specific actionable tip>",
    "<specific actionable tip>"
  ]
}`

    try {
      const response = await callHFSpace({
        messages: [{
          role: 'user',
          content: `Generate a unique ${round} round interview question with a complete narrative model answer for a ${role} role at ${difficulty} level.`
        }],
        systemPrompt,
        max_tokens: 2000,
      })

      const data = await response.json()
      const raw = (data.reply || '').trim()

      // Try parsing — three attempts with progressively more aggressive cleaning
      let parsed: any = null

      try { parsed = JSON.parse(raw) } catch { }

      if (!parsed) {
        try {
          const stripped = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
          parsed = JSON.parse(stripped)
        } catch { }
      }

      if (!parsed) {
        try {
          const first = raw.indexOf('{')
          const last = raw.lastIndexOf('}')
          if (first !== -1 && last !== -1) parsed = JSON.parse(raw.slice(first, last + 1))
        } catch { }
      }

      if (parsed?.question && parsed?.modelAnswer?.situation) {
        return NextResponse.json({
          question: parsed.question,
          modelAnswer: parsed.modelAnswer,
          tips: parsed.tips || [],
        })
      }

      throw new Error('AI response could not be parsed into expected shape')

    } catch (hfError) {
      console.error(`[mock] AI generation failed (question ${askedIndex + 1}):`, hfError)
      // Only reach here if ALL 3 providers (Groq + Gemini + Cerebras) failed
      return NextResponse.json(EMERGENCY_FALLBACK)
    }

  } catch (error) {
    console.error('[mock] Route-level error:', error)
    return NextResponse.json(EMERGENCY_FALLBACK)
  }
}