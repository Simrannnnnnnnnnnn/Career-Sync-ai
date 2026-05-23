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

// ─── Rich fallback pool ───────────────────────────────────────────────────────
const FALLBACK_BY_ROUND: Record<string, {
  question: string
  star: { situation: string; task: string; action: string; result: string }
  example: { situation: string; task: string; action: string; result: string }
  tips: string[]
}[]> = {
  screening: [
    {
      question: "Tell me about yourself briefly.",
      star: {
        situation: "This is typically the very first question in a screening call. The recruiter wants a quick snapshot of who you are professionally — not your life story.",
        task: "Your job is to deliver a crisp, confident 90-second professional summary that connects your background directly to the role you're applying for.",
        action: "Structure it as: (1) Who you are and your current role/education, (2) Your top 2-3 relevant skills or experiences, (3) Why you're excited about THIS specific role at THIS company. Practice until it flows naturally.",
        result: "A great answer leaves the recruiter nodding and wanting to learn more. End with something like: 'That's a quick overview — I'd love to learn more about what success looks like in this role.'"
      },
      example: {
        situation: "You're interviewing for a Data Analyst role at a fintech startup.",
        task: "Introduce yourself in a way that highlights your analytical background and enthusiasm for fintech.",
        action: "\"I'm a final-year MCA student specializing in Data Science. Over the past year I've built projects involving Python, SQL, and machine learning — including a resume parser that reduced screening time by 40% in a mock deployment. I interned at IBM SkillsBuild where I worked on AI strategy and BI dashboards. I'm particularly excited about this role because I love turning messy financial data into actionable insights.\"",
        result: "The recruiter immediately sees relevant skills, real project experience, and genuine motivation — all in under 90 seconds."
      },
      tips: [
        "Keep it under 2 minutes — recruiters hear this answer 50 times a day",
        "Always end by connecting back to the specific role",
        "Avoid starting with 'I was born in...' — start with your current professional identity",
        "Prepare 3 versions: 30 sec, 90 sec, and 3 min for different contexts",
      ]
    },
    {
      question: "What are your salary expectations?",
      star: {
        situation: "The recruiter is trying to quickly qualify whether your expectations align with the budget before investing more time.",
        task: "Give a range that's well-researched, shows you know your market value, and leaves room for negotiation without underselling yourself.",
        action: "Research the market rate on LinkedIn Salary, Glassdoor, and AmbitionBox for this exact role and city. Then say: 'Based on my research and X years of experience, I'm targeting Y–Z LPA, but I'm open to the full compensation package.' Always give a range, not a single number.",
        result: "A confident, researched answer shows you're a professional who knows their worth — not desperate or naive. It also keeps the door open for negotiation."
      },
      example: {
        situation: "You're a fresher applying for a Software Engineer role in Bangalore.",
        task: "Give a salary range that's realistic for a fresher but not undercutting yourself.",
        action: "\"Based on my research on Glassdoor and AmbitionBox for entry-level SDE roles in Bangalore, the range is typically 6–10 LPA. Given my internship experience and the projects I've shipped, I'm targeting 7–9 LPA — but I'm absolutely open to discussing the full package including learning opportunities and growth.\"",
        result: "You've anchored on a researched range, shown confidence, and signaled flexibility — without leaving money on the table."
      },
      tips: [
        "Never give a single number — always a range (the lower end should be your floor)",
        "If pressured to go first, research the market first — never guess",
        "Include 'open to full package' to leave room for bonuses, ESOPs, etc.",
        "Never apologize for your number — say it confidently",
      ]
    },
  ],
  initial: [
    {
      question: "Describe your most impactful project.",
      star: {
        situation: "Set the context clearly: what was the business problem, what was at stake, and what was the state of things before you got involved?",
        task: "Be explicit about YOUR role — not the team's role. What were YOU specifically responsible for? What decisions did you own?",
        action: "Walk through the key decisions and actions you personally took. What approach did you choose and why? What was technically or organizationally hard about this? Be specific and show your thinking.",
        result: "Quantify the impact wherever possible: 'reduced load time by 40%', 'saved 200 engineering hours per month', 'increased conversion by 12%'."
      },
      example: {
        situation: "During my MCA final year, our college's quiz platform kept crashing during exams because it was built on SQLite with no proper session handling — 200+ students affected.",
        task: "I was the backend lead responsible for redesigning the database layer and API to handle concurrent users without data loss.",
        action: "I migrated the database from SQLite to MongoDB Atlas, built a custom REST API with Node.js and added Redis-based session caching. I also added a queue system so concurrent quiz submissions wouldn't conflict. The whole migration took 3 weeks including testing.",
        result: "Zero crashes in the next 3 exam cycles. Page load time dropped from 8 seconds to under 1.5 seconds. The platform now handles 500+ concurrent users reliably — and I deployed it on HuggingFace Spaces with Docker."
      },
      tips: [
        "Prepare 2-3 projects in full STAR detail before the interview",
        "Pick a project where YOUR decision made a real difference",
        "Numbers are gold — spend time before the interview gathering metrics",
        "Keep Situation + Task under 90 seconds — spend most time on Action and Result",
      ]
    },
    {
      question: "Tell me about a time you failed and what you learned.",
      star: {
        situation: "Choose a real failure — not a fake one. Pick something meaningful enough to show self-awareness, but not so catastrophic it raises red flags.",
        task: "Show you owned the failure — not that you blame others or circumstances.",
        action: "Walk through what you did wrong, what warning signs you missed, and what you tried to do to fix it. Be specific — generic failures don't land well.",
        result: "What did you CHANGE because of this failure? Show that you extracted a concrete lesson and applied it."
      },
      example: {
        situation: "In my second year, I was leading a team project to build a recommendation system. I assumed everyone understood the timeline and didn't hold formal check-ins.",
        task: "I was project lead — responsible for delivery and team coordination.",
        action: "Two days before the deadline, I realized two teammates had been blocked on an API integration for a week but hadn't spoken up. I stayed up two nights to fix it but we still submitted late and lost 15% of our grade.",
        result: "I changed my approach completely — now I run brief daily standups on any team project and explicitly ask 'what's blocking you?' I haven't had a surprise blocker since. That failure taught me that leadership is about creating safety for problems to surface early."
      },
      tips: [
        "Don't pick a trivial failure — it looks like you're hiding something",
        "Don't over-explain or justify — own it clearly and move to the learning",
        "The 'what I changed' part is what differentiates great answers",
        "End on a forward-looking note — show you're better because of it",
      ]
    },
  ],
  technical: [
    {
      question: "How would you design a URL shortener like bit.ly?",
      star: {
        situation: "This is a classic system design question. The interviewer wants to see how you think through scale, tradeoffs, and architecture.",
        task: "Design a system that can shorten URLs, store the mapping, and redirect users — at potentially millions of requests per day.",
        action: "Walk through each component: (1) API layer — POST /shorten, GET /{code}. (2) Hashing — base62 encoding of auto-increment ID. (3) Storage — Postgres for mappings, Redis for hot URL cache. (4) Redirect — 301 vs 302 tradeoff. (5) Scale — CDN + read replicas. (6) Analytics — async Kafka queue.",
        result: "A complete answer covers the happy path, edge cases (duplicate URLs, expiry, custom slugs), and discusses tradeoffs clearly."
      },
      example: {
        situation: "Interviewer asks: 'Design bit.ly for 100M daily active users.'",
        task: "You need to walk through the full architecture in ~10 minutes, covering storage, hashing, redirects, and scale.",
        action: "\"I'd start with a POST /shorten endpoint that takes a long URL. I'd generate a short code using base62 encoding of an auto-incremented DB ID — that gives 56 billion+ unique codes with 6 characters. Store the mapping in Postgres. For redirects, use a Redis cache with a 24-hour TTL — 80% of traffic hits cached URLs anyway. For the redirect itself, I'd use 302 (not 301) so we can track analytics. At scale, I'd add a CDN in front and horizontal DB read replicas.\"",
        result: "You've shown you can think through the full stack — from API design to caching to scale — and you understand the WHY behind each decision."
      },
      tips: [
        "Always clarify requirements first: scale? analytics needed? custom URLs?",
        "Explain WHY you chose each component, not just what",
        "Discuss tradeoffs: SQL vs NoSQL, 301 vs 302, cache TTL choices",
        "Don't jump to the most complex solution first — start simple, then scale",
      ]
    },
  ],
  final: [
    {
      question: "What's your long-term career vision?",
      star: {
        situation: "Final round interviewers want to know if you're a long-term investment. They're asking: will you grow with us, or leave in 18 months?",
        task: "Paint a credible, authentic picture of where you want to be in 3-5 years that logically connects to this role as a stepping stone.",
        action: "Structure it as: (1) Short term — what you want to master in this role, (2) Medium term — where you want to grow (senior IC or lead), (3) How this company specifically helps you get there.",
        result: "A great answer shows ambition + humility + alignment with the company's growth trajectory. Flip it into a question at the end."
      },
      example: {
        situation: "You're in the final round for an ML Engineer role at a product company.",
        task: "Show that your career goals align with the company's direction and that you're a long-term bet worth making.",
        action: "\"In the next 1-2 years, I want to go deep on production ML — building robust pipelines, learning MLOps best practices, and owning models end-to-end in a real product environment. In 3-5 years, I see myself as a senior ML engineer who can both design systems and mentor junior engineers. I'm particularly drawn to this company because you're building AI features that reach millions of users — that's the scale I want to learn at. Can I ask — what does the typical growth path look like for engineers who join at this level?\"",
        result: "You've shown ambition that's grounded and realistic, tied your vision directly to the company, and turned it into a two-way conversation."
      },
      tips: [
        "Research the company's growth trajectory — ambitious companies want ambitious people",
        "Don't say 'your job' — it makes senior leaders uncomfortable",
        "Tie your vision to the company's mission where possible",
        "Always flip it into a question at the end — shows genuine interest",
      ]
    },
  ],
}

