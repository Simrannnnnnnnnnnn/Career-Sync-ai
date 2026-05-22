import { NextRequest, NextResponse } from 'next/server'

const HF_URL = `${process.env.HF_SPACE_URL}/chat`

// ─── Retry wrapper for HF Space calls ────────────────────────────────────────
async function callHFSpace(body: object, retries = 2): Promise<Response> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(HF_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20000),
      })
      if (res.ok) return res
      if (res.status === 503 && attempt < retries - 1) {
        await new Promise(r => setTimeout(r, 3000))
        continue
      }
      const errText = await res.text()
      console.error(`HF mock error (attempt ${attempt + 1}):`, res.status, errText)
      lastError = new Error(`HF Space returned ${res.status}`)
    } catch (err: any) {
      console.error(`HF mock fetch failed (attempt ${attempt + 1}):`, err.message)
      lastError = err
      if (attempt < retries - 1) await new Promise(r => setTimeout(r, 2000))
    }
  }
  throw lastError || new Error('HF Space unreachable')
}

// ─── Rich fallback pool by round ─────────────────────────────────────────────
const FALLBACK_BY_ROUND: Record<string, { question: string; modelAnswer: string }[]> = {
  screening: [
    { question: "Tell me about yourself briefly.", modelAnswer: "Give a 2-minute structured overview: who you are, your educational background, your key skills, and what you're looking for in your next role. Keep it professional and relevant to the job." },
    { question: "What are your salary expectations?", modelAnswer: "Research the market rate for the role in your city. Give a range based on your experience. Show flexibility but know your worth." },
    { question: "Why are you looking for a new opportunity?", modelAnswer: "Be honest but positive. Focus on growth: you've learned a lot at your current role but are looking for new challenges and bigger scope." },
    { question: "What do you know about our company?", modelAnswer: "Research the company before the interview. Mention their product, recent news, culture, or mission. Show genuine interest." },
    { question: "When can you join?", modelAnswer: "Be honest about your notice period. If negotiable, say so clearly." },
    { question: "What are your top 3 strengths?", modelAnswer: "Pick strengths relevant to the role and back each with a quick example — problem-solving, collaboration, and communication are always strong choices." },
    { question: "Why should we hire you?", modelAnswer: "Connect your skills directly to the job requirements. Show you can hit the ground running from day one." },
    { question: "Are you interviewing with other companies?", modelAnswer: "Be honest but don't reveal too much. You're exploring options but genuinely excited about this role." },
    { question: "Tell me about a time you had to learn something quickly.", modelAnswer: "Use STAR: describe the situation, what you had to learn, how you approached it, and the result." },
    { question: "Do you prefer remote, hybrid, or on-site work?", modelAnswer: "Be honest and show flexibility. You're comfortable with either and have the discipline to stay productive independently." },
  ],
  initial: [
    { question: "Walk me through your resume.", modelAnswer: "Start from your most recent role, highlight key achievements at each position, and connect the dots to show growth. End with why you're excited about this opportunity." },
    { question: "Describe your most impactful project.", modelAnswer: "Use STAR: Situation, Task, Action, Result. Focus on your specific contribution and the business value delivered." },
    { question: "How do you handle competing priorities?", modelAnswer: "Assess urgency vs importance, communicate with stakeholders early, break tasks into milestones, and re-prioritize when needed." },
    { question: "Tell me about a time you failed and what you learned.", modelAnswer: "Choose a real but recoverable failure. Show self-awareness: what went wrong, your role, how you fixed it, and what you changed afterward." },
    { question: "How do you collaborate with cross-functional teams?", modelAnswer: "Talk about communication cadence, empathy for different team goals, and giving/receiving feedback constructively." },
    { question: "Describe a time you showed leadership without a title.", modelAnswer: "Think of a moment you stepped up — mentored a colleague, initiated a process improvement, or rallied a team during a crisis." },
    { question: "What's the most complex problem you've ever solved?", modelAnswer: "Walk through your problem-solving process — how you diagnosed it, who you involved, what tradeoffs you made, and the outcome." },
    { question: "How do you give and receive feedback?", modelAnswer: "Give feedback with context and examples, focus on behavior not person, and follow up. Receive feedback with curiosity and act on it quickly." },
    { question: "Where do you see yourself in 3 years?", modelAnswer: "Show ambition tied to the role — deepen expertise, move into a senior IC or lead role, and contribute to team growth by mentoring others." },
    { question: "What does your ideal work environment look like?", modelAnswer: "Be genuine — collaboration, clear goals, psychological safety to take risks, and opportunities for growth." },
  ],
  technical: [
    { question: "Explain the difference between REST and GraphQL.", modelAnswer: "REST uses fixed endpoints per resource and may over/under-fetch data. GraphQL uses a single endpoint where the client specifies exactly what data it needs. Use GraphQL for complex nested data, REST for simpler cacheable APIs." },
    { question: "How would you design a URL shortener like bit.ly?", modelAnswer: "Cover hashing long URLs to a short code (base62), storing in a key-value DB like Redis, handling collisions, redirects via 301/302, analytics, and scaling with CDN and horizontal DB sharding." },
    { question: "What is the difference between SQL and NoSQL databases?", modelAnswer: "SQL databases are relational, ACID-compliant, use structured schemas — great for complex queries. NoSQL is flexible, schema-less, horizontally scalable — great for unstructured data and high write throughput." },
    { question: "How does HTTPS work?", modelAnswer: "HTTPS uses TLS. The server presents an SSL certificate, they negotiate a symmetric key using asymmetric cryptography, and all subsequent data is encrypted with that symmetric key." },
    { question: "Explain the concept of database indexing.", modelAnswer: "An index is a B-tree data structure that allows fast lookups without scanning the entire table. It speeds up SELECT but slows INSERT/UPDATE since the index must be updated too." },
    { question: "What is a microservices architecture and when would you use it?", modelAnswer: "Microservices split an app into independently deployable services. Use it for team autonomy, independent scaling, or polyglot tech stacks. Downsides include network overhead and operational complexity." },
    { question: "How do you handle race conditions in a concurrent system?", modelAnswer: "Use locks, atomic operations, or database transactions with proper isolation levels. For distributed systems, use optimistic locking, Redis locks (SETNX), or message queues to serialize operations." },
    { question: "What is the difference between authentication and authorization?", modelAnswer: "Authentication verifies who you are. Authorization verifies what you're allowed to do. Authentication always comes first. Use middleware to handle both cleanly in your API." },
    { question: "Explain Big O notation with examples.", modelAnswer: "Big O describes how an algorithm's time or space grows with input size. O(1) constant, O(log n) binary search, O(n) linear scan, O(n²) nested loops. Always aim for the lowest feasible complexity." },
    { question: "How would you optimize a slow database query?", modelAnswer: "Start with EXPLAIN to see the query plan. Add indexes on WHERE/JOIN columns, avoid SELECT *, use pagination, cache frequent reads with Redis, and consider read replicas for heavy read workloads." },
  ],
  final: [
    { question: "What's your long-term career vision?", modelAnswer: "Be authentic and tie it to impact — grow into a principal engineer or engineering manager role where you can shape technical direction and mentor the next generation." },
    { question: "How do you contribute to company culture?", modelAnswer: "Give specific examples — organizing knowledge-sharing sessions, writing internal docs, supporting junior teammates, or advocating for psychological safety." },
    { question: "Describe your leadership philosophy.", modelAnswer: "Strong leaders serve their teams. Set clear goals, remove blockers, give ownership with accountability, provide frequent feedback, and create an environment where people feel safe to take risks." },
    { question: "How do you mentor junior team members?", modelAnswer: "Regular 1:1s, code reviews with explanations not just corrections, pairing on hard problems, sharing resources, giving stretch assignments with support, and celebrating their wins." },
    { question: "How do you balance technical debt with feature delivery?", modelAnswer: "Track debt explicitly, negotiate dedicated sprint capacity (20% rule), quantify the cost of debt in velocity impact, and get buy-in from product by framing it as a reliability investment." },
    { question: "What would you change about your current organization?", modelAnswer: "Be constructive — improve cross-team communication, create clearer ownership boundaries, and use better RFCs and decision logs. Avoid negativity." },
    { question: "How do you drive initiatives that span multiple teams?", modelAnswer: "Build consensus, understand each team's incentives, align on shared goals, define ownership clearly with RACI, create a communication rhythm, and unblock dependencies proactively." },
    { question: "How do you handle disagreements with senior leadership?", modelAnswer: "Respectfully and with data. Prepare your case, acknowledge their perspective, present your concern with evidence, and propose alternatives. If overruled, commit fully to the decision." },
    { question: "What does great engineering culture look like to you?", modelAnswer: "Psychological safety, clear technical standards, ownership at every level, fast feedback loops, investment in developer experience, and leadership that respects engineers' technical judgment." },
    { question: "How do you align your work with company strategy?", modelAnswer: "Connect regularly with leadership to understand OKRs, break company goals into team goals, prioritize work that moves key metrics, and communicate how your work ladders to the company mission." },
  ],
}

