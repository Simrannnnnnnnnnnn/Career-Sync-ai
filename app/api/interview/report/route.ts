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
      const errText = await res.text()
      console.error(`HF Space report error (attempt ${attempt + 1}):`, res.status, errText)
      lastError = new Error(`HF Space returned ${res.status}`)
    } catch (err: any) {
      console.error(`HF Space report fetch failed (attempt ${attempt + 1}):`, err.message)
      lastError = err
      if (attempt < retries - 1) {
        await new Promise(r => setTimeout(r, 2000))
      }
    }
  }
  throw lastError || new Error('HF Space unreachable')
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

    const transcript = messages
      .map((m: any) => {
        const speaker = m.role === 'assistant' ? 'Interviewer' : 'Candidate'
        return `${speaker}: ${m.content}`
      })
      .join('\n\n')

    const systemPrompt = `You are an expert interview evaluator. Evaluate the interview transcript below and return a JSON performance report.

CRITICAL: Respond with ONLY a valid JSON object. No markdown, no backticks, no explanation text before or after. Just raw JSON.

JSON Schema (follow exactly):
{
  "overallScore": <integer 0-100>,
  "verdict": <"Ready" | "Needs Practice" | "Not Ready">,
  "technicalScore": <integer 0-100>,
  "communicationScore": <integer 0-100>,
  "confidenceScore": <integer 0-100>,
  "strengths": [<string>, <string>, <string>],
  "improvements": [<string>, <string>, <string>],
  "questionFeedback": [
    {
      "question": <interviewer question as string>,
      "answerSummary": <1-sentence summary of candidate answer>,
      "feedback": <specific constructive feedback for this answer>
    }
  ],
  "overallFeedback": <2-3 sentence overall assessment>
}`

    const prompt = `Interview Details:
- Role: ${role}
- Round: ${round}
- Level: ${difficulty}

Full Transcript:
${transcript}

Evaluate this interview and return the JSON report.`

    // FIX: Inject systemPrompt as first message in array
    // instead of passing as separate field — HF Space ignores separate systemPrompt field
    const response = await callHFSpace({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2000,
    })

    const data = await response.json()
    const raw = data.reply || ''

    // Robust JSON extraction — try 3 methods
    let report: any = null
    try {
      report = JSON.parse(raw.trim())
    } catch {
      try {
        const stripped = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
        report = JSON.parse(stripped)
      } catch {
        try {
          const firstBrace = raw.indexOf('{')
          const lastBrace = raw.lastIndexOf('}')
          if (firstBrace !== -1 && lastBrace !== -1) {
            const jsonBlock = raw.slice(firstBrace, lastBrace + 1)
            report = JSON.parse(jsonBlock)
          }
        } catch {
          console.error('All JSON parse attempts failed. Raw:', raw)
          return NextResponse.json(
            { error: 'Report parsing failed. The AI response was malformed.' },
            { status: 500 }
          )
        }
      }
    }

    // Validate + fill missing fields with safe defaults
    if (typeof report.overallScore !== 'number') report.overallScore = 60
    if (!report.verdict) {
      report.verdict = report.overallScore >= 70 ? 'Ready' : report.overallScore >= 45 ? 'Needs Practice' : 'Not Ready'
    }
    if (typeof report.technicalScore !== 'number') report.technicalScore = 60
    if (typeof report.communicationScore !== 'number') report.communicationScore = 60
    if (typeof report.confidenceScore !== 'number') report.confidenceScore = 60
    if (!Array.isArray(report.strengths)) report.strengths = ['Participated in the interview']
    if (!Array.isArray(report.improvements)) report.improvements = ['Continue practicing']
    if (!Array.isArray(report.questionFeedback)) report.questionFeedback = []
    if (!report.overallFeedback) report.overallFeedback = 'Interview completed. Keep practicing to improve your performance.'

    return NextResponse.json({ report })

  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report. Please try again.' },
      { status: 500 }
    )
  }
}