const DEFAULT_FALLBACK = [
  {
    question: "Tell me about a challenging project you worked on.",
    star: {
      situation: "Set the context: what was the project, why was it important, and what made it challenging?",
      task: "Be crystal clear about YOUR specific role and ownership. What were you personally responsible for?",
      action: "Walk through the key steps you took, the obstacles you faced, the decisions you made, and why. Be specific.",
      result: "Quantify wherever possible. 'Reduced page load time by 60%', 'shipped 2 weeks ahead of schedule'."
    },
    example: {
      situation: "Our team's e-commerce site had a 12-second load time that was killing conversion rates.",
      task: "I was tasked with identifying and fixing the top 3 performance bottlenecks as the sole backend developer.",
      action: "I profiled the app with Chrome DevTools and found 3 issues: unoptimized images (added WebP conversion), N+1 SQL queries (rewrote with JOIN), and no caching (added Redis for product listings). Took 2 weeks working evenings.",
      result: "Load time dropped from 12s to 2.3s. Bounce rate fell 22%. The CTO used it as a case study in our next all-hands. Taught me to always measure before optimizing."
    },
    tips: [
      "Prepare 3-4 projects in full STAR format before any interview",
      "The Action section should be 50-60% of your total answer time",
      "Anticipate follow-up questions: 'What would you do differently?'",
      "Practice out loud — STAR answers that aren't practiced sound disjointed",
    ]
  },
]

