import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { role, round, difficulty, messages } = await req.json()

    // 1. AI ke liye ek custom system prompt taiyar karein jo context ke hisab se agla sawal puche
    const systemPrompt = `You are an expert HR and Technical interviewer. You are conducting a mock interview for the role of a ${role} (${round} round) at a ${difficulty} level.
    
Your task:
- Analyze the conversation history provided in the messages.
- Ask the NEXT relevant, concise interview question.
- If it is the start of the interview (messages array is empty or contains only initial greeting), ask an engaging opening question related to ${role}.
- Maintain a professional, welcoming, yet challenging tone.
- Do NOT provide feedback or answers in this step. ONLY ask the next single question.`

    // 2. Hugging Face Space API ko hit karein
    const response = await fetch(
      'https://simrankaurrrrr-careersync-ai.hf.space/chat',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages || [],
          systemPrompt: systemPrompt
        })
      }
    )

    if (!response.ok) {
      throw new Error(`HF Space error: ${response.status}`)
    }

    const data = await response.json()
    const nextQuestion = data.reply || 'Could you please introduce yourself and tell me about your background?'

    // 3. Frontend ko response bhejein
    return NextResponse.json({ question: nextQuestion })

  } catch (error) {
    console.error('Interview API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch the next question. Please try again.' },
      { status: 500 }
    )
  }
}