'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/ThemeProvider'

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */
const FEATURES = [
  {
    href: '/interview/setup',
    icon: '🎤',
    title: 'AI Interview',
    desc: 'Live mock — camera, voice, real-time feedback',
    color: 'var(--blue)',
    bg: 'var(--blue-bg)',
    badge: 'HOT',
    badgeColor: 'var(--coral)',
    badgeBg: 'var(--coral-bg)',
  },
  {
    href: '/resume',
    icon: '📄',
    title: 'ATS Resume',
    desc: 'Beat the ATS — more interview calls',
    color: 'var(--purple)',
    bg: 'var(--purple-bg)',
    badge: null,
  },
  {
    href: '/interview/mock-setup',
    icon: '🧠',
    title: 'Mock Bank',
    desc: 'STAR-method answers, no camera needed',
    color: 'var(--indigo)',
    bg: 'var(--indigo-bg)',
    badge: 'NEW',
    badgeColor: 'var(--indigo)',
    badgeBg: 'var(--indigo-bg)',
  },
  {
    href: '/cover',
    icon: '✍️',
    title: 'Cover Letter',
    desc: 'Tailored draft in 30 seconds',
    color: 'var(--coral)',
    bg: 'var(--coral-bg)',
    badge: null,
  },
  {
    href: '/growth',
    icon: '🚀',
    title: 'Growth Hub',
    desc: 'LinkedIn • Career test • Roadmap',
    color: 'var(--accent)',
    bg: 'var(--accent-bg)',
    badge: null,
  },
  {
    href: '/jobs',
    icon: '📋',
    title: 'Job Tracker',
    desc: 'Track every application & interview',
    color: 'var(--amber)',
    bg: 'var(--amber-bg)',
    badge: null,
  },
]

const VIBE = {
  morning: {
    emoji: '🌅',
    label: 'Morning',
    message: "Fresh start. Every offer you've ever wanted is still possible today.",
    color: 'var(--coral)',
    bg: 'var(--coral-bg)',
    border: 'rgba(249,115,22,0.15)',
  },
  afternoon: {
    emoji: '⚡',
    label: 'Afternoon',
    message: "Peak hours. The work you do right now compounds quietly.",
    color: 'var(--blue)',
    bg: 'var(--blue-bg)',
    border: 'rgba(59,130,246,0.15)',
  },
  evening: {
    emoji: '🌙',
    label: 'Evening',
    message: "Another day closer. Every rep you put in today counts.",
    color: 'var(--indigo)',
    bg: 'var(--indigo-bg)',
    border: 'rgba(99,102,241,0.15)',
  },
}

const TIPS = [
  "Tailor resume keywords to match the job description exactly.",
  "Follow up 5 days after submitting — most candidates never do.",
  "Research the company's latest news before every interview.",
  "Use STAR method for every behavioural question.",
  "A strong LinkedIn headline gets 3× more recruiter views.",
  "Apply in the first 24 hours — early applicants get more callbacks.",
  "Quantify achievements — numbers stand out on resumes.",
  "Practice 'Tell me about yourself' in under 2 minutes.",
]

/* ─────────────────────────────────────────
   COMPONENTS
───────────────────────────────────────── */
function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width: 40,
        height: 40,
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-strong)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        flexShrink: 0,
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-card)')}
    >
      {theme === 'dark' ? (
        /* Sun icon */
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        /* Moon icon */
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/>
        </svg>
      )}
    </button>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: string
  label: string
  value: string
  color: string
  bg: string
}) {
  return (
    <div
      style={{
        borderRadius: 'var(--radius-card)',
        padding: '18px 20px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        boxShadow: 'var(--shadow-card)',
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
    >
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 14,
        flexShrink: 0,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20,
        border: `1px solid ${color}22`,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1 }}>
          {value}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>{label}</p>
      </div>
    </div>
  )
}

