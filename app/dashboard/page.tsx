'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const FEATURES = [
  {
    href: '/interview/setup',
    icon: '🎤',
    title: 'Interview Simulator',
    desc: 'AI mock interviews with real feedback',
    accent: '#3b82f6',
    bg: 'rgba(59,130,246,0.08)',
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
    bg: 'rgba(139,92,246,0.08)',
    badge: null,
  },
  {
    href: '/cover',
    icon: '✍️',
    title: 'Cover Letter',
    desc: 'Tailored letters in 30 seconds',
    accent: '#f97316',
    bg: 'rgba(249,115,22,0.08)',
    badge: null,
  },
  {
    href: '/growth',
    icon: '🚀',
    title: 'Growth Hub',
    desc: 'LinkedIn • Career test • Roadmap',
    accent: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
    badge: 'NEW',
    badgeColor: '#10b981',
    badgeBg: 'rgba(16,185,129,0.12)',
  },
  {
    href: '/jobs',
    icon: '📋',
    title: 'Job Tracker',
    desc: 'Track every application & interview',
    accent: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    badge: null,
  },
]

const VIBE = {
  morning: {
    emoji: '🌅',
    label: 'Morning Energy',
    message: "Fresh start, fresh opportunities. You've got this today.",
    gradient: 'linear-gradient(135deg, rgba(251,146,60,0.12) 0%, rgba(239,68,68,0.08) 100%)',
    border: 'rgba(251,146,60,0.2)',
    accent: '#fb923c',
  },
  afternoon: {
    emoji: '⚡',
    label: 'Grind Mode',
    message: "Peak hours. Lock in — your future self is watching.",
    gradient: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.08) 100%)',
    border: 'rgba(59,130,246,0.2)',
    accent: '#3b82f6',
  },
  evening: {
    emoji: '🌙',
    label: 'Wind Down',
    message: "Every step today brought you closer. Rest, recharge, repeat.",
    gradient: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(16,185,129,0.08) 100%)',
    border: 'rgba(99,102,241,0.2)',
    accent: '#818cf8',
  },
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [timeLabel, setTimeLabel] = useState('')
  const [vibe, setVibe] = useState(VIBE.morning)
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
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const firstName = profile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'there'

  if (!user) return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500 text-sm">Loading...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div className="max-w-xl md:max-w-3xl lg:max-w-5xl mx-auto px-5 md:px-10 pt-10 md:pt-16 pb-6">

        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6 md:mb-10">
          <div>
            <p className="text-zinc-500 text-xs md:text-sm font-medium tracking-widest uppercase mb-1">{timeLabel}</p>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight">
              {firstName} <span>👋</span>
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="w-9 h-9 md:w-11 md:h-11 rounded-2xl flex items-center justify-center transition-all hover:bg-white/10"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            title="Logout"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.8">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </button>
        </div>

        {/* Desktop: 2 col layout, Mobile: single col */}
        <div className="md:grid md:grid-cols-2 md:gap-6 mb-6">

          {/* Ambient Welcome Card */}
          <div className="relative rounded-3xl p-6 md:p-8 mb-3 md:mb-0 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(59,130,246,0.08) 50%, rgba(16,185,129,0.06) 100%)',
              border: '1px solid rgba(139,92,246,0.2)',
            }}
          >
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
              style={{ background: '#8b5cf6', filter: 'blur(60px)', opacity: 0.08, transform: 'translate(20%, -20%)' }} />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full pointer-events-none"
              style={{ background: '#3b82f6', filter: 'blur(50px)', opacity: 0.07, transform: 'translate(-20%, 20%)' }} />

            <p className="text-zinc-500 text-[10px] md:text-xs font-semibold tracking-widest uppercase mb-3">Your Space</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2">
              CareerSync
            </h2>
            <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
              Everything you need to land your dream job — in one place.
            </p>
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-zinc-600 text-xs md:text-sm">
                ✦ Resume · Interviews · Jobs · Growth
              </p>
            </div>
          </div>

          {/* Vibe Check Card */}
          <div className="relative rounded-3xl p-5 md:p-8 overflow-hidden"
            style={{
              background: vibe.gradient,
              border: `1px solid ${vibe.border}`,
            }}
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl md:text-5xl">{vibe.emoji}</div>
              <div className="flex-1">
                <p className="text-[10px] md:text-xs font-semibold tracking-widest uppercase mb-1 md:mb-2"
                  style={{ color: vibe.accent }}>
                  {vibe.label}
                </p>
                <p className="text-white text-sm md:text-lg leading-relaxed font-medium">
                  {vibe.message}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
          {[
            { label: 'Interviews', val: '0', icon: '🎤' },
            { label: 'Jobs Applied', val: '0', icon: '📋' },
            { label: 'Resume Score', val: '—', icon: '📄' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-3 md:p-5 text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-lg md:text-3xl mb-1">{s.icon}</div>
              <div className="text-white font-bold text-lg md:text-2xl leading-none">{s.val}</div>
              <div className="text-zinc-600 text-[10px] md:text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <p className="text-zinc-600 text-[10px] md:text-xs font-semibold tracking-widest uppercase mb-3">Tools</p>

        {/* Mobile: single col | Desktop: 2 col grid */}
        <div className="flex flex-col md:grid md:grid-cols-2 gap-2.5 md:gap-4">
          {FEATURES.map((f) => (
            <Link key={f.href} href={f.href}
              className="flex items-center gap-4 rounded-2xl px-4 md:px-5 py-3.5 md:py-4 transition-all duration-200 active:scale-[0.98] hover:brightness-125"
              style={{ background: f.bg, border: `1px solid ${f.accent}22` }}
            >
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl flex-shrink-0"
                style={{ background: `${f.accent}15` }}>
                {f.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-sm md:text-base">{f.title}</span>
                  {f.badge && (
                    <span className="text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ color: f.badgeColor, background: f.badgeBg }}>
                      {f.badge}
                    </span>
                  )}
                </div>
                <p className="text-zinc-600 text-xs md:text-sm mt-0.5 truncate">{f.desc}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </Link>
          ))}
        </div>

        {/* Profile Card */}
        {profile && (
          <div className="mt-4 md:mt-6 rounded-2xl px-4 md:px-5 py-3 md:py-4 flex items-center justify-between"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl flex items-center justify-center font-bold text-sm md:text-lg"
                style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
                {profile.full_name?.[0] || '?'}
              </div>
              <div>
                <p className="text-white text-sm md:text-base font-medium">{profile.full_name}</p>
                <p className="text-zinc-600 text-xs md:text-sm">{profile.role} • {profile.experience}</p>
              </div>
            </div>
            <Link href="/onboarding"
              className="text-xs md:text-sm text-zinc-500 hover:text-white transition px-3 py-1.5 rounded-xl"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              Edit
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}