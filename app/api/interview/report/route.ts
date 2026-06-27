import { NextRequest, NextResponse } from 'next/server'
import { generateReport } from '@/lib/ai'

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

    const systemPrompt = `You are an expert interview evaluator. Evaluate the interview transcript and return a JSON performance report.

CRITICAL: Respond with ONLY a valid JSON object. No markdown, no backticks, no explanation. Just raw JSON.

JSON Schema:
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
      "question": <interviewer question>,
      "answerSummary": <1-sentence summary of candidate answer>,
      "feedback": <specific constructive feedback>
    }
  ],
  "overallFeedback": <2-3 sentence overall assessment>
}`

    const userPrompt = `Interview Details:
- Role: ${role}
- Round: ${round}  
- Level: ${difficulty}

Full Transcript:
${transcript}

Evaluate and return the JSON report.`

    let raw = ''
    try {
      raw = await generateReport({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        maxTokens: 2000,
        temperature: 0.3,
      })
    } catch (aiError) {
      console.error('All AI providers failed for report:', aiError)
      // Return a safe default report so user is not stuck
      return NextResponse.json({
        report: {
          overallScore: 65,
          verdict: 'Needs Practice',
          technicalScore: 65,
          communicationScore: 65,
          confidenceScore: 65,
          strengths: [
            'Completed the full interview session',
            'Attempted all questions',
            'Showed willingness to engage',
          ],
          improvements: [
            'Practice domain-specific questions more',
            'Work on structuring answers clearly',
            'Build confidence in responses',
          ],
          questionFeedback: [],
          overallFeedback: 'You completed the interview session. AI report generation encountered an issue — please retake for a detailed analysis.',
        }
      })
    }

    // Robust JSON extraction
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
            report = JSON.parse(raw.slice(firstBrace, lastBrace + 1))
          }
        } catch {
          console.error('All JSON parse attempts failed. Raw:', raw)
          return NextResponse.json(
            { error: 'Report parsing failed. Please try again.' },
            { status: 500 }
          )
        }
      }
    }

    // Safe defaults
    if (typeof report.overallScore !== 'number') report.overallScore = 60
    if (!report.verdict) {
      report.verdict = report.overallScore >= 70 ? 'Ready' : report.overallScore >= 45 ? 'Needs Practice' : 'Not Ready'
    }
    if (typeof report.technicalScore !== 'number') report.technicalScore = 60
    if (typeof report.communicationScore !== 'number') report.communicationScore = 60
    if (typeof report.confidenceScore !== 'number') report.confidenceScore = 60
    if (!Array.isArray(report.strengths)) report.strengths = ['Completed the interview session']
    if (!Array.isArray(report.improvements)) report.improvements = ['Continue practicing regularly']
    if (!Array.isArray(report.questionFeedback)) report.questionFeedback = []
    if (!report.overallFeedback) report.overallFeedback = 'Interview completed. Keep practicing to improve.'

    return NextResponse.json({ report })

  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report. Please try again.' },
      { status: 500 }
    )
  }
}