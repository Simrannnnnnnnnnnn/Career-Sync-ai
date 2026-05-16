import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const { career } = await req.json();

  const prompt = `
You are a career roadmap expert. Create a detailed learning roadmap for someone who wants to become a "${career}".
Return ONLY a JSON object, no extra text.

Return this exact JSON:
{
  "title": "Roadmap for ${career}",
  "totalMonths": <number>,
  "phases": [
    {
      "phase": 1,
      "title": "Phase title",
      "duration": "X months",
      "goal": "What they will achieve in this phase",
      "topics": ["topic1", "topic2", "topic3"],
      "resources": [
        { "name": "Resource name", "type": "YouTube / Course / Book / Website", "free": true }
      ]
    }
  ]
}

Make 3-4 phases. Keep it practical and beginner-friendly.
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
    return NextResponse.json({ error: "Roadmap generation failed" }, { status: 500 });
  }
}