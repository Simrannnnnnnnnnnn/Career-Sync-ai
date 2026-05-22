'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const FEATURES = [
  {
    href: '/interview/setup',
    icon: '🎤',
    title: 'AI Interview Simulator',
    desc: 'Live mock interview — camera, voice, real feedback',
    accent: '#3b82f6',
    bg: 'rgba(59,130,246,0.07)',
    badge: 'HOT',
    badgeColor: '#f97316',
    badgeBg: 'rgba(249,115,22,0.12)',
  },
  {
    href: '/resume',
    icon: '📄',
    title: 'ATS Resume Scorer',
    desc: 'Beat the ATS — get more interviews',
    accent: '#8b5cf6',
    bg: 'rgba(139,92,246,0.07)',
    badge: null,
    badgeColor: undefined,
    badgeBg: undefined,
  },
  {
    href: '/interview/mock-setup',
    icon: '🧠',
    title: 'Mock Interview Bank',
    desc: 'Practice questions with model answers — no camera',
    accent: '#6366f1',
    bg: 'rgba(99,102,241,0.07)',
    badge: 'NEW',
    badgeColor: '#818cf8',
    badgeBg: 'rgba(99,102,241,0.15)',
  },
  {
    href: '/cover',
    icon: '✍️',
    title: 'Cover Letter',
    desc: 'Tailored letters in 30 seconds',
    accent: '#f97316',
    bg: 'rgba(249,115,22,0.07)',
    badge: null,
    badgeColor: undefined,
    badgeBg: undefined,
  },
  {
    href: '/growth',
    icon: '🚀',
    title: 'Growth Hub',
    desc: 'LinkedIn • Career test • Roadmap',
    accent: '#10b981',
    bg: 'rgba(16,185,129,0.07)',
    badge: null,
    badgeColor: undefined,
    badgeBg: undefined,
  },
  {
    href: '/jobs',
    icon: '📋',
    title: 'Job Tracker',
    desc: 'Track every application & interview',
    accent: '#f59e0b',
    bg: 'rgba(245,158,11,0.07)',
    badge: null,
    badgeColor: undefined,
    badgeBg: undefined,
  },
]

const VIBE = {
  morning: {
    emoji: '🌅',
    label: 'Morning Energy',
    message: "Fresh start, fresh opportunities. You've got this today.",
    gradient: 'linear-gradient(135deg, rgba(251,146,60,0.1) 0%, rgba(239,68,68,0.07) 100%)',
    border: 'rgba(251,146,60,0.18)',
    accent: '#fb923c',
  },
  afternoon: {
    emoji: '⚡',
    label: 'Grind Mode',
    message: "Peak hours. Lock in — your future self is watching.",
    gradient: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.07) 100%)',
    border: 'rgba(59,130,246,0.18)',
    accent: '#3b82f6',
  },
  evening: {
    emoji: '🌙',
    label: 'Wind Down',
    message: "Every step today brought you closer. Rest, recharge, repeat.",
    gradient: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(16,185,129,0.07) 100%)',
    border: 'rgba(99,102,241,0.18)',
    accent: '#818cf8',
  },
}

