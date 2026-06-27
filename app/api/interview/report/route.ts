import { NextRequest, NextResponse } from 'next/server'

// Self-contained — no lib/ai.ts dependency
// Chain: Gemini Flash → Cerebras → Groq → Default report

async function tryGemini(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('No Gemini key')
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2000 },
      }),
      signal: AbortSignal.timeout(25000),
    }
  )
  if (!res.ok) throw new Error(`Gemini ${res.status}`)
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  if (!text) throw new Error('Gemini empty response')
  return text
}

async function tryGroq(prompt: string): Promise<string> {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('No Groq key')
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}`)
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error('Groq empty response')
  return text
}

async function tryCerebras(prompt: string): Promise<string> {
  const key = process.env.CEREBRAS_API_KEY
  if (!key) throw new Error('No Cerebras key')
  const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new Error(`Cerebras ${res.status}`)
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error('Cerebras empty response')
  return text
}

function parseReport(raw: string): any {
  const attempts = [
    () => JSON.parse(raw.trim()),
    () => JSON.parse(raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()),
    () => {
      const f = raw.indexOf('{'), l = raw.lastIndexOf('}')
      if (f === -1 || l === -1) throw new Error('No JSON found')
      return JSON.parse(raw.slice(f, l + 1))
    },
  ]
  for (const attempt of attempts) {
    try { return attempt() } catch { }
  }
  throw new Error('JSON parse failed')
}

function defaultReport(isTechnical: boolean) {
  return {
    overallScore: 65,
    verdict: 'Needs Practice',
    technicalScore: 65,
    communicationScore: 65,
    confidenceScore: 65,
    ...(isTechnical ? { codeScore: 65 } : {}),
    strengths: [
      'Completed the full interview session',
      'Attempted all questions',
      'Showed willingness to engage',
    ],
    improvements: [
      'Practice domain-specific questions',
      'Work on structuring answers clearly',
      'Build confidence in responses',
    ],
    questionFeedback: [],
    overallFeedback: 'You completed the interview session. Keep practicing regularly to improve your performance.',
  }
}

export async function POST(req: NextRequest) {
  try {
    const { role, round, difficulty, messages } = await req.json()

    if (!messages || messages.length < 2) {
      return NextResponse.json(
        { error: 'Not enough conversation to generate a report.' },
        { status: 400 }
      )
    }

    const isTechnical = round === 'technical'

    // ── Build transcript — mark coding answers clearly ────────────────────
    const transcript = messages
      .map((m: any) => {
        const speaker = m.role === 'assistant' ? 'Interviewer' : 'Candidate'
        // [CODE] prefix means candidate wrote actual code
        const content = m.content.startsWith('[CODE]\n')
          ? `[CANDIDATE SUBMITTED CODE]\n${m.content.replace('[CODE]\n', '')}`
          : m.content
        return `${speaker}: ${content}`
      })
      .join('\n\n')

    const prompt = `You are an expert interview evaluator. Return ONLY raw JSON, no markdown, no backticks.

JSON Schema:
{
  "overallScore": <0-100>,
  "verdict": "Ready" or "Needs Practice" or "Not Ready",
  "technicalScore": <0-100>,
  "communicationScore": <0-100>,
  "confidenceScore": <0-100>,
  ${isTechnical ? '"codeScore": <0-100>,' : ''}
  "strengths": ["...", "...", "..."],
  "improvements": ["...", "...", "..."],
  "questionFeedback": [{"question": "...", "answerSummary": "...", "feedback": "..."}],
  "overallFeedback": "2-3 sentences"
}

${isTechnical ? `IMPORTANT: This is a technical interview with coding questions.
- When you see [CANDIDATE SUBMITTED CODE], evaluate the actual code quality, correctness, and edge case handling.
- codeScore should reflect overall code quality across all coding questions (0-100).
- In questionFeedback for coding questions, mention specific code issues or strengths.` : ''}

Interview: Role=${role}, Round=${round}, Level=${difficulty}

Transcript:
${transcript}

Return JSON only.`

    // ── Provider chain ────────────────────────────────────────────────────
    let raw = ''
    const providers = [
      { name: 'Gemini',   fn: () => tryGemini(prompt)   },
      { name: 'Cerebras', fn: () => tryCerebras(prompt) },
      { name: 'Groq',     fn: () => tryGroq(prompt)     },
    ]

    for (const provider of providers) {
      try {
        raw = await provider.fn()
        console.log(`[Report] ${provider.name} succeeded`)
        break
      } catch (err: any) {
        console.warn(`[Report] ${provider.name} failed: ${err.message}`)
      }
    }

    if (!raw) {
      console.error('[Report] All providers failed — returning default report')
      return NextResponse.json({ report: defaultReport(isTechnical) })
    }

    // ── Parse JSON ────────────────────────────────────────────────────────
    let report: any
    try {
      report = parseReport(raw)
    } catch {
      console.error('[Report] JSON parse failed, raw:', raw.slice(0, 200))
      return NextResponse.json({ report: defaultReport(isTechnical) })
    }

    // ── Safe defaults ─────────────────────────────────────────────────────
    if (typeof report.overallScore !== 'number') report.overallScore = 65
    if (!['Ready', 'Needs Practice', 'Not Ready'].includes(report.verdict)) {
      report.verdict = report.overallScore >= 70 ? 'Ready' : report.overallScore >= 45 ? 'Needs Practice' : 'Not Ready'
    }
    if (typeof report.technicalScore !== 'number') report.technicalScore = 65
    if (typeof report.communicationScore !== 'number') report.communicationScore = 65
    if (typeof report.confidenceScore !== 'number') report.confidenceScore = 65
    if (isTechnical && typeof report.codeScore !== 'number') report.codeScore = 65
    if (!Array.isArray(report.strengths) || report.strengths.length === 0)
      report.strengths = ['Completed the interview', 'Attempted all questions', 'Showed engagement']
    if (!Array.isArray(report.improvements) || report.improvements.length === 0)
      report.improvements = ['Practice more', 'Structure answers better', 'Build confidence']
    if (!Array.isArray(report.questionFeedback)) report.questionFeedback = []
    if (!report.overallFeedback) report.overallFeedback = 'Interview completed. Keep practicing!'

    return NextResponse.json({ report })

  } catch (error: any) {
    console.error('[Report] Unexpected error:', error.message)
    return NextResponse.json({ report: defaultReport(false) })
  }
}