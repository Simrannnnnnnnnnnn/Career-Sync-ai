import { NextRequest, NextResponse } from 'next/server'
import { generateReport } from '@/lib/ai'

function extractGithubUsername(url: string): string | null {
  try {
    const u = new URL(url)
    const parts = u.pathname.split('/').filter(Boolean)
    return parts[0] || null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const { githubUrl } = await req.json()
  if (!githubUrl) return NextResponse.json({ error: 'GitHub URL required' }, { status: 400 })

  const username = extractGithubUsername(githubUrl)
  if (!username) return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 })

  try {
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, {
        headers: { Accept: 'application/vnd.github+json' },
      }),
      fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=15`, {
        headers: { Accept: 'application/vnd.github+json' },
      }),
    ])

    if (!userRes.ok) {
      return NextResponse.json({ error: 'GitHub user not found — check the URL' }, { status: 404 })
    }

    const user = await userRes.json()
    const repos = reposRes.ok ? await reposRes.json() : []

    const repoSummary = repos.slice(0, 15).map((r: any) => ({
      name: r.name,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      forks: r.forks_count,
      updatedAt: r.updated_at,
      isFork: r.fork,
    }))

    const languages = Array.from(
      new Set(repos.map((r: any) => r.language).filter(Boolean))
    )

    const hasProfileReadme = repos.some((r: any) => r.name.toLowerCase() === username.toLowerCase())

    const prompt = `You are a senior tech recruiter and GitHub profile expert. Analyze this GitHub profile and respond ONLY with a valid JSON object — no markdown, no backticks, no extra text.

GitHub Profile:
- Username: ${user.login}
- Name: ${user.name || 'Not set'}
- Bio: ${user.bio || 'Not set'}
- Public Repos: ${user.public_repos}
- Followers: ${user.followers}
- Following: ${user.following}
- Company: ${user.company || 'Not set'}
- Blog/Website: ${user.blog || 'Not set'}
- Account created: ${user.created_at}
- Has a repo named exactly like username (profile README): ${hasProfileReadme}

Recent Repositories (up to 15):
${JSON.stringify(repoSummary, null, 2)}

Languages used: ${languages.join(', ') || 'None detected'}

Respond with this exact JSON format:
{
  "score": <number 0-100, overall GitHub profile strength for job hunting>,
  "verdict": <"Excellent" | "Good" | "Average" | "Needs Work">,
  "strengths": [<3 specific things this profile does well>],
  "improvements": [<4-5 specific, actionable improvements — e.g. missing READMEs, no profile README, inactive repos, weak bio, low language diversity, too many forks and not enough original work>],
  "quickWins": [<3 things fixable in under 30 minutes>],
  "profileSummary": {
    "totalRepos": ${user.public_repos},
    "activeLanguages": ${JSON.stringify(languages)},
    "hasProfileReadme": ${hasProfileReadme},
    "recentActivity": <"Active" | "Moderate" | "Inactive" based on the updatedAt dates of repos>
  }
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
    console.error('GitHub analysis error:', err)
    return NextResponse.json({ error: 'Analysis failed, please try again' }, { status: 500 })
  }
}