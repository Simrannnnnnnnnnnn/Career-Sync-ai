import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { role, round, difficulty, messages } = await req.json()

  const conversation = messages
    .map((m: any) => `${m.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
    .join('\n')

  const prompt = `You are evaluating a mock ${round} interview for a ${role} position at ${difficulty} difficulty.

Here is the full interview transcript:
${conversation}

Generate a detailed performance report. Respond ONLY with a valid JSON object — no extra text, no markdown, no backticks.

JSON format:
{
  "overallScore": <number 0-100>,
  "verdict": <"Ready" | "Needs Practice" | "Not Ready">,
  "technicalScore": <number 0-100>,
  "communicationScore": <number 0-100>,
  "confidenceScore": <number 0-100>,
  "strengths": [<3 specific strengths as strings>],
  "improvements": [<3 specific improvement areas as strings>],
  "questionFeedback": [
    {
      "question": <interviewer question>,
      "answer": <candidate answer summary>,
      "feedback": <specific feedback for this answer>
    }
  ]
}`

  try {
    const response = await fetch(
      'https://simrankaurrrrr-careersync-ai.hf.space/chat',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          systemPrompt: 'You are an expert interview evaluator. Always respond with valid JSON only.'
        })
      }
    )

    if (!response.ok) {
      throw new Error(`HF Space error: ${response.status}`)
    }

    const data = await response.json()
    const raw = data.reply || ''

    let report
    try {
      const clean = raw.replace(/```json|```/g, '').trim()
      report = JSON.parse(clean)
    } catch {
      return NextResponse.json({ error: 'Report parse error' }, { status: 500 })
    }

    return NextResponse.json({ report })

  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}