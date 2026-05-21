import { NextRequest, NextResponse } from 'next/server'

const HF_URL = 'https://simrankaurrrrr-careersync-ai.hf.space/chat'

export async function POST(req: NextRequest) {
  try {
    const { role, round, difficulty, messages } = await req.json()

    if (!messages || messages.length < 2) {
      return NextResponse.json(
        { error: 'Not enough conversation to generate a report.' },
        { status: 400 }
      )
    }

    // ── Format transcript cleanly ──
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

    const response = await fetch(HF_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        systemPrompt,
        max_tokens: 2000, // ← Report needs much more space
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('HF Space report error:', response.status, errText)
      throw new Error(`HF Space returned ${response.status}`)
    }

    const data = await response.json()
    const raw = data.reply || ''

    // ── Robust JSON extraction ──
    // Try 1: Direct parse
    let report: any = null
    try {
      report = JSON.parse(raw.trim())
    } catch {
      // Try 2: Strip markdown fences
      try {
        const stripped = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
        report = JSON.parse(stripped)
      } catch {
        // Try 3: Extract JSON block between first { and last }
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

    // ── Validate required fields ──
    if (typeof report.overallScore !== 'number') {
      report.overallScore = 60
    }
    if (!report.verdict) {
      report.verdict = report.overallScore >= 70 ? 'Ready' : report.overallScore >= 45 ? 'Needs Practice' : 'Not Ready'
    }
    if (!Array.isArray(report.strengths)) report.strengths = []
    if (!Array.isArray(report.improvements)) report.improvements = []
    if (!Array.isArray(report.questionFeedback)) report.questionFeedback = []

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report. Please try again.' },
      { status: 500 }
    )
  }
}