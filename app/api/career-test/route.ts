import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const { answers, questions } = await req.json();

  const combined = questions.map((q: string, i: number) => 
    `Q: ${q}\nA: ${answers[i]}`
  ).join("\n\n");

  const prompt = `
You are a career counselor. Based on these quiz answers, suggest the top 3 career paths.
Return ONLY a JSON object, no extra text.

Quiz Answers:
${combined}

Return this exact JSON:
{
  "careers": [
    {
      "title": "Career Path Name",
      "match": <number 60-99>,
      "reason": "2-3 lines explaining why this suits them based on their answers"
    },
    {
      "title": "Career Path Name", 
      "match": <number 50-90>,
      "reason": "2-3 lines explaining why"
    },
    {
      "title": "Career Path Name",
      "match": <number 40-80>,
      "reason": "2-3 lines explaining why"
    }
  ]
}
`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const text = completion.choices[0].message.content || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid response");

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}