const DEFAULT_FALLBACK = [
  { question: "Tell me about a challenging project you worked on.", modelAnswer: "Use the STAR method: Situation (context and challenge), Task (your specific responsibility), Action (steps you took and why), Result (measurable outcome). Be specific with numbers and your personal contribution." },
  { question: "How do you approach learning a new technology?", modelAnswer: "Start with official docs and a small hands-on project. Break the technology into core concepts, practice deliberately, and build something real. Share your learnings with the team to reinforce understanding." },
  { question: "Describe a time you had to meet a very tight deadline.", modelAnswer: "Walk through your prioritization process, how you communicated constraints to stakeholders, what you cut vs kept, how you executed under pressure, and what you'd do differently next time." },
]

function getFallback(round: string, index: number) {
  const pool = FALLBACK_BY_ROUND[round] || DEFAULT_FALLBACK
  return pool[index % pool.length]
}

// ─── Main route ───────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { role, round, difficulty, askedQuestions = [] } = await req.json()

    const askedIndex = askedQuestions.length
    const askedList = askedQuestions.length > 0
      ? `Already asked — DO NOT repeat or rephrase any of these:\n${askedQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}`
      : ''

    const systemPrompt = `You are an expert interview question generator.
Generate ONE unique interview question for:
- Role: ${role}
- Round: ${round}  
- Level: ${difficulty}

STRICT RULES:
- Return ONLY a valid JSON object. No markdown, no backticks, nothing else before or after.
- Question must be completely different from all previously asked questions.
- modelAnswer must be 3-5 sentences, practical, and specific.
- Questions should reflect what top companies actually ask in ${round} rounds.

${askedList}

Return this exact JSON format:
{
  "question": "<the interview question here>",
  "modelAnswer": "<thorough model answer in 3-5 sentences>"
}`

    try {
      const response = await callHFSpace({
        messages: [{ role: 'user', content: `Generate a unique ${round} interview question for a ${role} candidate at ${difficulty} level.` }],
        systemPrompt,
        max_tokens: 500,
      })

      const data = await response.json()
      const raw = (data.reply || '').trim()

      // ── Robust 3-layer JSON extraction ──
      let parsed: { question: string; modelAnswer: string } | null = null

      // Layer 1: direct parse
      try { parsed = JSON.parse(raw) } catch { }

      // Layer 2: strip markdown fences
      if (!parsed) {
        try {
          const stripped = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
          parsed = JSON.parse(stripped)
        } catch { }
      }

      // Layer 3: extract between first { and last }
      if (!parsed) {
        try {
          const first = raw.indexOf('{')
          const last = raw.lastIndexOf('}')
          if (first !== -1 && last !== -1) {
            parsed = JSON.parse(raw.slice(first, last + 1))
          }
        } catch { }
      }

      // Valid parsed response
      if (parsed?.question && parsed?.modelAnswer) {
        return NextResponse.json({
          question: parsed.question,
          modelAnswer: parsed.modelAnswer,
        })
      }

      // HF replied but JSON parse failed — use raw as question with fallback answer
      if (raw && raw.length > 10 && !raw.includes('<html')) {
        const fb = getFallback(round, askedIndex)
        return NextResponse.json({
          question: raw,
          modelAnswer: fb.modelAnswer,
        })
      }

      throw new Error('Could not parse HF response')

    } catch (hfError) {
      console.error('HF Space call failed, using fallback:', hfError)
      const fb = getFallback(round, askedIndex)
      return NextResponse.json({
        question: fb.question,
        modelAnswer: fb.modelAnswer,
      })
    }

  } catch (error) {
    console.error('Mock route error:', error)
    return NextResponse.json({
      question: DEFAULT_FALLBACK[0].question,
      modelAnswer: DEFAULT_FALLBACK[0].modelAnswer,
    })
  }
}