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
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const firstName = profile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'there'
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

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
        <div className="relative rounded-3xl p-6 md:p-8 mb-4 overflow-hidden"
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
                href="/onboarding"
                icon="✏️"
                label="Edit Profile"
                desc="Update your info & target role"
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