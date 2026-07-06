'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      setLoading(false)
    }
    getUser()
  }, [router, supabase])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const firstName = profile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'there'
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const hasLinks = profile?.linkedin_url || profile?.github_url || profile?.stackoverflow_url || profile?.portfolio_url || profile?.resume_url

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <div className="max-w-xl md:max-w-2xl mx-auto px-5 md:px-10 pt-10 md:pt-16 pb-28 animate-in">

        {/* Top Bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
              Account
            </p>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Profile</h1>
          </div>
          <Link href="/dashboard"
            className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all"
            style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-muted)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.8">
              <path d="M19 12H5M5 12l7-7M5 12l7 7"/>
            </svg>
          </Link>
        </div>

        {/* Avatar + Name Card */}
        <div id="profile-overview" className="relative rounded-3xl p-6 md:p-8 mb-4 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, var(--accent-bg) 0%, var(--purple-bg) 50%, var(--blue-bg) 100%)`,
            border: '1px solid var(--accent-border)',
            borderRadius: 'var(--radius-card)',
          }}
        >
          {/* Glow blobs */}
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: 'var(--accent)', filter: 'blur(60px)', opacity: 0.08, transform: 'translate(20%, -20%)' }} />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full pointer-events-none"
            style={{ background: 'var(--purple)', filter: 'blur(50px)', opacity: 0.07, transform: 'translate(-20%, 20%)' }} />

          <div className="flex items-center gap-5 relative">
            {/* Avatar */}
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center font-bold text-xl md:text-2xl flex-shrink-0"
              style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg md:text-xl truncate" style={{ color: 'var(--text-primary)' }}>
                {profile?.full_name || 'User'}
              </h2>
              <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
              {profile?.role && (
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                    {profile.role}
                  </span>
                  {profile?.experience && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>
                      {profile.experience}
                    </span>
                  )}
                </div>
              )}

              {/* Social icon row — quick access, only shows if links exist */}
              {hasLinks && (
                <div className="mt-3 flex items-center gap-2">
                  {profile?.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:brightness-110"
                      style={{ background: 'rgba(10,102,194,0.12)', border: '1px solid rgba(10,102,194,0.25)' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.86 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 11.01-4.12 2.06 2.06 0 01-.01 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.8 0 0 .78 0 1.75v20.5C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.75V1.75C24 .78 23.2 0 22.22 0z"/></svg>
                    </a>
                  )}
                  {profile?.github_url && (
                    <a href={profile.github_url} target="_blank" rel="noopener noreferrer"
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:brightness-110"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--text-primary)"><path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.73-1.54-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.05 11.05 0 015.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .3.2.66.79.55A10.51 10.51 0 0023.5 12c0-6.27-5.23-11.5-11.5-11.5z"/></svg>
                    </a>
                  )}
                  {profile?.stackoverflow_url && (
                    <a href={profile.stackoverflow_url} target="_blank" rel="noopener noreferrer"
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:brightness-110"
                      style={{ background: 'rgba(244, 128, 36, 0.12)', border: '1px solid rgba(244, 128, 36, 0.25)' }}>
                      <span className="text-[10px] font-black" style={{ color: 'var(--amber)' }}>SO</span>
                    </a>
                  )}
                  {profile?.portfolio_url && (
                    <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer"
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:brightness-110"
                      style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18"/></svg>
                    </a>
                  )}
                  {profile?.resume_url && (
                    <a href={profile.resume_url} target="_blank" rel="noopener noreferrer"
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:brightness-110"
                      style={{ background: 'var(--purple-bg)', border: '1px solid var(--border)' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="space-y-3 mb-4">

          {/* Personal Info */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                Personal Info
              </p>
            </div>

            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              <InfoRow icon="👤" label="Full Name" value={profile?.full_name || '—'} />
              <InfoRow icon="📧" label="Email" value={user?.email || '—'} />
              <InfoRow icon="💼" label="Target Role" value={profile?.role || '—'} />
              <InfoRow icon="📅" label="Experience" value={profile?.experience || '—'} />
            </div>
          </div>

          {/* Links & Portfolio */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)' }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                Links &amp; Portfolio
              </p>
              {!hasLinks && (
                <Link href="/profile#links-section" className="text-[10px] font-semibold" style={{ color: 'var(--accent)' }}>
                  + Add links
                </Link>
              )}
            </div>

            {hasLinks ? (
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                <LinkRow icon="🔗" label="LinkedIn" value={profile?.linkedin_url} />
                <LinkRow icon="💻" label="GitHub" value={profile?.github_url} />
                <LinkRow icon="📊" label="Stack Overflow" value={profile?.stackoverflow_url} />
                <LinkRow icon="🌐" label="Portfolio" value={profile?.portfolio_url} />
                <LinkRow icon="📄" label="Resume" value={profile?.resume_url} />
              </div>
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                  No links added yet. Add your LinkedIn, GitHub, Stack Overflow, portfolio, or resume link to strengthen your profile.
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                Quick Actions
              </p>
            </div>

            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              <ActionRow
                href="/profile#profile-overview"
                icon="✏️"
                label="Edit Profile"
                desc="Update your info, target role & links"
                accentVar="--accent"
                accentBgVar="--accent-bg"
              />
              <ActionRow
                href="/resume"
                icon="📄"
                label="Resume Scorer"
                desc="Check your ATS score"
                accentVar="--purple"
                accentBgVar="--purple-bg"
              />
              <ActionRow
                href="/cover"
                icon="✍️"
                label="Cover Letter"
                desc="Generate tailored letters"
                accentVar="--coral"
                accentBgVar="--coral-bg"
              />
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-all hover:brightness-110 active:scale-[0.98]"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#ef4444',
            borderRadius: 'var(--radius-card)',
          }}
        >
          Sign Out
        </button>

      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="text-base w-6 text-center flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-faint)' }}>
          {label}
        </p>
        <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{value}</p>
      </div>
    </div>
  )
}

function LinkRow({ icon, label, value }: { icon: string; label: string; value?: string }) {
  if (!value) return null
  return (
    <a
      href={value}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-3.5 transition-all hover:brightness-110"
    >
      <span className="text-base w-6 text-center flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-faint)' }}>
          {label}
        </p>
        <p className="text-sm truncate" style={{ color: 'var(--accent)' }}>{value}</p>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2" className="flex-shrink-0">
        <path d="M7 17L17 7M17 7H9M17 7v8"/>
      </svg>
    </a>
  )
}

function ActionRow({ href, icon, label, desc, accentVar, accentBgVar }: {
  href: string; icon: string; label: string; desc: string; accentVar: string; accentBgVar: string
}) {
  return (
    <Link href={href}
      className="flex items-center gap-3 px-4 py-3.5 transition-all hover:brightness-110 active:scale-[0.98]"
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
        style={{ background: `var(${accentBgVar})` }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{desc}</p>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </Link>
  )
}