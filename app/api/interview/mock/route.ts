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
  question: "How would you approach building a simple chatbot using a machine learning model, and what considerations would you keep in mind for its deployment?",
  star: {
    situation: "I was working on an internal support tool at my internship where the support team was getting flooded with repetitive FAQs — things like 'how do I reset my password' or 'what are your pricing tiers'. We had around 3,000 historical chat logs sitting unused. The goal was to automate 60-70% of these routine queries so the human agents could focus on escalations.",
    task: "I was responsible for the full pipeline — from deciding the architecture to deploying it. No one on the team had done RAG before, so every decision was mine to own and justify.",
    action: `First, I evaluated two approaches: fine-tuning a base model vs RAG (Retrieval-Augmented Generation). I chose RAG because our knowledge base changed frequently — new pricing, updated policies — and retraining a fine-tuned model every week wasn't feasible. RAG let us update the knowledge base without touching the model.

For the data pipeline, I cleaned the 3,000 chat logs, extracted the Q&A pairs, and chunked the documentation into 500-token segments with a 10% overlap to preserve context across chunk boundaries. I used text-embedding-3-small to convert these into vectors and stored them in ChromaDB.

The runtime flow: user query → embed the query → cosine similarity search against ChromaDB → retrieve top 4 chunks → inject into system prompt with the instruction "answer only from this context, say I don't know if unsure" → stream response back via Server-Sent Events so the UI felt instant.

For session state I used Redis to store conversation history keyed by session_id. Each new message fetched the last 6 turns and prepended them to the prompt so the model understood pronouns and follow-up questions like "what's the price of that one?"

Before deploying I added NeMo Guardrails to block prompt injection attempts and off-topic questions, and set up LangSmith to log every query, retrieved chunk, and latency so I could see where the retrieval was failing.`,
    result: "The chatbot handled 68% of support queries autonomously in the first two weeks. Average first-response time dropped from 4 hours to under 3 seconds. The support team went from 200 tickets a day to under 70. The one thing I'd do differently: I underestimated chunk size tuning — our first pass at 300 tokens was cutting answers mid-sentence, and we had to re-embed everything at 500 tokens before accuracy stabilised."
  },
  modelAnswer: {
    situationTask: "At my internship, the support team was drowning in repetitive FAQs — 200+ tickets a day, mostly questions already answered in the documentation. I was given ownership of building a chatbot to automate the routine ones. I had 3,000 historical chat logs, a documentation corpus, and full freedom on architecture. The only constraint: it had to handle knowledge base updates without retraining.",
    actionSteps: [
      {
        heading: "Phase 1: Choose RAG over fine-tuning",
        content: "I evaluated fine-tuning vs RAG. Fine-tuning would've given better tone but required retraining every time pricing or policies changed — which happened weekly. RAG connected a pre-trained Llama 3 model to a live knowledge base, so updates meant re-embedding documents, not retraining. I chunked the docs into 500-token segments with 10% overlap using LangChain's RecursiveCharacterTextSplitter, embedded with text-embedding-3-small, and stored vectors in ChromaDB.",
        bullets: [
          "500-token chunks with 10% overlap — prevents answers from being cut at chunk boundaries",
          "text-embedding-3-small — fast, cheap, good enough for domain-specific FAQ retrieval",
          "ChromaDB — local vector store, easy to swap for Pinecone at scale"
        ]
      },
      {
        heading: "Phase 2: Build the retrieval + prompt pipeline",
        content: "Runtime flow: embed the user query → cosine similarity search → top 4 chunks → inject into system prompt with explicit instruction: 'Answer only from the provided context. If the answer isn't there, say I don't know.' That last part is critical — without it, the LLM hallucinates answers that sound plausible but are wrong. I used LlamaIndex for orchestration and streamed tokens back via Server-Sent Events so the UI felt instant instead of waiting for the full response.",
        bullets: [
          "Top 4 chunks — empirically better than top 3 or top 5 for this domain",
          "Explicit 'I don't know' instruction — reduced hallucination rate from ~18% to under 4%",
          "SSE streaming — perceived response time dropped from 4s to under 0.8s"
        ]
      },
      {
        heading: "Phase 3: Session state with Redis",
        content: "A chatbot that forgets context after every message is useless. I built session memory using Redis — every conversation got a unique session_id, and I stored the last 6 turns as a JSON array. On each new message, I fetched the history, prepended it to the prompt buffer, and sent the full short-term memory to the model. This handled follow-ups like 'how much is that?' or 'can I cancel it?' correctly because the model had the prior context.",
      },
      {
        heading: "Phase 4: Guardrails, monitoring, deployment",
        content: "Before going live I added NeMo Guardrails to block prompt injection and off-topic queries. I deployed the FastAPI backend on HuggingFace Spaces with Docker and set up LangSmith to log every query, the retrieved chunks, response latency, and whether the model said 'I don't know'. That last metric was my proxy for retrieval quality — if it spiked, I knew the vector DB wasn't finding the right content.",
        bullets: [
          "NeMo Guardrails — intercepts inputs before they reach the LLM",
          "LangSmith — full trace logging of retrieval + generation pipeline",
          "'I don't know' rate as a retrieval quality metric — a KPI most people miss"
        ]
      }
    ],
    result: "The chatbot handled 68% of support queries autonomously in the first two weeks. First-response time dropped from 4 hours to under 3 seconds. The support team's daily ticket volume fell from 200 to under 70. The lesson: chunk size is not a set-and-forget parameter — our first pass at 300 tokens was cutting answers mid-sentence. Re-embedding at 500 tokens with overlap was what actually made retrieval reliable.",
    whyItWins: [
      "Choosing RAG over fine-tuning and explaining WHY (frequent knowledge updates) shows architectural judgment, not just tool knowledge",
      "The '18% to 4% hallucination' stat is specific and non-obvious — it proves the candidate measured their system, not just shipped it",
      "Redis session state detail shows data engineering thinking — most candidates forget the chatbot needs memory",
      "The 'I don't know rate as a KPI' insight is exactly the kind of production thinking that separates strong candidates from textbook answers"
    ]
  },
  tips: [
    "Lead with WHY you chose your architecture — RAG vs fine-tuning tradeoff is a common follow-up question",
    "Mention chunk size and overlap — it shows you actually built a RAG pipeline, not just read about one",
    "Always include session state / memory management — interviewers expect it, most candidates forget it",
    "End with a production metric AND a mistake you corrected — it makes the story credible",
  ]
}