const TIPS = [
  "Tailor your resume keywords to match the job description.",
  "Follow up 5 days after submitting an application.",
  "Research the company's latest news before every interview.",
  "Use STAR method for every behavioural question.",
  "A strong LinkedIn headline gets 3x more recruiter views.",
  "Apply in the first 24 hours — early applicants get more callbacks.",
  "Quantify your achievements: numbers stand out on resumes.",
  "Practice answering 'Tell me about yourself' in under 2 minutes.",
]

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [timeLabel, setTimeLabel] = useState('')
  const [vibe, setVibe] = useState(VIBE.morning)
  const [tip, setTip] = useState('')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
    }
    getUser()

    const h = new Date().getHours()
    if (h < 12) { setTimeLabel('Good morning'); setVibe(VIBE.morning) }
    else if (h < 17) { setTimeLabel('Good afternoon'); setVibe(VIBE.afternoon) }
    else { setTimeLabel('Good evening'); setVibe(VIBE.evening) }

    setTip(TIPS[Math.floor(Math.random() * TIPS.length)])
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const firstName = profile?.full_name?.split(' ')[0]
    || user?.user_metadata?.full_name?.split(' ')[0]
    || 'there'

  if (!user) return (
    <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 32, height: 32, border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#52525b', fontSize: 13 }}>Loading...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#f4f4f5', fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>

      {/* Ambient background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 80% 40% at 50% -10%, rgba(99,102,241,0.06) 0%, transparent 70%)',
      }} />

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 20px 100px', position: 'relative', zIndex: 1 }}>

        {/* ── Top Bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <p style={{ color: '#52525b', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>
              {timeLabel}
            </p>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
              {firstName} <span>👋</span>
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={handleLogout}
              style={{
                width: 40, height: 40, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              title="Logout"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.8">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Hero row ── */}
        <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

          {/* Welcome card */}
          <div style={{
            borderRadius: 24, padding: '28px 32px', position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(59,130,246,0.07) 60%, rgba(16,185,129,0.05) 100%)',
            border: '1px solid rgba(99,102,241,0.18)',
          }}>
            <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 160, height: 160, borderRadius: '50%', background: '#6366f1', filter: 'blur(60px)', opacity: 0.08, pointerEvents: 'none' }} />
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6366f1', marginBottom: 10 }}>
              Your Space
            </p>
            <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.04em', margin: '0 0 8px', lineHeight: 1 }}>
              CareerSync
            </h2>
            <p style={{ color: '#71717a', fontSize: 14, lineHeight: 1.6, margin: '0 0 16px' }}>
              Everything you need to land your dream job — in one place.
            </p>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
              <p style={{ color: '#3f3f46', fontSize: 12, margin: 0 }}>
                ✦ Resume · AI Interviews · Mock Bank · Jobs · Growth
              </p>
            </div>
          </div>

          {/* Vibe card */}
          <div style={{
            borderRadius: 24, padding: '28px 32px', position: 'relative', overflow: 'hidden',
            background: vibe.gradient, border: `1px solid ${vibe.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <span style={{ fontSize: 40, lineHeight: 1 }}>{vibe.emoji}</span>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: vibe.accent, marginBottom: 8 }}>
                  {vibe.label}
                </p>
                <p style={{ color: '#e4e4e7', fontSize: 15, lineHeight: 1.65, fontWeight: 500, margin: 0 }}>
                  {vibe.message}
                </p>
              </div>
            </div>

            {tip && (
              <div style={{
                marginTop: 20, padding: '12px 16px', borderRadius: 12,
                background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <p style={{ fontSize: 11, color: '#52525b', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                  💡 Daily Tip
                </p>
                <p style={{ fontSize: 12, color: '#a1a1aa', lineHeight: 1.55, margin: 0 }}>{tip}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Interviews Done', val: '0', icon: '🎤', color: '#3b82f6' },
            { label: 'Jobs Applied', val: '0', icon: '📋', color: '#f59e0b' },
            { label: 'Resume Score', val: '—', icon: '📄', color: '#8b5cf6' },
          ].map(s => (
            <div key={s.label} style={{
              borderRadius: 20, padding: '20px 24px',
              background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>{s.icon}</div>
              <div>
                <p style={{ fontSize: 22, fontWeight: 800, color: '#f4f4f5', margin: 0, lineHeight: 1 }}>{s.val}</p>
                <p style={{ fontSize: 12, color: '#52525b', margin: '4px 0 0' }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Features ── */}
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#3f3f46', marginBottom: 12 }}>
          Tools
        </p>

        <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {FEATURES.map(f => (
            <Link key={f.href} href={f.href} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '18px 20px', borderRadius: 20,
                  background: f.bg, border: `1px solid ${f.accent}20`,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.border = `1px solid ${f.accent}45`
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.border = `1px solid ${f.accent}20`
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                  background: `${f.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, border: `1px solid ${f.accent}20`,
                }}>
                  {f.icon}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#f4f4f5' }}>{f.title}</span>
                    {f.badge && (
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99,
                        letterSpacing: '0.08em', color: f.badgeColor, background: f.badgeBg,
                      }}>{f.badge}</span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: '#52525b', margin: 0, lineHeight: 1.4 }}>{f.desc}</p>
                </div>

                {/* Arrow */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Profile card ── */}
        {profile && (
          <div style={{
            marginTop: 20, borderRadius: 20, padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 14,
                background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 16, color: '#3b82f6',
              }}>
                {profile.full_name?.[0] || '?'}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#f4f4f5', margin: 0 }}>{profile.full_name}</p>
                <p style={{ fontSize: 12, color: '#52525b', margin: '2px 0 0' }}>
                  {profile.role}{profile.experience ? ` · ${profile.experience}` : ''}
                </p>
              </div>
            </div>
            <Link href="/onboarding" style={{
              fontSize: 12, color: '#52525b', textDecoration: 'none',
              padding: '6px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)',
              transition: 'all 0.2s',
            }}>
              Edit Profile
            </Link>
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }

        @media (max-width: 640px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: 1fr !important; }
        }

        @media (min-width: 641px) and (max-width: 768px) {
          .features-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}