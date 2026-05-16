import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  const { resumeText, jobRole, jobDescription, mode } = await req.json()

  let prompt = ''

  if (mode === 'jd') {
    prompt = `You are an expert ATS and resume coach. Analyze this resume against the given job description.

Job Description:
${jobDescription}

Resume:
${resumeText}

Respond ONLY with a valid JSON object — no markdown, no backticks, no extra text.

JSON format:
{
  "atsScore": <number 0-100, how well resume matches JD>,
  "verdict": <"Excellent" | "Good" | "Average" | "Poor">,
  "toAdd": [<5 specific things to add/improve in resume to get hired for this role>],
  "keywords": {
    "found": [<keywords from JD found in resume>],
    "missing": [<important keywords from JD missing in resume>]
  },
  "strengths": [<3 specific strengths matching this JD>],
  "improvements": [<3 specific improvements for this JD>]
}`
  } else {
    prompt = `You are an expert ATS and resume reviewer.

Analyze this resume for a ${jobRole} position and respond ONLY with a valid JSON object — no markdown, no backticks, no extra text.

Resume:
${resumeText}

JSON format:
{
  "atsScore": <number 0-100>,
  "verdict": <"Excellent" | "Good" | "Average" | "Poor">,
  "sections": {
    "contactInfo": <number 0-100>,
    "experience": <number 0-100>,
    "skills": <number 0-100>,
    "education": <number 0-100>,
    "formatting": <number 0-100>
  },
  "keywords": {
    "found": [<relevant keywords found in resume>],
    "missing": [<important keywords missing for ${jobRole}>]
  },
  "strengths": [<3 specific strengths>],
  "improvements": [<3 specific improvements>],
  "recommendedRoles": [<3 job roles this resume is good for>]
}`
  }

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1500,
  })

  const raw = completion.choices[0].message.content || ''

  let result
  try {
    const clean = raw.replace(/```json|```/g, '').trim()
    result = JSON.parse(clean)
  } catch {
    return NextResponse.json({ error: 'Parse error' }, { status: 500 })
  }

  return NextResponse.json({ result })
}