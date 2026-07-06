'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type AnalysisState = {
  loading: boolean
  result: any
  error: string
}

const emptyState: AnalysisState = { loading: false, result: null, error: '' }

function getScoreColor(score: number) {
  if (score >= 75) return 'var(--accent)'
  if (score >= 50) return 'var(--amber)'
  return '#f43f5e'
}

function getVerdictEmoji(verdict: string) {
  if (verdict === 'Excellent') return '🌟'
  if (verdict === 'Good') return '✅'
  if (verdict === 'Average') return '⚠️'
  return '❌'
}

function ScoreCard({ state, accentColor, accentBg }: { state: AnalysisState; accentColor: string; accentBg: string }) {
  if (state.error) {
    return (
      <div className="mt-4 p-4 rounded-xl text-sm" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e' }}>
        {state.error}
      </div>
    )
  }
  if (!state.result) return null
  const r = state.result

  return (
    <div className="mt-5 space-y-4 animate-in">
      <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)' }}>
        <div className="text-4xl font-black" style={{ color: getScoreColor(r.score) }}>{r.score}</div>
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            {getVerdictEmoji(r.verdict)} {r.verdict}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>out of 100</p>
        </div>
      </div>

      {r.strengths && (
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: accentColor }}>Strengths</p>
          <ul className="space-y-1.5">
            {r.strengths.map((s: string, i: number) => (
              <li key={i} className="text-sm flex gap-2" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: accentColor }}>•</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {r.improvements && (
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#f43f5e' }}>Improvements</p>
          <ul className="space-y-1.5">
            {r.improvements.map((s: string, i: number) => (
              <li key={i} className="text-sm flex gap-2" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: '#f43f5e' }}>•</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {r.quickWins && (
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--amber)' }}>Quick Wins</p>
          <ul className="space-y-1.5">
            {r.quickWins.map((s: string, i: number) => (
              <li key={i} className="text-sm flex gap-2" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--amber)' }}>•</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {r.detected && (
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Detected Elements</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(r.detected).map(([key, val]: any) => (
              <span
                key={key}
                className="text-xs px-2.5 py-1 rounded-md font-medium"
                style={val
                  ? { background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }
                  : { background: 'rgba(244,63,94,0.08)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)' }}
              >
                {val ? '✓' : '✗'} {key.replace(/([A-Z])/g, ' $1').replace(/^has /i, '')}
              </span>
            ))}
          </div>
        </div>
      )}

      {r.improvedHeadline && (
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: accentColor }}>Suggested Headline</p>
          <div className="p-3 rounded-xl text-sm" style={{ background: accentBg, color: 'var(--text-primary)' }}>{r.improvedHeadline}</div>
        </div>
      )}

      {r.improvedAbout && (
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: accentColor }}>Suggested About Section</p>
          <div className="p-3 rounded-xl text-sm whitespace-pre-wrap" style={{ background: accentBg, color: 'var(--text-primary)' }}>{r.improvedAbout}</div>
        </div>
      )}
    </div>
  )
}

