'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profileData)
      }
    }
    getUser()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-white">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-3xl font-bold">CareerSync AI</h1>
          <button onClick={handleLogout} className="text-gray-400 hover:text-white text-sm">
            Logout
          </button>
        </div>

        {/* Welcome */}
        <p className="text-gray-400 mb-6">
          Welcome, {profile?.full_name || user.user_metadata?.full_name} 👋
        </p>

        {/* Profile Card */}
        {profile && (
          <div className="flex items-center justify-between bg-gray-900 rounded-2xl px-6 py-4 mb-8 border border-gray-800">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">
                {profile.full_name?.[0] || '?'}
              </div>
              <div>
                <p className="text-white font-medium">{profile.full_name}</p>
                <p className="text-gray-500 text-xs">{profile.role} • {profile.experience}</p>
                {profile.target_companies?.length > 0 && (
                  <p className="text-gray-600 text-xs mt-0.5">
                    🎯 {profile.target_companies.join(', ')}
                  </p>
                )}
              </div>
            </div>
            <Link
              href="/onboarding"
              className="text-sm text-gray-400 hover:text-blue-400 border border-gray-700 hover:border-blue-500 px-4 py-2 rounded-xl transition"
            >
              ✏️ Edit Profile
            </Link>
          </div>
        )}

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <Link href="/interview/setup" className="bg-gray-900 p-6 rounded-2xl border border-gray-800 hover:border-blue-500 transition block">
            <div className="text-3xl mb-3">🎤</div>
            <h2 className="text-xl font-semibold mb-2">Interview Simulator</h2>
            <p className="text-gray-400 text-sm">Practice with AI-powered mock interviews</p>
          </Link>

          <Link href="/resume" className="bg-gray-900 p-6 rounded-2xl border border-gray-800 hover:border-purple-500 transition block">
            <div className="text-3xl mb-3">📄</div>
            <h2 className="text-xl font-semibold mb-2">ATS Resume Scorer</h2>
            <p className="text-gray-400 text-sm">Score your resume against job descriptions</p>
          </Link>

          {/* Growth Hub — replaces Career Path + Learning Roadmap */}
          <Link href="/growth-hub" className="md:col-span-2 bg-gray-900 p-6 rounded-2xl border border-gray-800 hover:border-green-500 transition block">
            <div className="text-3xl mb-3">🚀</div>
            <h2 className="text-xl font-semibold mb-2">Growth Hub</h2>
            <p className="text-gray-400 text-sm">
              LinkedIn Optimizer • Career Path Test • Learning Roadmap
            </p>
          </Link>
          <Link href="/cover-letter" className="bg-gray-900 p-6 rounded-2xl border border-gray-800 hover:border-blue-500 transition block">
            <div className="text-3xl mb-3">✍️</div>
            <h2 className="text-xl font-semibold mb-2">Cover Letter Generator</h2>
            <p className="text-gray-400 text-sm">Generate a tailored cover letter for any job in seconds</p>
          </Link>

        </div>
      </div>
    </div>
  )
}