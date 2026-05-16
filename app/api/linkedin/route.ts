import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const { headline, about, skills } = await req.json();

  const prompt = `
You are a LinkedIn profile expert. Analyze this LinkedIn profile and return ONLY a JSON object, no extra text.

Profile:
Headline: ${headline || "Not provided"}
About: ${about || "Not provided"}
Skills: ${skills || "Not provided"}

Return this exact JSON structure:
{
  "score": <number 0-100>,
  "verdict": "<one line overall feedback>",
  "improvedHeadline": "<better version of their headline>",
  "improvedAbout": "<better version of their about section>",
  "missingKeywords": ["keyword1", "keyword2", "keyword3"],
  "improvements": ["tip1", "tip2", "tip3", "tip4"]
}
`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const text = completion.choices[0].message.content || "";
    
    // JSON extract karo response se
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid response");
    
    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}