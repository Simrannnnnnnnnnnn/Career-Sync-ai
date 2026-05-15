import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  const { role, round, difficulty, messages } = await req.json()

  const systemPrompt = `You are a strict, professional ${round} interviewer at a top tech company interviewing a candidate for a ${role} position.

Difficulty level: ${difficulty}

Rules you MUST follow:
- Ask ONE question at a time. Never ask multiple questions together.
- After candidate answers, evaluate it briefly (1 line) then ask the next question.
- Generate dynamic questions — never use questions from common internet interview prep lists.
- Adjust follow-up based on the quality of the answer.
- For HR round: focus on behaviour, culture fit, situational questions.
- For Technical round: focus on ${role} specific concepts, code logic, system design.
- For Analytical round: focus on case studies, logical reasoning, problem solving.
- Keep a professional but conversational tone.
- After 8-10 questions, end the interview by saying exactly: "INTERVIEW_COMPLETE" and give a brief overall impression.
- Never break character. You are the interviewer, not an AI assistant.`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ],
    max_tokens: 300,
  })

  const reply = completion.choices[0].message.content

  return NextResponse.json({ reply })
}