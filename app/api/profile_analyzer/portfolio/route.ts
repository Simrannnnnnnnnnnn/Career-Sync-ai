import { NextRequest, NextResponse } from 'next/server'
import { generateReport } from '@/lib/ai'

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractMeta(html: string, name: string): string | null {
  const regex = new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i')
  const match = html.match(regex)
  return match ? match[1] : null
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return match ? match[1].trim() : null
}

export async function POST(req: NextRequest) {
  const { portfolioUrl } = await req.json()
  if (!portfolioUrl) return NextResponse.json({ error: 'Portfolio URL required' }, { status: 400 })

  try {
    const res = await fetch(portfolioUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CareerSyncBot/1.0)' },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Could not reach this website — check the URL' }, { status: 400 })
    }

    const html = await res.text()
    const title = extractTitle(html)
    const description = extractMeta(html, 'description')
    const textContent = stripHtml(html).slice(0, 6000) // cap for token limits

    // Warn if this looks like a mostly-empty client-rendered shell
    const looksLikeEmptyShell = textContent.length < 200

    const prompt = `You are a portfolio website reviewer helping a job seeker make their personal site more recruiter-friendly. Respond ONLY with a valid JSON object — no markdown, no backticks, no extra text.

Page Title: ${title || 'Not found'}
Meta Description: ${description || 'Not found'}
${looksLikeEmptyShell ? 'NOTE: Very little text content was extracted from this page — it may be a JavaScript-rendered site where content loads client-side. Mention this limitation in your improvements if relevant.' : ''}

Extracted Page Text (may be incomplete for JS-heavy sites):
${textContent}

Respond with this exact JSON format:
{
  "score": <number 0-100, how effective this portfolio is for landing interviews — if content extraction was poor due to JS rendering, score based only on title/meta and note the limitation instead of penalizing heavily>,
  "verdict": <"Excellent" | "Good" | "Average" | "Needs Work">,
  "detected": {
    "hasAboutSection": <true/false, based on text content>,
    "hasProjects": <true/false>,
    "hasContactInfo": <true/false, look for email/contact form mentions>,
    "hasResumeLink": <true/false>,
    "hasSkillsList": <true/false>
  },
  "strengths": [<2-3 specific things done well>],
  "improvements": [<4-5 specific, actionable improvements — e.g. missing project details, weak SEO title/description, no clear CTA, no case studies>],
  "quickWins": [<3 things fixable in under an hour>]
}`

    const raw = await generateReport({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 1500,
      temperature: 0.3,
    })

    const clean = raw.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)

    return NextResponse.json({ result })
  } catch (err: any) {
    console.error('Portfolio analysis error:', err)
    return NextResponse.json({ error: 'Analysis failed — site may be blocking automated requests or too JS-heavy to read' }, { status: 500 })
  }
}