export async function POST(req: NextRequest) {
  try {
    const { role, round, difficulty, askedQuestions = [] } = await req.json()
    const askedIndex = askedQuestions.length

    const askedList = askedQuestions.length > 0
      ? `Already asked — DO NOT repeat or rephrase these:\n${askedQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}`
      : ''

    const systemPrompt = `You are an expert interview coach generating a complete model answer that a strong candidate would give in a real interview.

Generate for:
- Role: ${role}
- Round: ${round}
- Level: ${difficulty}

${askedList}

CRITICAL: Return ONLY valid JSON. No markdown, no backticks, nothing else.

IMPORTANT DISTINCTION — you are generating TWO things:

1. "star" — What the candidate ACTUALLY SAYS for each STAR section. This is NOT coaching advice. This IS the answer. Write it in first person as if the candidate is speaking. Include real project context, specific tools, actual numbers, and genuine narrative. Each section should sound like a confident engineer telling their story.

2. "modelAnswer" — A deeper, more structured version of the same answer broken into phases/steps with technical depth, specific tool choices with reasoning, and bullet points for key details.

Think of it like document 5 format — phases like "Phase 1: Architecture Selection", real tool names, real metrics, real tradeoffs explained.

JSON format (exact):
{
  "question": "<specific realistic interview question for ${role} at ${round} round>",

  "star": {
    "situation": "<3-5 sentences SPOKEN BY THE CANDIDATE in first person. Real project/company context, the actual problem, what was at stake, scale of the problem (users, data size, latency, cost). NOT coaching advice — this IS the answer to 'what was the situation'.>",
    "task": "<2-3 sentences in first person. The candidate's specific ownership — what was their personal responsibility, what decisions were theirs to make, what would have broken if they failed.>",
    "action": "<5-8 sentences in first person covering the full approach. Should read like the candidate narrating their phases of work: how they diagnosed, what they decided, what they built, what tools they used and WHY, what surprised them, what they had to course-correct. Name specific tools, algorithms, frameworks relevant to ${role}. This should feel like reading a confident engineer's story — detailed, specific, credible.>",
    "result": "<3-4 sentences in first person. Quantified before/after impact (latency, error rate, user count, cost, accuracy). One honest thing they would do differently. A transferable lesson they carry forward.>"
  },

  "modelAnswer": {
    "situationTask": "<2-3 sentences in first person. Punchy setup — project name or context, the core problem in one line, their ownership. Sounds like the opening of a great interview answer.>",

    "actionSteps": [
      {
        "heading": "<Phase N: Short descriptive title — e.g. 'Phase 1: Choose RAG over fine-tuning' or 'Step 1: Profile before optimising'>",
        "content": "<3-5 sentences in first person. What they did in this phase, WHY they chose this approach over the obvious alternative, what was technically hard. Name specific tools with reasons — not just 'I used Redis' but 'I used Redis because session lookups needed to be sub-millisecond and a database query would have added 80ms per turn'>",
        "bullets": ["<optional: 2-3 specific technical details, numbers, or tool comparisons that add credibility>"]
      }
    ],

    "result": "<2-3 sentences in first person. Hard before/after numbers. One thing they'd do differently. Transferable principle they now apply everywhere.>",

    "whyItWins": [
      "<Specific reason referencing an actual element of the answer above — not generic advice. E.g. 'Choosing RAG over fine-tuning and explaining why (knowledge base changes weekly) shows architectural judgment'>",
      "<Specific reason 2>",
      "<Specific reason 3>",
      "<Specific reason 4>"
    ]
  },

  "tips": [
    "<Specific tip for THIS question type — not generic STAR advice>",
    "<Specific tip 2>",
    "<Specific tip 3>",
    "<Specific tip 4>"
  ]
}

Rules:
- Everything in star and modelAnswer is first-person spoken answer — never coaching instructions
- actionSteps must have 3-5 phases with real tool names and reasoning specific to ${role}
- Include at least one moment of course-correction or unexpected finding in the action/steps
- whyItWins must reference specific elements FROM this answer — not generic interview tips
- The whole response should feel like reading a strong candidate's actual interview answer, not a study guide`

    try {
      const response = await callHFSpace({
        messages: [{
          role: 'user',
          content: `Generate a ${round} round interview question with complete model answer for ${role} at ${difficulty} level.`
        }],
        systemPrompt,
        max_tokens: 2200,
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

      if (parsed?.question && parsed?.star?.situation && parsed?.modelAnswer?.situationTask) {
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