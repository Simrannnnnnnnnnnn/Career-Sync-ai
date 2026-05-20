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
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500 text-sm">Loading...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div className="max-w-xl md:max-w-2xl mx-auto px-5 md:px-10 pt-10 md:pt-16 pb-28">

        {/* Top Bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-zinc-500 text-xs font-semibold tracking-widest uppercase mb-1">Account</p>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Profile</h1>
          </div>
          <Link href="/dashboard"
            className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all hover:bg-white/10"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.8">
              <path d="M19 12H5M5 12l7-7M5 12l7 7"/>
            </svg>
          </Link>
        </div>

        {/* Avatar + Name Card */}
        <div className="relative rounded-3xl p-6 md:p-8 mb-4 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.08) 50%, rgba(16,185,129,0.06) 100%)',
            border: '1px solid rgba(59,130,246,0.2)',
          }}
        >
          {/* Glow blobs */}
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: '#3b82f6', filter: 'blur(60px)', opacity: 0.08, transform: 'translate(20%, -20%)' }} />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full pointer-events-none"
            style={{ background: '#8b5cf6', filter: 'blur(50px)', opacity: 0.07, transform: 'translate(-20%, 20%)' }} />

          <div className="flex items-center gap-5 relative">
            {/* Avatar */}
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center font-bold text-xl md:text-2xl flex-shrink-0"
              style={{ background: 'rgba(59,130,246,0.2)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-bold text-lg md:text-xl truncate">{profile?.full_name || 'User'}</h2>
              <p className="text-zinc-400 text-sm truncate">{user?.email}</p>
              {profile?.role && (
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
                    {profile.role}
                  </span>
                  {profile?.experience && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
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
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-zinc-500 text-[10px] font-semibold tracking-widest uppercase">Personal Info</p>
            </div>

            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              <InfoRow icon="👤" label="Full Name" value={profile?.full_name || '—'} />
              <InfoRow icon="📧" label="Email" value={user?.email || '—'} />
              <InfoRow icon="💼" label="Target Role" value={profile?.role || '—'} />
              <InfoRow icon="📅" label="Experience" value={profile?.experience || '—'} />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-zinc-500 text-[10px] font-semibold tracking-widest uppercase">Quick Actions</p>
            </div>

            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              <ActionRow
                href="/onboarding"
                icon="✏️"
                label="Edit Profile"
                desc="Update your info & target role"
                accent="#3b82f6"
              />
              <ActionRow
                href="/resume"
                icon="📄"
                label="Resume Scorer"
                desc="Check your ATS score"
                accent="#8b5cf6"
              />
              <ActionRow
                href="/cover"
                icon="✍️"
                label="Cover Letter"
                desc="Generate tailored letters"
                accent="#f97316"
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
        <p className="text-zinc-600 text-[10px] font-semibold uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-white text-sm truncate">{value}</p>
      </div>
    </div>
  )
}

function ActionRow({ href, icon, label, desc, accent }: {
  href: string; icon: string; label: string; desc: string; accent: string
}) {
  return (
    <Link href={href}
      className="flex items-center gap-3 px-4 py-3.5 transition-all hover:brightness-125 active:scale-[0.98]"
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
        style={{ background: `${accent}15` }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium">{label}</p>
        <p className="text-zinc-600 text-xs mt-0.5">{desc}</p>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="2">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </Link>
  )
}