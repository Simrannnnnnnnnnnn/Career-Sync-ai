'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  }

  async function handleEmailAuth() {
    setLoading(true)
    setError('')
    setMessage('')

    if (!email || !password) {
      setError('Email aur password dono bharo!')
      setLoading(false)
      return
    }

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) {
        setError(error.message)
      } else {
        setMessage('✅ Confirmation email bheja! Inbox check karo.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Email ya password galat hai!')
      } else {
        router.push('/auth/callback?next=/dashboard')
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-zinc-100 flex items-center justify-center p-4 md:p-8 selection:bg-orange-500/30 selection:text-orange-200 antialiased relative overflow-hidden">
      
      {/* ✅ Ambient Hero/Background Glow — Elegant Orange Accent Layer */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-orange-500/10 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute top-12 right-12 w-72 h-72 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Main Container Wrapper */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
        
        {/* ✅ Desktop pe Left Side Side-by-Side Content Block */}
        <div className="space-y-6 text-center md:text-left hidden md:block px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-semibold text-orange-400">
            <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)] animate-ping" />
            Platform Engine Active
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              CareerSync AI
            </h1>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">
              Your comprehensive ecosystem built to streamline job hunting, analyze resumes, and optimize cover letters instantly.
            </p>
          </div>
          
          <div className="pt-4 grid grid-cols-2 gap-3 max-w-xs">
            <div className="p-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl backdrop-blur-md">
              <div className="text-xs font-semibold text-zinc-500">Pipeline Tracking</div>
              <div className="text-sm font-bold text-zinc-200 mt-1">Unified Tracker</div>
            </div>
            <div className="p-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl backdrop-blur-md">
              <div className="text-xs font-semibold text-zinc-500">AI Tailoring</div>
              <div className="text-sm font-bold text-zinc-200 mt-1">Smart Engine</div>
            </div>
          </div>
        </div>

        {/* ✅ Right Side (Glassmorphism Auth Card Form Factor) */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 md:p-8 shadow-2xl shadow-black/40 backdrop-blur-xl w-full">
          
          {/* Mobile Header Visibility Alternative */}
          <div className="text-center mb-6 md:hidden">
            <h1 className="text-2xl font-extrabold text-white">CareerSync AI</h1>
            <p className="text-zinc-400 text-xs mt-1">Your AI-powered career platform</p>
          </div>

          {/* ✅ Tone-Switch / Auth-Pill Style Switcher Buttons */}
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800/80 mb-6 backdrop-blur-md">
            <button
              onClick={() => { setIsSignUp(false); setError(''); setMessage('') }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                !isSignUp 
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sign In Pipeline
            </button>
            <button
              onClick={() => { setIsSignUp(true); setError(''); setMessage('') }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                isSignUp 
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* ✅ Google Authentication Button Link */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-zinc-100 hover:bg-white text-zinc-950 font-bold py-2.5 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-zinc-100/10 hover:-translate-y-0.5 active:translate-y-0 text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" className="flex-shrink-0">
              <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.3 4.4-17.7 10.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.5 5C9.8 39.7 16.4 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.8 6l6.2 5.2C40.5 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider Elements */}
          <div className="flex items-center gap-4 my-5">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest">OR EMAIL AUTH</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* Form Stack Elements */}
          <div className="space-y-4 mb-5">
            {/* ✅ Glass Styled Inputs */}
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 mb-1.5 block">Email Address</label>
              <input
                type="email"
                placeholder="name@domain.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleEmailAuth()}
                className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-200"
              />
            </div>
            
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 mb-1.5 block">Secure Password</label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleEmailAuth()}
                className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-200"
              />
            </div>
          </div>

          {/* Notifications Alert UI Wrapper Blocks */}
          {error && (
            <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 mb-4 text-center">
              ⚠️ {error}
            </div>
          )}
          {message && (
            <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-4 text-center">
              {message}
            </div>
          )}

          {/* ✅ Generate Action Button with Orange Gradient & Radiant Glow */}
          <button
            onClick={handleEmailAuth}
            disabled={loading}
            className="w-full relative group overflow-hidden bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-lg shadow-orange-500/10 hover:shadow-orange-500/30 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {/* ✅ Spinner Animation Configured on Active Loading States */}
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing Stream...</span>
              </>
            ) : (
              <span>{isSignUp ? 'Generate Secure Account' : 'Initialize Session Login →'}</span>
            )}
          </button>

          {/* Alternate Screen Interface Switcher Links */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage('') }}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors duration-150 inline-flex items-center gap-1"
            >
              <span>{isSignUp ? 'Already have an existing pipeline?' : 'Need to allocate new parameters?'}</span>
              <span className="text-orange-400 hover:underline font-medium ml-0.5">
                {isSignUp ? 'Sign In' : 'Register Here'}
              </span>
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}