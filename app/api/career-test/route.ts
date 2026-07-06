import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const {
    layer1Answers,
    layer2Answers,
    layer1Questions,
    layer2Questions,
    topProfiles,
    academicBackground,
    discoveryAnswers,
  } = await req.json();

  const combined = [
    academicBackground ? `Academic background: Education Level - ${academicBackground.educationLevel || 'Not provided'}; Marks/Grades - ${academicBackground.marks || 'Not provided'}; Notes - ${academicBackground.notes || 'Not provided'}` : '',
    discoveryAnswers?.length ? `Discovery answers:\n${discoveryAnswers.map((a: string, i: number) => `${i + 1}. ${a}`).join('\n')}` : '',
    layer1Questions?.length ? `Layer 1 questions and answers:\n${layer1Questions.map((q: string, i: number) => `Q: ${q}\nA: ${layer1Answers?.[i] || 'Not answered'}`).join('\n\n')}` : '',
    layer2Questions?.length ? `Ikigai questions and answers:\n${layer2Questions.map((q: string, i: number) => `Q: ${q}\nA: ${layer2Answers?.[i] || 'Not answered'}`).join('\n\n')}` : '',
  ].filter(Boolean).join('\n\n');

  const prompt = `
You are an experienced career counselor helping a student who is confused about their future. Use the academic background, discovery answers, and personality-style responses to provide realistic and practical guidance.
Return ONLY a JSON object, no extra text.

Student Profile:
${combined}

Return this exact JSON:
{
  "ikigaiSummary": "A short and encouraging summary of the student's core career personality and motivation",
  "profileBreakdown": {
    "passion": "One line about their motivation and interests",
    "proficiency": "One line about their strengths and skill fit",
    "pay": "One line about their financial priorities",
    "priorities": "One line about what matters most in a career"
  },
  "advice": "A clear, practical career guidance paragraph that tells the student what to do next and how to think about their career choice",
  "careers": [
    {
      "title": "Career Path Name",
      "match": <number 60-99>,
      "reason": "2-3 lines explaining why this suits them based on their answers",
      "ikigaiFit": "A short sentence connecting this career to their personal purpose and strengths",
      "strengths": ["Skill or trait 1", "Skill or trait 2", "Skill or trait 3"],
      "skillsToBuild": ["Skill to learn 1", "Skill to learn 2", "Skill to learn 3"],
      "nextSteps": ["First practical action", "Second practical action", "Third practical action"],
      "bestFor": "Who this path is best suited for",
      "watchOut": "One realistic challenge or caution"
    },
    {
      "title": "Career Path Name",
      "match": <number 50-90>,
      "reason": "2-3 lines explaining why",
      "ikigaiFit": "A short sentence connecting this career to their personal purpose and strengths",
      "strengths": ["Skill or trait 1", "Skill or trait 2", "Skill or trait 3"],
      "skillsToBuild": ["Skill to learn 1", "Skill to learn 2", "Skill to learn 3"],
      "nextSteps": ["First practical action", "Second practical action", "Third practical action"],
      "bestFor": "Who this path is best suited for",
      "watchOut": "One realistic challenge or caution"
    },
    {
      "title": "Career Path Name",
      "match": <number 40-80>,
      "reason": "2-3 lines explaining why",
      "ikigaiFit": "A short sentence connecting this career to their personal purpose and strengths",
      "strengths": ["Skill or trait 1", "Skill or trait 2", "Skill or trait 3"],
      "skillsToBuild": ["Skill to learn 1", "Skill to learn 2", "Skill to learn 3"],
      "nextSteps": ["First practical action", "Second practical action", "Third practical action"],
      "bestFor": "Who this path is best suited for",
      "watchOut": "One realistic challenge or caution"
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