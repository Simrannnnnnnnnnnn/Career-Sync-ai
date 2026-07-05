import { NextRequest, NextResponse } from 'next/server'
import { generateReport } from '@/lib/ai'

export async function POST(req: NextRequest) {
  const { headline, about, jobRole } = await req.json()
  if (!headline && !about) {
    return NextResponse.json({ error: 'Paste your LinkedIn headline or about section' }, { status: 400 })
  }

  try {
    const prompt = `You are a LinkedIn profile optimization expert who helps job seekers get noticed by recruiters. Respond ONLY with a valid JSON object — no markdown, no backticks, no extra text.

Target Role: ${jobRole || 'Not specified'}

Current LinkedIn Headline:
${headline || 'Not provided'}

Current LinkedIn About Section:
${about || 'Not provided'}

Respond with this exact JSON format:
{
  "score": <number 0-100, how effective this profile text is for recruiter search and first impression>,
  "verdict": <"Excellent" | "Good" | "Average" | "Needs Work">,
  "strengths": [<2-3 specific things done well>],
  "improvements": [<4-5 specific, actionable improvements — keyword gaps, weak opening line, no quantified achievements, missing call to action>],
  "improvedHeadline": <a rewritten, keyword-optimized headline under 220 characters>,
  "improvedAbout": <a rewritten About section, 3-4 short paragraphs, first person, keyword-rich for the target role>
}`

    const raw = await generateReport({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 1800,
      temperature: 0.4,
    })

    const clean = raw.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)

    return NextResponse.json({ result })
  } catch (err: any) {
    console.error('LinkedIn analysis error:', err)
    return NextResponse.json({ error: 'Analysis failed, please try again' }, { status: 500 })
  }
}