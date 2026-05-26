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
interface StarAnswer {
  situation: string
  task: string
  action: string
  result: string
}

interface ActionStep {
  heading: string
  content: string
  bullets?: string[]
}

interface ModelAnswer {
  situationTask: string
  actionSteps: ActionStep[]
  result: string
  whyItWins: string[]
}

// ─── Emergency fallback — only if ALL 3 AI providers fail ────────────────────
const EMERGENCY_FALLBACK = {
  question: "Tell me about a time you optimised a slow web application.",
  star: {
    situation: "Set the context clearly — what was the application, who used it, and what were the symptoms of the performance problem? Mention the scale (how many users, what load) and what was at stake if it stayed broken.",
    task: "Be explicit about YOUR ownership. Were you the sole developer? The backend lead? What would have happened if you hadn't fixed it?",
    action: "Walk through your process in phases: (1) How did you diagnose the root cause? What tools did you use? (2) What did you decide to fix first and why? (3) What did you actually implement — be specific about technologies. (4) How did you validate the fix worked?",
    result: "Give before/after numbers: load time, error rate, user count, cost savings. Then state the one lesson you'll carry forward from this experience."
  },
  modelAnswer: {
    situationTask: "In my final year, I was the backend lead on our college exam platform — SmartQuizzer. During peak exam season with 200+ students hitting it simultaneously, the platform was crashing completely. Every exam was a risk. The backend was running on SQLite with zero session management and no concurrency handling whatsoever, and fixing it was entirely on me.",
    actionSteps: [
      {
        heading: "Step 1: Profile first — don't guess the bottleneck",
        content: "Before touching a single line of code, I profiled the system using cProfile and manual timing logs on the API endpoints. I found three distinct root causes: SQLite's file-lock blocking all concurrent writes, no session caching so every authenticated request hit the database directly, and a race condition on simultaneous quiz submissions that was silently corrupting responses. Two of those three weren't what I initially suspected.",
        bullets: [
          "cProfile revealed the database layer was responsible for 78% of response time",
          "SQLite file-lock meant any concurrent write literally queued behind the first",
          "Race condition only appeared under load — invisible in local testing"
        ]
      },
      {
        heading: "Step 2: Migrate to MongoDB Atlas + Redis session cache",
        content: "I chose MongoDB Atlas over Postgres because quiz data is naturally nested — questions, options, and student responses are a document, not a relational table. Forcing that into Postgres would've meant joins on every quiz fetch. I layered Redis on top for session caching with a 30-minute TTL so authenticated requests stopped hitting the database entirely. That single change eliminated about 60% of DB load immediately.",
        bullets: [
          "MongoDB: document model fits quiz schema, no joins needed, horizontal scale built in",
          "Redis: sub-millisecond session lookups vs 80ms+ SQLite reads under concurrent load",
          "30-min TTL: long enough to cover an exam session, short enough to not stale"
        ]
      },
      {
        heading: "Step 3: Submission queue + load testing before go-live",
        content: "The race condition needed a different fix — I built a lightweight in-memory queue with retry logic so quiz submissions were serialised per user. No two submissions from the same student could race each other. Then I Dockerised the whole stack, deployed on HuggingFace Spaces, and load tested with Locust simulating 300 concurrent users before I declared it ready. I wasn't going to let another exam run on a system I hadn't stress-tested.",
      }
    ],
    result: "Zero crashes across the next three exam cycles. Page load time dropped from 8 seconds to under 1.5 seconds. The platform now handles 500+ concurrent users reliably. The lesson I carry into every project: always profile before you optimise — I was wrong about where the bottleneck was until the data told me otherwise.",
    whyItWins: [
      "Profiling before coding shows engineering discipline — not 'I rewrote it and it got faster'",
      "Explaining WHY MongoDB over Postgres (document model fit) shows architectural reasoning, not just name-dropping",
      "The race condition detail is specific and non-obvious — it proves you actually did this work",
      "Load testing with Locust before go-live shows you think about validation, not just implementation"
    ]
  },
  tips: [
    "Always say how you diagnosed the problem — not just what you fixed",
    "Explain WHY you chose your technology over the obvious alternative",
    "Include a non-obvious finding — something that surprised you. It makes the story credible",
    "End with a principle, not just an outcome — 'the lesson I carry forward is...'",
  ]
}