export default function ProfileOptimizerPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  const [githubUrl, setGithubUrl] = useState('')
  const [stackoverflowUrl, setStackoverflowUrl] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [linkedinHeadline, setLinkedinHeadline] = useState('')
  const [linkedinAbout, setLinkedinAbout] = useState('')
  const [targetRole, setTargetRole] = useState('')

  const [githubState, setGithubState] = useState<AnalysisState>(emptyState)
  const [soState, setSoState] = useState<AnalysisState>(emptyState)
  const [portfolioState, setPortfolioState] = useState<AnalysisState>(emptyState)
  const [linkedinState, setLinkedinState] = useState<AnalysisState>(emptyState)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      setGithubUrl(data?.github_url || '')
      setStackoverflowUrl(data?.stackoverflow_url || '')
      setPortfolioUrl(data?.portfolio_url || '')
      setTargetRole(data?.role || '')
      setLoadingProfile(false)
    }
    init()
  }, [router, supabase])

  async function analyzeGithub() {
    if (!githubUrl.trim()) return
    setGithubState({ loading: true, result: null, error: '' })
    try {
      const res = await fetch('/api/profile-analyzer/github', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setGithubState({ loading: false, result: data.result, error: '' })
    } catch (e: any) {
      setGithubState({ loading: false, result: null, error: e.message })
    }
  }

  async function analyzeStackOverflow() {
    if (!stackoverflowUrl.trim()) return
    setSoState({ loading: true, result: null, error: '' })
    try {
      const res = await fetch('/api/profile-analyzer/stackoverflow', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stackoverflowUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setSoState({ loading: false, result: data.result, error: '' })
    } catch (e: any) {
      setSoState({ loading: false, result: null, error: e.message })
    }
  }

  async function analyzePortfolio() {
    if (!portfolioUrl.trim()) return
    setPortfolioState({ loading: true, result: null, error: '' })
    try {
      const res = await fetch('/api/profile-analyzer/portfolio', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setPortfolioState({ loading: false, result: data.result, error: '' })
    } catch (e: any) {
      setPortfolioState({ loading: false, result: null, error: e.message })
    }
  }

  async function analyzeLinkedin() {
    if (!linkedinHeadline.trim() && !linkedinAbout.trim()) return
    setLinkedinState({ loading: true, result: null, error: '' })
    try {
      const res = await fetch('/api/profile-analyzer/linkedin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline: linkedinHeadline, about: linkedinAbout, jobRole: targetRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setLinkedinState({ loading: false, result: data.result, error: '' })
    } catch (e: any) {
      setLinkedinState({ loading: false, result: null, error: e.message })
    }
  }

  const inputStyle = {
    background: 'var(--bg-muted)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  }

  if (loadingProfile) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <div className="max-w-3xl mx-auto px-5 md:px-10 pt-10 md:pt-16 pb-28">

        <Link href="/profile" className="inline-flex items-center gap-2 text-sm mb-6 transition"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          ← Profile
        </Link>

        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: 'var(--text-muted)' }}>AI Powered</p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Profile Optimizer 🚀</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Connect your GitHub, LinkedIn, StackOverflow and portfolio — get specific, actionable feedback on each.
          </p>
        </div>

        {/* GitHub */}
        <div className="rounded-2xl p-5 md:p-6 mb-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">💻</span>
            <h2 className="text-base font-bold">GitHub</h2>
          </div>
          <div className="flex gap-2">
            <input
              type="text" value={githubUrl} onChange={e => setGithubUrl(e.target.value)}
              placeholder="https://github.com/yourusername"
              className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={inputStyle}
            />
            <button
              onClick={analyzeGithub} disabled={githubState.loading || !githubUrl.trim()}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 transition"
              style={{ background: 'var(--text-primary)', color: 'var(--bg-base)' }}
            >
              {githubState.loading ? '...' : 'Analyze'}
            </button>
          </div>
          <ScoreCard state={githubState} accentColor="var(--text-primary)" accentBg="var(--bg-muted)" />
        </div>

        {/* LinkedIn */}
        <div className="rounded-2xl p-5 md:p-6 mb-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🔗</span>
            <h2 className="text-base font-bold">LinkedIn</h2>
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--text-faint)' }}>
            LinkedIn doesn't allow automatic profile fetching — paste your text below instead.
          </p>
          <div className="space-y-3">
            <input
              type="text" value={linkedinHeadline} onChange={e => setLinkedinHeadline(e.target.value)}
              placeholder="Your current headline"
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={inputStyle}
            />
            <textarea
              value={linkedinAbout} onChange={e => setLinkedinAbout(e.target.value)}
              placeholder="Your current About section" rows={5}
              className="w-full rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none" style={inputStyle}
            />
            <button
              onClick={analyzeLinkedin} disabled={linkedinState.loading || (!linkedinHeadline.trim() && !linkedinAbout.trim())}
              className="w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 transition"
              style={{ background: 'var(--blue)', color: '#fff' }}
            >
              {linkedinState.loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
          <ScoreCard state={linkedinState} accentColor="var(--blue)" accentBg="var(--blue-bg)" />
        </div>

        {/* StackOverflow */}
        <div className="rounded-2xl p-5 md:p-6 mb-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📊</span>
            <h2 className="text-base font-bold">StackOverflow</h2>
          </div>
          <div className="flex gap-2">
            <input
              type="text" value={stackoverflowUrl} onChange={e => setStackoverflowUrl(e.target.value)}
              placeholder="https://stackoverflow.com/users/12345/yourname"
              className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={inputStyle}
            />
            <button
              onClick={analyzeStackOverflow} disabled={soState.loading || !stackoverflowUrl.trim()}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 transition"
              style={{ background: 'var(--amber)', color: '#000' }}
            >
              {soState.loading ? '...' : 'Analyze'}
            </button>
          </div>
          <ScoreCard state={soState} accentColor="var(--amber)" accentBg="var(--amber-bg)" />
        </div>

        {/* Portfolio */}
        <div className="rounded-2xl p-5 md:p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🌐</span>
            <h2 className="text-base font-bold">Portfolio Website</h2>
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--text-faint)' }}>
            Works best on server-rendered sites. Purely client-side (JS-only) sites may show limited results.
          </p>
          <div className="flex gap-2">
            <input
              type="text" value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)}
              placeholder="https://yourportfolio.com"
              className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={inputStyle}
            />
            <button
              onClick={analyzePortfolio} disabled={portfolioState.loading || !portfolioUrl.trim()}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 transition"
              style={{ background: 'var(--purple)', color: '#fff' }}
            >
              {portfolioState.loading ? '...' : 'Analyze'}
            </button>
          </div>
          <ScoreCard state={portfolioState} accentColor="var(--purple)" accentBg="var(--purple-bg)" />
        </div>

      </div>
    </div>
  )
}