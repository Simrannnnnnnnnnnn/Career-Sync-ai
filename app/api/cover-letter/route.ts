import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const { jobTitle, company, jobDescription, resume, tone } = await req.json();

  const prompt = `
Write a ${tone} cover letter for a ${jobTitle} position at ${company}.

${jobDescription ? `Job Description:\n${jobDescription}\n` : ""}
${resume ? `Candidate Background:\n${resume}\n` : ""}

Instructions:
- Write a complete, ready-to-send cover letter
- 3-4 paragraphs
- Tone should be ${tone}
- Make it specific to ${company} and the ${jobTitle} role
- Do NOT include placeholder text like [Your Name] or [Date]
- Start directly with "Dear Hiring Manager,"
- End with "Sincerely," and a blank line

Return ONLY the cover letter text, nothing else.
`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
    });

    const letter = completion.choices[0].message.content || "";
    return NextResponse.json({ letter });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}