export async function POST(req: NextRequest) {
  try {
    const { role, round, difficulty, askedQuestions = [] } = await req.json()
    const askedIndex = askedQuestions.length

    const askedList = askedQuestions.length > 0
      ? `Already asked — DO NOT repeat or rephrase these:\n${askedQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}`
      : ''

    const systemPrompt = `You are a world-class interview coach generating a complete guided interview answer for a candidate to study and model.

Generate for:
- Role: ${role}
- Round: ${round}  
- Level: ${difficulty}

${askedList}

CRITICAL: Return ONLY valid JSON. No markdown, no backticks, nothing else.

You are creating TWO things:
1. A STAR guide (how the candidate SHOULD structure their answer — coaching advice)
2. A model answer (what a STRONG candidate would ACTUALLY SAY — first person, spoken out loud)

These are different. The star guide gives instructions. The modelAnswer demonstrates execution.

JSON format (exact):
{
  "question": "<a specific, realistic interview question for this role and round — not generic>",

  "star": {
    "situation": "<2-3 sentences of coaching: what context should they set? What details matter? What does the interviewer want to understand from this section?>",
    "task": "<2-3 sentences of coaching: how should they clarify their personal ownership? What's the difference between 'we did' and 'I was responsible for'?>",
    "action": "<4-5 sentences of coaching: how should they structure the action? What level of technical depth? What frameworks or phases work for this question type? What do strong candidates include that weak ones miss?>",
    "result": "<2-3 sentences of coaching: what numbers or metrics matter here? How do they quantify impact? What's the difference between a weak result and a strong one?>"
  },

  "modelAnswer": {
    "situationTask": "<2-3 sentences spoken in FIRST PERSON by a strong candidate. This is NOT coaching — this IS the answer. Real project name, real numbers, real stakes. Sounds like a confident engineer speaking, not reading a template. Example tone: 'In my final year at LPU, I was the backend lead on our exam platform — SmartQuizzer. During peak exam season with 200+ concurrent users, it was crashing on every major exam. Fixing it was completely on me.'>",

    "actionSteps": [
      {
        "heading": "<Step N: Short descriptive title — e.g. 'Step 1: Profile before touching anything'>",
        "content": "<2-4 sentences spoken in FIRST PERSON. What the candidate actually did, WHY they chose this approach over alternatives, what was technically hard. Name real tools and methods specific to ${role}. This should sound like a senior engineer narrating their work — not a textbook definition.>",
        "bullets": ["<optional: 2-3 specific technical details, tool names, or numbers that add depth>"]
      }
    ],

    "result": "<2-3 sentences in first person. Before/after numbers (load time, error rate, cost, users). End with a transferable lesson — the insight they'll carry forward. Sounds like someone proud of real work they did.>",

    "whyItWins": [
      "<Specific reason this answer would impress an interviewer — reference an actual element of the modelAnswer above, not generic advice>",
      "<Specific reason 2>",
      "<Specific reason 3>",
      "<Specific reason 4>"
    ]
  },

  "tips": [
    "<Specific tip for answering THIS exact question well — not generic STAR advice>",
    "<Specific tip 2>",
    "<Specific tip 3>",
    "<Specific tip 4>"
  ]
}

Rules for modelAnswer:
- situationTask and result must be first-person spoken sentences — "I was...", "I built...", "We shipped..."
- actionSteps must have 2-4 steps with real technical content specific to ${role}
- Each step content must name actual tools, frameworks, or methods (e.g. EXPLAIN ANALYZE, Redis TTL, React.lazy, MICE, base62, Locust, Evidently AI, MLflow)
- bullets are optional but use them for technical sub-details that add credibility
- whyItWins must reference specific elements FROM the modelAnswer above — not generic interview advice
- The whole modelAnswer should sound like a real person who actually did this work, narrating it confidently`

    try {
      const response = await callHFSpace({
        messages: [{
          role: 'user',
          content: `Generate a unique ${round} round interview question with complete guided model answer for a ${role} role at ${difficulty} level.`
        }],
        systemPrompt,
        max_tokens: 2000,
      })

      const data = await response.json()
      const raw = (data.reply || '').trim()

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

      if (parsed?.question && parsed?.star && parsed?.modelAnswer?.situationTask) {
        return NextResponse.json({
          question: parsed.question,
          star: parsed.star,
          modelAnswer: parsed.modelAnswer,
          tips: parsed.tips || [],
        })
      }

      throw new Error('Could not parse HF response')

    } catch (hfError) {
      console.error(`[mock] AI failed (q${askedIndex + 1}):`, hfError)
      return NextResponse.json(EMERGENCY_FALLBACK)
    }

  } catch (error) {
    console.error('[mock] Route error:', error)
    return NextResponse.json(EMERGENCY_FALLBACK)
  }
}