function FeatureTile({ f }: { f: typeof FEATURES[0] }) {
  return (
    <Link href={f.href} style={{ textDecoration: 'none' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '16px 18px',
          borderRadius: 'var(--radius-card)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: 'var(--shadow-card)',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = f.color
          el.style.transform = 'translateY(-2px)'
          el.style.background = f.bg
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = 'var(--border)'
          el.style.transform = 'translateY(0)'
          el.style.background = 'var(--bg-card)'
        }}
      >
        {/* Icon */}
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          flexShrink: 0,
          background: f.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          border: `1px solid ${f.color}22`,
        }}>
          {f.icon}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
              {f.title}
            </span>
            {f.badge && (
              <span style={{
                fontSize: 9,
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: 99,
                letterSpacing: '0.06em',
                color: f.badgeColor,
                background: f.badgeBg,
                border: `1px solid ${f.badgeColor}30`,
              }}>
                {f.badge}
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
            {f.desc}
          </p>
        </div>

        {/* Arrow */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2" style={{ flexShrink: 0 }}>
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>
    </Link>
  )
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [vibe, setVibe] = useState(VIBE.evening)
  const [timeLabel, setTimeLabel] = useState('Good evening')
  const [tip, setTip] = useState('')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
    }
    init()

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

  const firstName =
    profile?.full_name?.split(' ')[0] ||
    user?.user_metadata?.full_name?.split(' ')[0] ||
    'there'

  const initials = (profile?.full_name || user?.user_metadata?.full_name || '?')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  /* Loading state */
  if (!user) return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{
        width: 28,
        height: 28,
        border: '2px solid var(--accent)',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading...</p>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      color: 'var(--text-primary)',
      fontFamily: "var(--font-geist-sans), 'Segoe UI', sans-serif",
      transition: 'background 0.25s ease, color 0.2s ease',
    }}>

      {/* ── Subtle ambient glow (dark only, ignored in light) ── */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        background: 'radial-gradient(ellipse 70% 35% at 50% -5%, rgba(99,102,241,0.05) 0%, transparent 70%)',
      }} />

      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: 'clamp(24px, 5vw, 48px) clamp(16px, 4vw, 32px) 120px',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* ── TOP BAR ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'clamp(24px, 4vw, 36px)',
          gap: 12,
        }}>
          {/* Left: greeting */}
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 4,
            }}>
              {timeLabel}
            </p>
            <h1 style={{
              fontSize: 'clamp(22px, 4vw, 30px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              margin: 0,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {firstName} 👋
            </h1>
          </div>

          {/* Right: controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <ThemeToggle />

            {/* Avatar / logout */}
            <button
              onClick={handleLogout}
              title="Sign out"
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--accent-bg)',
                border: '1px solid var(--accent-border)',
                color: 'var(--accent)',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.75')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
            >
              {initials}
            </button>
          </div>
        </div>

        {/* ── HERO ROW ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 14,
          marginBottom: 14,
        }}>

          {/* Welcome card */}
          <div style={{
            borderRadius: 'var(--radius-card)',
            padding: 'clamp(20px, 3vw, 28px) clamp(20px, 3vw, 28px)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* top accent line */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: 2,
              background: 'linear-gradient(90deg, var(--indigo), var(--accent))',
              borderRadius: '20px 20px 0 0',
            }} />

            <p style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--indigo)',
              marginBottom: 10,
              marginTop: 8,
            }}>
              Your workspace
            </p>
            <h2 style={{
              fontSize: 'clamp(24px, 3.5vw, 34px)',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              margin: '0 0 8px',
              lineHeight: 1,
              color: 'var(--text-primary)',
            }}>
              CareerSync AI
            </h2>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: 14,
              lineHeight: 1.6,
              margin: '0 0 16px',
            }}>
              Everything you need to land your dream role — interviews, resume, cover letters and more.
            </p>
            <div style={{
              borderTop: '1px solid var(--border)',
              paddingTop: 12,
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px 14px',
            }}>
              {['Resume', 'AI Interviews', 'Mock Bank', 'Job Tracker', 'Growth'].map(tag => (
                <span key={tag} style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                  ✦ {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Vibe / motivational card */}
          <div style={{
            borderRadius: 'var(--radius-card)',
            padding: 'clamp(20px, 3vw, 28px)',
            background: 'var(--bg-card)',
            border: `1px solid ${vibe.border}`,
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <span style={{ fontSize: 36, lineHeight: 1, flexShrink: 0 }}>{vibe.emoji}</span>
              <div>
                <p style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: vibe.color,
                  marginBottom: 7,
                }}>
                  {vibe.label}
                </p>
                <p style={{
                  color: 'var(--text-primary)',
                  fontSize: 15,
                  lineHeight: 1.65,
                  fontWeight: 500,
                  margin: 0,
                }}>
                  {vibe.message}
                </p>
              </div>
            </div>

            {tip && (
              <div style={{
                padding: '11px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
              }}>
                <p style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: 4,
                }}>
                  💡 Daily tip
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                  {tip}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
          marginBottom: 28,
        }}>
          <StatCard icon="🎤" label="Interviews done" value="0"  color="var(--blue)"   bg="var(--blue-bg)" />
          <StatCard icon="📋" label="Jobs applied"    value="0"  color="var(--amber)"  bg="var(--amber-bg)" />
          <StatCard icon="📄" label="Resume score"    value="—"  color="var(--purple)" bg="var(--purple-bg)" />
        </div>

        {/* ── FEATURES GRID ── */}
        <p style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--text-faint)',
          marginBottom: 12,
        }}>
          Tools
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 10,
        }}>
          {FEATURES.map(f => <FeatureTile key={f.href} f={f} />)}
        </div>

        {/* ── PROFILE CARD ── */}
        {profile && (
          <div style={{
            marginTop: 20,
            borderRadius: 'var(--radius-card)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'var(--blue-bg)',
                border: '1px solid var(--blue)30',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 14,
                color: 'var(--blue)',
                flexShrink: 0,
              }}>
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {profile.full_name}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  {[profile.role, profile.experience].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
            <Link
              href="/onboarding"
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                padding: '7px 14px',
                borderRadius: 10,
                border: '1px solid var(--border-strong)',
                background: 'var(--bg-subtle)',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              Edit profile
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}