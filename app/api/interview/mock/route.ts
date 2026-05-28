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

// ─── Emergency fallback — only if ALL AI providers fail ──────────────────────
const EMERGENCY_FALLBACK = {
  question: "How would you approach building a simple chatbot using a machine learning model, and what considerations would you keep in mind for its deployment?",
  questionType: 'technical',
  spokenAnswer: `In my last internship I was building an internal support chatbot to handle repetitive FAQs — the support team was getting around 200 tickets a day and most of them were questions already answered in the docs. I evaluated fine-tuning vs RAG and went with RAG because our knowledge base changed every week with new pricing and policies, and retraining a fine-tuned model that frequently wasn't feasible. I chunked the documentation into 500-token segments with 10% overlap, embedded everything using text-embedding-3-small, and stored the vectors in ChromaDB. At runtime I'd embed the user query, do a cosine similarity search, pull the top 4 chunks, and inject them into the system prompt with an explicit instruction — "answer only from this context, say I don't know if the answer isn't here." That last part cut our hallucination rate from around 18% down to under 4%. I also added Redis-based session memory so the model could handle follow-up questions like "what's the price of that one?" without losing context. We streamed responses via SSE so the UI felt instant. In the first two weeks it handled 68% of queries autonomously and first-response time dropped from 4 hours to under 3 seconds. The one thing I'd do differently — I started with 300-token chunks and had to re-embed everything at 500 when I realised answers were getting cut mid-sentence. Chunk size tuning should be the first thing you validate, not the last.`,
  tips: [
    "Lead with WHY you chose your architecture — RAG vs fine-tuning is almost always a follow-up question",
    "Mention chunk size and overlap — it immediately signals you've actually built a RAG pipeline, not just read about one",
    "Include session memory / conversation state — most candidates forget it, interviewers notice",
    "End with a real metric AND a specific mistake you corrected — it makes the whole answer credible",
  ],
}

export async function POST(req: NextRequest) {
  try {
    const { role, round, difficulty, askedQuestions = [] } = await req.json()
    const askedIndex = askedQuestions.length

    const askedList = askedQuestions.length > 0
      ? `Already asked — DO NOT repeat or rephrase these:\n${askedQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}`
      : ''

    const systemPrompt = `You are an expert interview coach. Generate a realistic interview question and a model answer that sounds exactly like a strong, experienced candidate speaking naturally in a real interview.

Generate for:
- Role: ${role}
- Round: ${round}
- Level: ${difficulty}

${askedList}

CRITICAL: Return ONLY valid JSON. No markdown, no backticks, nothing else.

The "spokenAnswer" is the most important field. It must read like a real person talking — not a structured breakdown, not bullet points, not STAR labels. Just a confident engineer narrating their experience with:
- A real project or work context that sets the scene
- Specific tools, libraries, or methods they used AND why they chose them over alternatives
- Actual numbers: before/after metrics, data sizes, latency improvements, accuracy gains, error rates
- At least one moment where something went wrong or they had to course-correct
- A takeaway or lesson they now apply everywhere

Think of it like the best answer you've ever heard in an interview — the kind where the interviewer is nodding and taking notes.

Example of the STYLE and QUALITY expected (for a different question, for reference only):
"In my last role I was working on a fraud detection pipeline with about 2 million transactions — our XGBoost model was hitting 99% training accuracy but only 81% on validation. I plotted the training vs validation loss curves and the gap was obvious overfitting. I added L2 regularisation first, which helped a little, then switched to stratified 5-fold cross-validation because the fraud class was only about 1.2% of the data and a random split was giving us folds with almost no positive examples. That brought validation accuracy up to 91% and it held on the holdout set. One thing I'd change — I should have baselined with a simple logistic regression before jumping to XGBoost. It would have caught the overfitting signal earlier and given me a proper floor to beat."

JSON format (exact):
{
  "question": "<specific, realistic interview question for ${role} at ${round} level — make it something that actually gets asked, not a textbook question>",

  "questionType": "<'behavioral' if the question asks about past experience, handling situations, teamwork, leadership, conflict, failure, success — e.g. 'Tell me about a time...'; OR 'technical' if it asks how to build, design, explain, implement, or solve — e.g. 'How would you...', 'Explain...', 'Design...'>",

  "spokenAnswer": "<5-8 sentences in first person, written exactly as a strong candidate would say it out loud. One flowing paragraph — no bullet points, no section labels, no STAR headings. Real project context, specific tool choices with reasoning, actual before/after numbers, one honest mistake or course-correction, and a takeaway. The tone should be confident, clear, and natural — like someone who has actually done this work and is proud of how they handled it. Match the tools and domain to ${role} specifically.>",

  "tips": [
    "<Specific tip for THIS question — not generic advice. Something the interviewer is actually listening for, or a common mistake candidates make on this exact type of question.>",
    "<Specific tip 2>",
    "<Specific tip 3>",
    "<Specific tip 4>"
  ]
}

Rules:
- questionType MUST be exactly "behavioral" or "technical" — nothing else
- spokenAnswer MUST be one paragraph, first person, no bullet points, no labels
- spokenAnswer MUST include at least one specific tool name with a reason for choosing it
- spokenAnswer MUST include at least one real number or metric
- spokenAnswer MUST include one mistake, unexpected finding, or course-correction
- tips must be specific to THIS question — not generic STAR or interview tips
- The entire response must be valid JSON and nothing else`

    try {
      const response = await callHFSpace({
        messages: [{
          role: 'user',
          content: `Generate a ${round} round interview question with a spoken model answer for ${role} at ${difficulty} level.`
        }],
        systemPrompt,
        max_tokens: 1400,
      })

      const data = await response.json()
      const raw = (data.reply || '').trim()

      let parsed: any = null

      // Parse attempt 1 — direct
      try { parsed = JSON.parse(raw) } catch { }

      // Parse attempt 2 — strip markdown fences
      if (!parsed) {
        try {
          const stripped = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
          parsed = JSON.parse(stripped)
        } catch { }
      }

      // Parse attempt 3 — extract JSON object
      if (!parsed) {
        try {
          const first = raw.indexOf('{')
          const last  = raw.lastIndexOf('}')
          if (first !== -1 && last !== -1) parsed = JSON.parse(raw.slice(first, last + 1))
        } catch { }
      }

      if (parsed?.question && parsed?.spokenAnswer) {
        return NextResponse.json({
          question:      parsed.question,
          questionType:  parsed.questionType || 'technical',
          spokenAnswer:  parsed.spokenAnswer,
          tips:          parsed.tips || [],
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