import { NextRequest, NextResponse } from 'next/server'
import { generateReport } from '@/lib/ai'

function extractStackOverflowId(url: string): string | null {
  try {
    const u = new URL(url)
    const parts = u.pathname.split('/').filter(Boolean)
    const idx = parts.indexOf('users')
    if (idx !== -1 && parts[idx + 1]) return parts[idx + 1]
    return null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const { stackoverflowUrl } = await req.json()
  if (!stackoverflowUrl) return NextResponse.json({ error: 'StackOverflow URL required' }, { status: 400 })

  const userId = extractStackOverflowId(stackoverflowUrl)
  if (!userId) return NextResponse.json({ error: 'Invalid StackOverflow URL — should look like stackoverflow.com/users/12345/name' }, { status: 400 })

  try {
    const [userRes, tagsRes] = await Promise.all([
      fetch(`https://api.stackexchange.com/2.3/users/${userId}?site=stackoverflow`),
      fetch(`https://api.stackexchange.com/2.3/users/${userId}/top-answer-tags?site=stackoverflow&pagesize=10`),
    ])

    const userData = await userRes.json()
    const tagsData = tagsRes.ok ? await tagsRes.json() : { items: [] }

    if (!userData.items || userData.items.length === 0) {
      return NextResponse.json({ error: 'StackOverflow user not found — check the URL' }, { status: 404 })
    }

    const profile = userData.items[0]
    const topTags = (tagsData.items || []).map((t: any) => t.tag_name)

    const prompt = `You are a tech career coach analyzing a StackOverflow profile. Respond ONLY with a valid JSON object — no markdown, no backticks, no extra text.

StackOverflow Profile:
- Display Name: ${profile.display_name}
- Reputation: ${profile.reputation}
- Badges: Gold ${profile.badge_counts?.gold || 0}, Silver ${profile.badge_counts?.silver || 0}, Bronze ${profile.badge_counts?.bronze || 0}
- Account created: ${new Date(profile.creation_date * 1000).toISOString().slice(0, 10)}
- Last active: ${new Date(profile.last_access_date * 1000).toISOString().slice(0, 10)}
- Top answer tags: ${topTags.join(', ') || 'None'}
- About: ${profile.about_me ? profile.about_me.replace(/<[^>]+>/g, '').slice(0, 300) : 'Not set'}

Respond with this exact JSON format:
{
  "score": <number 0-100, overall profile strength for showcasing technical credibility to recruiters>,
  "verdict": <"Excellent" | "Good" | "Average" | "Needs Work">,
  "strengths": [<3 specific things this profile does well>],
  "improvements": [<4-5 specific, actionable improvements>],
  "quickWins": [<3 things fixable quickly>],
  "profileSummary": {
    "reputation": ${profile.reputation},
    "topTags": ${JSON.stringify(topTags)},
    "activityLevel": <"Active" | "Moderate" | "Inactive" based on last_access_date>
  }
}`

    const raw = await generateReport({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 1200,
      temperature: 0.3,
    })

    const clean = raw.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)

    return NextResponse.json({ result })
  } catch (err: any) {
    console.error('StackOverflow analysis error:', err)
    return NextResponse.json({ error: 'Analysis failed, please try again' }, { status: 500 })
  }
}