function getFallback(round: string, index: number) {
  const pool = FALLBACK_BY_ROUND[round] || DEFAULT_FALLBACK
  return pool[index % pool.length]
}

export async function POST(req: NextRequest) {
  try {
    const { role, round, difficulty, askedQuestions = [] } = await req.json()
    const askedIndex = askedQuestions.length
    const askedList = askedQuestions.length > 0
      ? `Already asked — DO NOT repeat or rephrase:\n${askedQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}`
      : ''

    const systemPrompt = `You are an expert interview coach generating questions with detailed STAR-method answers AND a concrete real-world example.

Generate ONE unique interview question for:
- Role: ${role}
- Round: ${round}
- Level: ${difficulty}

${askedList}

CRITICAL: Return ONLY a valid JSON object. No markdown, no backticks, nothing else.

JSON format (exact):
{
  "question": "<the interview question>",
  "star": {
    "situation": "<2-3 sentences: HOW TO set the context — guide the candidate on what kind of situation to describe>",
    "task": "<2-3 sentences: HOW TO explain their specific responsibility — what they should focus on>",
    "action": "<4-5 sentences: HOW TO structure the action — specific steps, frameworks, or approaches to mention>",
    "result": "<2-3 sentences: HOW TO describe the outcome — how to quantify and what strong results sound like>"
  },
  "example": {
    "situation": "<1-2 sentences: a CONCRETE example situation someone in a ${role} role might have faced>",
    "task": "<1 sentence: their specific responsibility in that example>",
    "action": "<2-3 sentences: exactly what they DID — specific tools, steps, decisions — written as if the candidate is speaking>",
    "result": "<1-2 sentences: the measurable outcome with specific numbers or clear qualitative impact>"
  },
  "tips": [
    "<specific actionable tip 1 for answering this question well>",
    "<specific actionable tip 2>",
    "<specific actionable tip 3>",
    "<specific actionable tip 4>"
  ]
}`

    try {
      const response = await callHFSpace({
        messages: [{ role: 'user', content: `Generate a unique ${round} interview question with full STAR answer AND a concrete example for ${role} at ${difficulty} level.` }],
        systemPrompt,
        max_tokens: 1200,
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
          const first = raw.indexOf('{'); const last = raw.lastIndexOf('}')
          if (first !== -1 && last !== -1) parsed = JSON.parse(raw.slice(first, last + 1))
        } catch { }
      }

      if (parsed?.question && parsed?.star) {
        return NextResponse.json({
          question: parsed.question,
          star: parsed.star,
          example: parsed.example || null,
          tips: parsed.tips || [],
        })
      }

      throw new Error('Could not parse HF response')

    } catch (hfError) {
      console.error('HF Space call failed, using fallback:', hfError)
      const fb = getFallback(round, askedIndex)
      return NextResponse.json(fb)
    }

  } catch (error) {
    console.error('Mock route error:', error)
    return NextResponse.json(DEFAULT_FALLBACK[0])
  }
}