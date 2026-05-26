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
  heading: string   // e.g. "Step 1: Diagnose the Missingness Mechanism"
  content: string   // full paragraph with technical depth
  bullets?: string[] // optional sub-bullets under the step
}

interface ModelAnswer {
  situationTask: string     // combined S+T in first person, 2-3 sentences
  actionSteps: ActionStep[] // 2-4 numbered steps, each with heading + content + bullets
  result: string            // quantified outcome paragraph
  whyItWins: string[]       // 3-4 bullet points explaining why this answer impresses
}

// ─── Rich fallback pool ───────────────────────────────────────────────────────
const FALLBACK_BY_ROUND: Record<string, {
  question: string
  star: StarAnswer
  modelAnswer: ModelAnswer
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
      modelAnswer: {
        situationTask: "I'm a final-year MCA student specialising in Data Science at LPU. Over the past year I've been building and shipping real projects — the one I'm most proud of is an agentic resume parser that used Groq's Llama 3.3 and PyMuPDF to extract skills and match them against live job descriptions, cutting mock screening time by around 40%. Before that, I interned with IBM SkillsBuild where I built AI strategy dashboards and a multi-platform scam detection tool using Relay.app and Gmail workflows.",
        actionSteps: [
          {
            heading: "Present → Past → Future",
            content: "The cleanest structure for this answer is a narrative arc. Start with what you're doing now (current role/project), briefly reference what built you up to this point (1-2 past experiences with impact), then end with why you're here talking to them today. This creates a story, not a CV recitation.",
            bullets: [
              "Present: 'I'm a Data Science student currently building X'",
              "Past: 'Before that, I interned at IBM where I did Y and shipped Z'",
              "Future: 'I'm here because I want to grow in [specific area] and this role is the right environment for that'"
            ]
          },
          {
            heading: "Anchor on ONE specific achievement with a real metric",
            content: "Don't list five projects. Pick the most impressive one and mention it with a real number. 'I built a resume parser that reduced screening time by 40%' lands ten times harder than 'I've worked on several ML projects.' Specificity signals credibility — and it gives the recruiter something concrete to follow up on.",
          },
          {
            heading: "Bridge to them — don't end on yourself",
            content: "The best 'tell me about yourself' answers pivot at the end to the company. Something like: 'That's a quick overview — I'm particularly excited about this role because of X, and I'd love to understand what the team is focused on right now.' This signals you're a two-way conversation, not a performance.",
          }
        ],
        result: "A well-structured 90-second answer lands you the next round. Recruiters who hear 50 of these a day remember candidates who were specific, had a clear narrative, and showed genuine interest in the company — not just in getting any job.",
        whyItWins: [
          "It answers the actual question: 'why should we move forward with you?' — not just 'where did you go to school?'",
          "The metric ('40% reduction') gives the recruiter something concrete to remember and reference in feedback",
          "Ending with a question shows you're evaluating them too — which signals confidence, not desperation",
          "The Present → Past → Future frame is easy to follow and leaves nothing ambiguous about your current status"
        ]
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
        action: "Research the market rate on LinkedIn Salary, Glassdoor, and AmbitionBox for this exact role and city. Always give a range, not a single number.",
        result: "A confident, researched answer shows you're a professional who knows their worth — not desperate or naive."
      },
      modelAnswer: {
        situationTask: "Based on my research across Glassdoor, AmbitionBox, and LinkedIn Salary for entry-level Data Analyst and ML Engineer roles in Bangalore, the typical range sits between 6 and 10 LPA for candidates with internship experience. Given the IBM internship I completed, the end-to-end projects I've shipped, and my skills in Python, SQL, and ML — I'm targeting somewhere in the 7 to 9 LPA range. That said, I'm genuinely open to discussing the full compensation package because long-term fit and growth trajectory matter more to me than just the base number.",
        actionSteps: [
          {
            heading: "Step 1: Research before the call, not during it",
            content: "Check AmbitionBox, Glassdoor, and LinkedIn Salary for the exact role, city, and company size. Going in with real data is the difference between sounding confident and sounding like you guessed. Recruiters can tell immediately.",
            bullets: [
              "AmbitionBox: best for Indian companies, shows actual reported salaries by role and company",
              "LinkedIn Salary: useful for MNC benchmarks",
              "Glassdoor: good for startup and product company ranges"
            ]
          },
          {
            heading: "Step 2: Always give a range, never a single number",
            content: "A single number either anchors too low (you leave money on the table) or too high (you get screened out before the conversation starts). Make the lower end of your range your actual floor — the number below which you would not accept the offer.",
          },
          {
            heading: "Step 3: Flip it if asked too early",
            content: "If they ask in the first 5 minutes before you know anything about the scope, it's professional to say: 'I'd love to understand the full scope and responsibilities first — could you share the budgeted range?' Many companies will answer this. If they push, give a broad range and signal openness.",
          }
        ],
        result: "A candidate who gives a researched range with confidence, without apologising for it, signals market awareness and self-respect. Recruiters who try to lowball know immediately that you've done your homework — and that changes the dynamic in your favour.",
        whyItWins: [
          "Citing specific platforms (AmbitionBox, Glassdoor) shows you did real research — not guesswork",
          "A range instead of a number gives you negotiation room without looking demanding",
          "'Open to the full package' keeps the door open even if the base is slightly below your range",
          "Saying it confidently without apologising signals you know your worth — which is exactly the energy you want going into a negotiation"
        ]
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
        action: "Walk through the key decisions and actions you personally took. What approach did you choose and why? What was technically or organizationally hard about this?",
        result: "Quantify the impact wherever possible: 'reduced load time by 40%', 'saved 200 engineering hours per month', 'increased conversion by 12%'."
      },
      modelAnswer: {
        situationTask: "In my final year, our college's exam platform — SmartQuizzer — was genuinely falling apart under load. We had 200+ students hitting it simultaneously during exams and it kept crashing because the entire backend was running on SQLite with no proper session handling and zero concurrency management. I was the backend lead, which meant the database layer, the API, and the deployment were entirely on me to fix.",
        actionSteps: [
          {
            heading: "Step 1: Diagnose before touching anything",
            content: "Before rewriting anything, I profiled the existing system to find the actual bottlenecks. The three problems were: SQLite's file-lock blocking concurrent writes, no session caching (every request hit the DB), and no queue for simultaneous quiz submissions causing race conditions. This diagnosis step is non-negotiable — jumping straight to 'just rewrite it in Postgres' without understanding the failure modes would have solved some problems and created new ones.",
          },
          {
            heading: "Step 2: Migrate to MongoDB Atlas + Redis caching",
            content: "I moved the database from SQLite to MongoDB Atlas — the document model was a natural fit for quiz data (questions, options, responses are nested structures). I layered Redis on top for session caching, so authenticated user sessions no longer hit the database on every request. This alone eliminated about 60% of the DB load.",
            bullets: [
              "MongoDB Atlas: document model fits quiz schema, free tier for college project, easy horizontal scale",
              "Redis: in-memory session store, sub-millisecond lookups vs 80ms+ SQLite reads under load",
            ]
          },
          {
            heading: "Step 3: Build a submission queue to prevent race conditions",
            content: "The trickiest part was concurrent quiz submissions — if two students submitted at the exact same millisecond, the SQLite file lock would corrupt one response. I built a simple in-memory queue with retry logic so submissions were processed sequentially per user. Then I Dockerised the whole stack and deployed it on HuggingFace Spaces so the team could iterate without worrying about infra.",
          }
        ],
        result: "Zero crashes across the next three exam cycles. Page load time dropped from 8 seconds to under 1.5 seconds. The platform now handles 500+ concurrent users reliably. The deployment is live on HuggingFace Spaces — I can share the link if you'd like to see it.",
        whyItWins: [
          "It shows a real before/after with hard numbers (8s → 1.5s, 200+ users, zero crashes) — not vague claims",
          "The diagnosis-first approach signals engineering maturity — not just 'I rewrote it and it got better'",
          "Explaining WHY MongoDB over Postgres (document model fit) shows architectural reasoning, not just technology name-dropping",
          "Ending with 'I can share the link' is a power move — it proves the project is real and deployed, not just a notebook"
        ]
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
        action: "Walk through what you did wrong, what warning signs you missed, and what you tried to do to fix it.",
        result: "What did you CHANGE because of this failure? Show that you extracted a concrete lesson and applied it."
      },
      modelAnswer: {
        situationTask: "In my second year, I was leading a team of four building a recommendation system for our ML course project. I made a classic leadership mistake: I assumed everyone understood the timeline and their responsibilities, so I didn't set up any formal check-ins or blockers process. I thought good people would just figure it out and speak up if they were stuck.",
        actionSteps: [
          {
            heading: "What went wrong and the warning signs I missed",
            content: "Two days before the deadline, I found out two teammates had been completely blocked on an API integration for over a week. They hadn't said anything because they didn't want to seem incompetent. The warning signs were there — their commits had slowed down, they were quieter in our group chat — but I interpreted that as 'they're heads down working' rather than 'they're stuck and embarrassed to say so.'",
          },
          {
            heading: "What I tried to do (and why it wasn't enough)",
            content: "I pulled two all-nighters trying to fix the integration myself. I got it working, but by that point we had lost too much time for proper testing and documentation. We submitted late and lost 15% of our grade. More frustrating than the grade was knowing it was entirely preventable.",
          },
          {
            heading: "What I changed after this failure",
            content: "I introduced brief daily standups on every team project I've led since — nothing formal, just three questions: what did you do yesterday, what are you doing today, what's blocking you? That last question is everything. I also started explicitly creating psychological safety early: in the first meeting I say 'if you're blocked for more than an hour, that's a team problem, not a you problem — tell me immediately.' I haven't had a surprise blocker since.",
          }
        ],
        result: "Every team project I've led since has shipped on time. The lesson fundamentally changed how I think about leadership: your job isn't to trust people to speak up — it's to create an environment where speaking up about problems is the obvious and safe thing to do.",
        whyItWins: [
          "It's a real failure with a real consequence (15% grade penalty) — not a fake 'I work too hard' answer",
          "Identifying the warning signs I missed shows genuine reflection, not just rehearsed regret",
          "The behaviour change is specific ('daily standup with those exact 3 questions') — not vague ('I learned to communicate better')",
          "The closing insight about psychological safety shows the kind of leadership thinking that senior interviewers look for"
        ]
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
        action: "Walk through each component: API layer, hashing strategy, storage, caching, redirect logic, and scale considerations.",
        result: "A complete answer covers the happy path, edge cases, and discusses tradeoffs clearly."
      },
      modelAnswer: {
        situationTask: "Before I design anything, I'd clarify requirements: Do we need analytics? Custom slugs? Link expiry? What's the scale — 1M or 100M DAU? Assuming 100M DAU with analytics and custom slugs, here's how I'd approach it.",
        actionSteps: [
          {
            heading: "Step 1: Core API and hashing strategy",
            content: "Two endpoints: POST /shorten takes a long URL and returns a short code; GET /{code} does the redirect. For the short code, I'd use base62 encoding of an auto-incremented database ID — that gives 56 billion+ unique codes at just 6 characters, so collision is not a concern at any realistic scale. I'd avoid MD5/SHA hashing because of collision risk and the need to truncate.",
            bullets: [
              "Base62 = [a-z, A-Z, 0-9] = 62 characters",
              "6 characters = 62^6 = ~56 billion unique codes",
              "Auto-increment ID → base62 encode → short code (deterministic, no collision)"
            ]
          },
          {
            heading: "Step 2: Storage and caching",
            content: "Store the long↔short mapping in Postgres. For reads (redirects), put Redis in front with a 24-hour TTL — roughly 80% of redirect traffic hits the same popular URLs, so caching them eliminates most DB reads. For the redirect itself, I'd use 302 (temporary) rather than 301 (permanent) — 301 gets cached by browsers permanently and kills your analytics visibility.",
          },
          {
            heading: "Step 3: Scale and edge cases",
            content: "At 100M DAU, I'd add a CDN layer for geographic distribution and horizontal read replicas on Postgres. For edge cases: deduplicate identical long URLs (same long URL should return the same short code), handle expired links with a clear error page, and rate-limit the /shorten endpoint to prevent abuse. For analytics, fire click events to a Kafka queue asynchronously — never on the critical redirect path.",
          }
        ],
        result: "This design handles 100M DAU with sub-10ms redirect latency (Redis cache hit), supports analytics without slowing down redirects (async Kafka), and scales horizontally without schema changes. The base62 encoding means we'll never run out of short codes at any realistic scale.",
        whyItWins: [
          "Clarifying requirements first (analytics? custom slugs? scale?) signals senior engineering thinking, not jumping straight to architecture",
          "Explaining WHY base62 over MD5 (no collision, deterministic) shows you understand the tradeoffs, not just the patterns",
          "The 301 vs 302 distinction is a classic follow-up — answering it proactively shows depth",
          "Mentioning async Kafka for analytics proves you know not to put non-critical work on the critical path"
        ]
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
        action: "Structure it as: short-term mastery → medium-term growth → tie to this company specifically.",
        result: "A great answer shows ambition + humility + alignment with the company's growth trajectory."
      },
      modelAnswer: {
        situationTask: "In the next one to two years, I want to go genuinely deep on production ML — not just training models, but owning them end to end in a real product environment. That means robust feature pipelines, proper model monitoring, versioning, A/B testing infrastructure, and understanding what it takes to keep a model healthy under real traffic. Right now I've built and deployed models, but I haven't owned one in production at scale — and that's exactly what I want to fix.",
        actionSteps: [
          {
            heading: "Short term (0-2 years): Go deep on production ML",
            content: "I want to be the person on the team who fully owns an ML pipeline — from data ingestion to model serving to monitoring. I'm particularly interested in MLOps tooling (MLflow, Evidently, feature stores) and learning what production model degradation actually looks like — not from a textbook, but from being on-call when something breaks.",
          },
          {
            heading: "Medium term (3-5 years): Senior IC who bridges research and product",
            content: "In 3-5 years, I see myself as a senior ML engineer who can both architect systems and bring junior engineers up to speed. I want to be the person who can evaluate a research paper on a Monday and have a production-ready prototype by Friday — someone who bridges the gap between what's academically interesting and what's actually useful at scale.",
          },
          {
            heading: "Why this company specifically",
            content: "What draws me here is that you're building AI features that reach millions of users — that's the scale I want to develop my instincts at. There's a fundamental difference between ML that works in a notebook and ML that works under real traffic with real data drift, and I want to learn that the hard way in an environment like this one.",
          }
        ],
        result: "I'm not looking for a job — I'm looking for the right environment to grow into someone who can build and own AI systems at scale. This role is that environment, and I'm planning to be here long enough to grow into it fully. Can I ask — what does the typical growth path look like for engineers who join at this level?",
        whyItWins: [
          "The 0-2 year goal is specific and honest ('I haven't owned a model in production at scale') — not a rehearsed performance",
          "The 3-5 year vision is ambitious but grounded — 'senior IC who bridges research and product' is realistic and valuable",
          "Tying the vision to this company's specific scale shows you did your homework and you're not giving a generic answer",
          "Ending with a question ('what does the growth path look like?') turns it into a dialogue and signals genuine long-term interest"
        ]
      },
      tips: [
        "Research the company's growth trajectory — ambitious companies want ambitious people",
        "Be honest about what you haven't done yet — it's more credible than claiming to know everything",
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
    modelAnswer: {
      situationTask: "During my final year, our college e-commerce platform had a 12-second load time that was genuinely killing user engagement — students were bouncing before the page finished loading. I was the sole backend developer on the performance overhaul, so the entire diagnostic and execution was on me.",
      actionSteps: [
        {
          heading: "Step 1: Profile first, optimise second",
          content: "The biggest mistake in performance work is optimising based on assumptions. I profiled the app with Chrome DevTools and found three distinct bottlenecks — and two of them weren't what I expected. Always measure before you touch anything.",
          bullets: [
            "Images were unoptimised — added a WebP conversion pipeline (biggest win: 40% size reduction)",
            "N+1 queries throughout product listing endpoints — rewrote with JOINs",
            "Zero caching on the product catalog — added Redis with a 1-hour TTL"
          ]
        },
        {
          heading: "Step 2: Fix highest-impact issues first",
          content: "I prioritised by impact-to-effort ratio. Image optimisation took 2 hours and gave 40% of the total improvement. The N+1 query fix took a day but reduced DB load by 60%. Redis caching was the most complex but made the whole system resilient to traffic spikes.",
        }
      ],
      result: "Load time dropped from 12 seconds to 2.3 seconds. Bounce rate fell by 22%. The CTO used it as a case study in the next all-hands. The lesson I carry forward: always profile before optimising — I was wrong about two of the three bottlenecks before I measured.",
      whyItWins: [
        "The 'profile first' principle shows engineering discipline — not just 'I rewrote it and it got faster'",
        "Hard numbers (12s → 2.3s, 22% bounce rate reduction) make the impact concrete and memorable",
        "The honest admission ('two bottlenecks weren't what I expected') makes the answer credible",
        "The lesson generalises — 'always measure before optimising' is a principle, not just a project outcome"
      ]
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

    const systemPrompt = `You are a world-class interview coach. Generate ONE unique interview question with a complete model answer.

Generate for:
- Role: ${role}
- Round: ${round}
- Level: ${difficulty}

${askedList}

CRITICAL: Return ONLY a valid JSON object. No markdown, no backticks, nothing else.

The "modelAnswer" is the most important part. It must look like a COMPLETE, EXPERT answer a top candidate would actually give — with technical depth, specific numbers, named tools/methods, and clear reasoning. NOT generic advice.

JSON format (exact):
{
  "question": "<the interview question>",
  "star": {
    "situation": "<2-3 sentences: HOW TO set the context — guide the candidate>",
    "task": "<2-3 sentences: HOW TO explain their specific responsibility>",
    "action": "<4-5 sentences: HOW TO structure the action with specific frameworks>",
    "result": "<2-3 sentences: HOW TO describe the outcome with metrics>"
  },
  "modelAnswer": {
    "situationTask": "<2-3 sentences in first person setting the scene — like a real candidate speaking. Include a specific project/role context, real-sounding numbers, and the stakes.>",
    "actionSteps": [
      {
        "heading": "<Step N: Descriptive heading — e.g. 'Step 1: Diagnose before touching anything'>",
        "content": "<2-4 sentences of technical depth. Explain WHAT you did, WHY you chose this approach over alternatives, and what the tradeoff was. Name specific tools, algorithms, or frameworks.>",
        "bullets": ["<optional: 2-3 specific sub-points, tool names, or technical details>"]
      }
    ],
    "result": "<2-3 sentences. Quantified outcome (before/after numbers, percentages, time saved). End with a transferable lesson or insight.>",
    "whyItWins": [
      "<Specific reason 1 this answer impresses — reference an actual element of the answer above>",
      "<Specific reason 2>",
      "<Specific reason 3>",
      "<Specific reason 4>"
    ]
  },
  "tips": [
    "<actionable tip 1>",
    "<actionable tip 2>",
    "<actionable tip 3>",
    "<actionable tip 4>"
  ]
}

Rules for actionSteps:
- 2-4 steps minimum
- Each step must have real technical content specific to the question — not generic advice
- Include actual tool/method names (e.g. MICE, Redis, base62, MCAR/MAR, EXPLAIN ANALYZE)
- bullets are optional but use them for technical sub-details`

    try {
      const response = await callHFSpace({
        messages: [{ role: 'user', content: `Generate a unique ${round} interview question with complete model answer for ${role} at ${difficulty} level.` }],
        systemPrompt,
        max_tokens: 1800,
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
          modelAnswer: parsed.modelAnswer || null,
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