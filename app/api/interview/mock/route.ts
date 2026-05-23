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
        situation: "The recruiter is trying to quickly qualify whether your expectations align with the budget before investing more time. This is a power question — handle it carefully.",
        task: "Give a range that's well-researched, shows you know your market value, and leaves room for negotiation without underselling yourself.",
        action: "Research the market rate on LinkedIn Salary, Glassdoor, and AmbitionBox for this exact role and city. Then say: 'Based on my research and X years of experience, I'm targeting Y–Z LPA, but I'm open to the full compensation package.' Always give a range, not a number.",
        result: "A confident, researched answer shows you're a professional who knows their worth — not desperate or naive. It also keeps the door open for negotiation."
      },
      tips: [
        "Never give a single number — always a range (the lower end should be your floor)",
        "If pressured to go first, research the market first — never guess",
        "Include 'open to full package' to leave room for bonuses, ESOPs, etc.",
        "Never apologize for your number — say it confidently",
      ]
    },
    {
      question: "Why are you looking for a new opportunity?",
      star: {
        situation: "Recruiters ask this to check for red flags — are you running away from something bad, or running toward something better? They want to hire motivated people, not desperate ones.",
        task: "Frame your answer positively around growth, not frustration. Even if your current job is terrible, never say that.",
        action: "Use this structure: (1) Acknowledge what you've learned or achieved in your current role, (2) Explain what you're looking for that you can't get there (growth, scope, domain), (3) Connect it to why THIS role specifically is the right next step.",
        result: "The interviewer should feel you're moving TOWARD this role with purpose — not fleeing your current one. End with enthusiasm about what excites you about their company."
      },
      tips: [
        "Never say anything negative about your current employer — ever",
        "'I want more money' is honest but incomplete — tie it to growth too",
        "Research the company so your 'why this company' sounds genuine, not generic",
        "Practice this answer — it's asked in almost every first interview",
      ]
    },
  ],
  initial: [
    {
      question: "Describe your most impactful project.",
      star: {
        situation: "Set the context clearly: what was the business problem, what was at stake, and what was the state of things before you got involved? Give enough context that the interviewer understands WHY this project mattered.",
        task: "Be explicit about YOUR role — not the team's role. What were YOU specifically responsible for? What decisions did you own? Interviewers want to assess YOUR contribution, not your team's.",
        action: "Walk through the key decisions and actions you personally took. What approach did you choose and why? What alternatives did you consider and reject? What was technically or organizationally hard about this? This is the longest part — be specific and show your thinking.",
        result: "Quantify the impact wherever possible: 'reduced load time by 40%', 'saved 200 engineering hours per month', 'increased conversion by 12%'. If you don't have numbers, describe the qualitative impact clearly."
      },
      tips: [
        "Prepare 2-3 projects in full STAR detail before the interview",
        "Pick a project where YOUR decision made a real difference",
        "Numbers are gold — spend time before the interview gathering metrics",
        "If the project failed, you can still use it — show what you learned",
        "Keep Situation + Task under 90 seconds — spend most time on Action and Result",
      ]
    },
    {
      question: "Tell me about a time you failed and what you learned.",
      star: {
        situation: "Choose a real failure — not a fake one ('my biggest weakness is I work too hard'). Interviewers can tell. Pick something meaningful enough to show self-awareness, but not so catastrophic it raises red flags.",
        task: "Show you owned the failure — not that you blame others or circumstances. You were responsible, and you acknowledge it clearly.",
        action: "Walk through what you did wrong, what warning signs you missed, and what you tried to do to fix it once you realized the problem. Be specific — generic failures don't land well.",
        result: "This is the most important part: what did you CHANGE because of this failure? Show that you extracted a concrete lesson and applied it. Interviewers want to see growth, not perfection."
      },
      tips: [
        "Don't pick a trivial failure — it looks like you're hiding something",
        "Don't over-explain or justify — own it clearly and move to the learning",
        "The 'what I changed' part is what differentiates great answers",
        "Avoid failures that involve interpersonal conflicts or blaming teammates",
        "End on a forward-looking note — show you're better because of it",
      ]
    },
    {
      question: "How do you handle competing priorities?",
      star: {
        situation: "Think of a specific time — ideally recent — where you had multiple urgent things demanding your attention at the same time. Set up the context: what were the competing priorities, who was involved, and what was at stake?",
        task: "Your job was to make a smart prioritization decision under pressure without dropping the ball on anything critical.",
        action: "Walk through your framework: (1) Assess urgency vs importance for each task, (2) Communicate early with all stakeholders — never go silent, (3) Break tasks into milestones and tackle the highest-leverage work first, (4) Re-evaluate daily as things shift. Be specific about what you actually did.",
        result: "What happened? Did you deliver everything? If not, what did you deprioritize and why? Show that your decisions were deliberate and communicated — not reactive."
      },
      tips: [
        "Have a real example ready — generic frameworks without examples don't land",
        "Emphasize proactive communication — stakeholders hate surprises",
        "Show you can say no (or 'not yet') professionally when needed",
        "Mention any tools you use: Notion, Jira, a simple list — shows organization",
      ]
    },
  ],
  technical: [
    {
      question: "How would you design a URL shortener like bit.ly?",
      star: {
        situation: "This is a classic system design question. The interviewer wants to see how you think through scale, tradeoffs, and architecture — not just if you know the answer.",
        task: "Design a system that can take a long URL, generate a short unique code, store the mapping, and redirect users when they visit the short URL — at potentially millions of requests per day.",
        action: "Walk through each component: (1) API layer — POST /shorten, GET /{code}. (2) Hashing — use base62 encoding of an auto-increment ID (gives you 56 billion+ combinations). (3) Storage — primary DB (Postgres/MySQL) for the mapping, Redis cache for hot URLs. (4) Redirect — 301 (permanent, cached by browser) vs 302 (temporary, better for analytics). (5) Scale — read-heavy system, so add CDN + read replicas. (6) Analytics — async event queue (Kafka) for click tracking without slowing redirects.",
        result: "A complete answer covers the happy path, handles edge cases (duplicate URLs, expired links, custom slugs), and discusses tradeoffs like consistency vs availability."
      },
      tips: [
        "Always clarify requirements first: scale? analytics needed? custom URLs?",
        "Draw the architecture — even verbally walk through the boxes and arrows",
        "Explain WHY you chose each component, not just what",
        "Discuss tradeoffs: SQL vs NoSQL, 301 vs 302, cache TTL choices",
        "Don't jump to the most complex solution first — start simple, then scale",
      ]
    },
    {
      question: "Explain the difference between REST and GraphQL.",
      star: {
        situation: "Both REST and GraphQL are API design paradigms, but they solve different problems. Interviewers ask this to test if you understand real-world API design tradeoffs — not just definitions.",
        task: "Explain the core differences clearly, and show you know WHEN to use each one in practice.",
        action: "REST: multiple endpoints (GET /users, GET /posts), fixed response shape — client gets what the server decides. Can lead to over-fetching (too much data) or under-fetching (multiple round trips). Simple, cacheable, widely understood. GraphQL: single endpoint (/graphql), client specifies exactly what fields it needs in a query. Solves over/under-fetching. Better for complex, nested data (social feeds, dashboards). Harder to cache, steeper learning curve, needs schema management.",
        result: "Use REST for simple, public APIs where cacheability matters. Use GraphQL for complex client-driven data needs like mobile apps or dashboards where bandwidth and round-trips are a concern."
      },
      tips: [
        "Don't just define them — explain the tradeoffs with real examples",
        "Mention when you'd choose one over the other — shows practical judgment",
        "Caching is REST's big advantage — GraphQL is harder to cache by default",
        "Mention tools: REST + OpenAPI/Swagger, GraphQL + Apollo/Hasura",
        "If you've used both, mention your personal experience",
      ]
    },
  ],
  final: [
    {
      question: "What's your long-term career vision?",
      star: {
        situation: "Final round interviewers — often senior leaders — want to know if you're a long-term investment. They're asking: will you grow with us, or leave in 18 months? They also want to see if you're self-aware and ambitious.",
        task: "Paint a credible, authentic picture of where you want to be in 3-5 years that logically connects to this role as a stepping stone.",
        action: "Structure it as: (1) Short term (1-2 years): what you want to master and contribute in this role, (2) Medium term (3-5 years): where you see yourself growing — deeper IC expertise, or moving toward a lead/manager role, (3) How this company specifically helps you get there. Make it feel genuine, not rehearsed.",
        result: "A great answer shows ambition + humility + alignment with the company's growth trajectory. End by asking: 'What does the growth path look like for this role here?'"
      },
      tips: [
        "Research the company's growth trajectory — ambitious companies want ambitious people",
        "Don't say 'your job' or 'in your seat' — it makes senior leaders uncomfortable",
        "It's okay to say you're deciding between IC and management paths — shows self-awareness",
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
      situation: "Set the context: what was the project, why was it important, and what made it challenging? Give enough background that the interviewer understands the stakes — but keep it under 60 seconds.",
      task: "Be crystal clear about YOUR specific role and ownership. What were you personally responsible for? What decisions did you have the authority to make?",
      action: "This is the heart of your answer. Walk through the key steps you took, the obstacles you faced, the decisions you made, and why. Be specific — avoid vague statements like 'I worked on the backend'. Say 'I redesigned the database schema to eliminate N+1 queries, which required coordinating with 3 other teams.'",
      result: "Quantify wherever possible. 'Reduced page load time by 60%', 'shipped 2 weeks ahead of schedule', 'zero production incidents in 6 months post-launch'. Numbers make your answer memorable."
    },
    tips: [
      "Prepare 3-4 projects in full STAR format before any interview",
      "The Action section should be 50-60% of your total answer time",
      "Anticipate follow-up questions: 'What would you do differently?' 'What was the hardest part?'",
      "If the project involved a team, be clear about YOUR contribution vs the team's",
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

    const systemPrompt = `You are an expert interview coach generating questions with detailed STAR-method answers.

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
    "situation": "<2-3 sentences: set the context and background for how to answer this question>",
    "task": "<2-3 sentences: what the candidate's specific responsibility or goal should be in their answer>",
    "action": "<4-6 sentences: detailed explanation of WHAT to say and HOW to structure the action part — include specific examples, frameworks, or approaches>",
    "result": "<2-3 sentences: what a strong result/conclusion sounds like, including how to quantify impact>"
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
        messages: [{ role: 'user', content: `Generate a unique ${round} interview question with full STAR answer for ${role} at ${difficulty} level.` }],
        systemPrompt,
        max_tokens: 1000,
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