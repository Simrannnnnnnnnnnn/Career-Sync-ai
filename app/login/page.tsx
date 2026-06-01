'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const FEATURES = [
  { icon: '🎤', name: 'AI Interviews', desc: 'Live mock + real feedback', accent: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
  { icon: '📄', name: 'ATS Resume', desc: 'Beat ATS filters', accent: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)' },
  { icon: '✍️', name: 'Cover Letter', desc: '30-second drafts', accent: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)' },
  { icon: '🚀', name: 'Growth Hub', desc: 'LinkedIn + roadmap', accent: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
]

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
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  async function handleEmailAuth() {
    setLoading(true)
    setError('')
    setMessage('')
    if (!email || !password) {
      setError('Please enter both email and password.')
      setLoading(false)
      return
    }
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
      })
      if (error) setError(error.message)
      else setMessage('✅ Confirmation email sent! Please check your inbox.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('Invalid email or password. Please try again.')
      else router.push('/auth/callback?next=/dashboard')
    }
    setLoading(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        .cs-login-root {
          min-height: 100vh;
          background: #0f0f14;
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
          color: #f4f4f5;
          display: flex;
          position: relative;
          overflow: hidden;
        }

        /* Ambient blobs */
        .cs-blob {
          position: fixed; border-radius: 50%; pointer-events: none; z-index: 0;
        }
        .cs-blob-1 {
          width: 600px; height: 600px; top: -180px; left: -140px;
          background: radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 65%);
        }
        .cs-blob-2 {
          width: 440px; height: 440px; bottom: -100px; left: 80px;
          background: radial-gradient(circle, rgba(249,115,22,0.09) 0%, transparent 65%);
        }
        .cs-blob-3 {
          width: 320px; height: 320px; top: 35%; right: 360px;
          background: radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 65%);
        }

        /* Layout */
        .cs-inner {
          display: flex; width: 100%; max-width: 1100px;
          margin: 0 auto; position: relative; z-index: 1;
        }

        /* LEFT */
        .cs-left {
          flex: 1; padding: 52px 44px;
          display: flex; flex-direction: column;
          justify-content: space-between; gap: 36px;
        }

        .cs-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 13px; border-radius: 99px; width: fit-content;
          background: rgba(249,115,22,0.07); border: 1px solid rgba(249,115,22,0.18);
        }
        .cs-badge-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #f97316;
          box-shadow: 0 0 8px rgba(249,115,22,0.8);
          animation: csBlink 2.2s ease-in-out infinite;
        }
        @keyframes csBlink { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .cs-badge-txt {
          font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
          color: #f97316; text-transform: uppercase;
        }

        .cs-hero-title {
          font-family: 'Syne', sans-serif;
          font-size: 54px; font-weight: 800;
          letter-spacing: -0.045em; line-height: 0.95;
          background: linear-gradient(150deg, #ffffff 0%, #a1a1aa 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; margin: 20px 0 14px;
        }
        .cs-hero-sub {
          font-size: 14px; color: #71717a; line-height: 1.75; max-width: 310px;
        }

        /* Feature grid */
        .cs-feats {
          display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-top: 28px;
        }
        .cs-feat {
          display: flex; align-items: center; gap: 11px;
          padding: 12px 14px; border-radius: 15px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
          transition: background 0.2s, border-color 0.2s;
        }
        .cs-feat:hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.1);
        }
        .cs-feat-icon {
          width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; font-size: 17px;
        }
        .cs-feat-name { font-size: 12px; font-weight: 600; color: #e4e4e7; }
        .cs-feat-desc { font-size: 11px; color: #52525b; margin-top: 1px; }

        /* Testimonial */
        .cs-proof {
          padding: 16px 18px; border-radius: 16px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .cs-proof-quote {
          font-size: 12px; color: #71717a;
          line-height: 1.7; font-style: italic;
        }
        .cs-proof-author {
          display: flex; align-items: center; gap: 10px; margin-top: 12px;
        }
        .cs-proof-av {
          width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #6366f1, #3b82f6);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: #fff;
        }
        .cs-proof-name { font-size: 12px; color: #52525b; font-weight: 500; }
        .cs-proof-co { font-size: 11px; color: #3f3f46; }

        /* RIGHT */
        .cs-right {
          width: 400px; flex-shrink: 0;
          background: rgba(255,255,255,0.025);
          border-left: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);
          display: flex; align-items: center; justify-content: center;
          padding: 40px 32px;
        }

        .cs-card {
          width: 100%;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 22px; padding: 28px 24px;
        }

        /* Tabs */
        .cs-tabs {
          display: flex; background: rgba(0,0,0,0.25);
          border: 1px solid rgba(255,255,255,0.06); border-radius: 12px;
          padding: 3px; margin-bottom: 22px;
        }
        .cs-tab {
          flex: 1; padding: 9px 0; border-radius: 9px; border: none;
          font-size: 12px; font-weight: 600; cursor: pointer;
          transition: all 0.2s; background: transparent; color: #52525b;
          font-family: 'DM Sans', sans-serif;
        }
        .cs-tab.active {
          background: rgba(249,115,22,0.09); color: #f97316;
          border: 1px solid rgba(249,115,22,0.22);
        }

        /* Google btn */
        .cs-google {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
          background: rgba(255,255,255,0.92); color: #111; border: none;
          border-radius: 12px; padding: 11px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
          font-family: 'DM Sans', sans-serif; margin-bottom: 16px;
        }
        .cs-google:hover {
          background: #fff; transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(0,0,0,0.35);
        }

        /* Divider */
        .cs-div {
          display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
        }
        .cs-div-line { flex: 1; height: 1px; background: rgba(255,255,255,0.06); }
        .cs-div-txt {
          font-size: 10px; color: #3f3f46;
          text-transform: uppercase; letter-spacing: 0.14em;
        }

        /* Inputs */
        .cs-field { margin-bottom: 12px; }
        .cs-label {
          font-size: 10px; font-weight: 700; color: #52525b;
          display: block; margin-bottom: 6px;
          letter-spacing: 0.08em; text-transform: uppercase;
        }
        .cs-input {
          width: 100%; background: rgba(0,0,0,0.22);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 11px; padding: 10px 14px;
          font-size: 13px; color: #f4f4f5;
          outline: none; transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .cs-input:focus {
          border-color: rgba(249,115,22,0.45);
          box-shadow: 0 0 0 3px rgba(249,115,22,0.07);
        }
        .cs-input::placeholder { color: #3f3f46; }

        /* Error / success */
        .cs-error {
          font-size: 12px; color: #f87171;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.18);
          border-radius: 10px; padding: 10px 13px;
          margin-bottom: 10px; text-align: center;
        }
        .cs-success {
          font-size: 12px; color: #34d399;
          background: rgba(16,185,129,0.08);
          border: 1px solid rgba(16,185,129,0.18);
          border-radius: 10px; padding: 10px 13px;
          margin-bottom: 10px; text-align: center;
        }

        /* CTA */
        .cs-cta {
          width: 100%; padding: 12px; margin-top: 4px;
          background: linear-gradient(135deg, #ea580c, #f97316);
          border: none; border-radius: 12px; color: #fff;
          font-size: 14px; font-weight: 700; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 22px rgba(249,115,22,0.2);
          transition: all 0.2s; display: flex; align-items: center;
          justify-content: center; gap: 8px;
        }
        .cs-cta:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(249,115,22,0.3);
        }
        .cs-cta:active:not(:disabled) { transform: translateY(0); }
        .cs-cta:disabled { opacity: 0.55; cursor: not-allowed; }
        .cs-spinner {
          width: 15px; height: 15px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          animation: csSpin 0.7s linear infinite;
        }
        @keyframes csSpin { to { transform: rotate(360deg) } }

        .cs-switch {
          text-align: center; margin-top: 14px; font-size: 12px; color: #52525b;
        }
        .cs-switch-link {
          color: #f97316; cursor: pointer; font-weight: 500;
          background: none; border: none; font-family: inherit; font-size: inherit;
        }
        .cs-switch-link:hover { text-decoration: underline; }

        /* ── MOBILE RESPONSIVE ── */
        @media (max-width: 768px) {
          .cs-inner { flex-direction: column; }

          .cs-left {
            padding: 32px 20px 20px;
            gap: 20px; justify-content: flex-start;
          }
          .cs-hero-title { font-size: 38px; margin: 14px 0 10px; }
          .cs-hero-sub { font-size: 13px; max-width: 100%; }
          .cs-feats { gap: 7px; }
          .cs-feat { padding: 10px 11px; gap: 9px; }
          .cs-feat-icon { width: 32px; height: 32px; font-size: 14px; border-radius: 9px; }
          .cs-feat-name { font-size: 11px; }
          .cs-feat-desc { font-size: 10px; }
          .cs-proof { display: none; }

          .cs-right {
            width: 100%; border-left: none;
            border-top: 1px solid rgba(255,255,255,0.07);
            padding: 24px 16px 36px;
          }
          .cs-card { border-radius: 18px; padding: 22px 18px; }
        }

        @media (max-width: 380px) {
          .cs-hero-title { font-size: 32px; }
          .cs-feats { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="cs-login-root">
        {/* Ambient blobs */}
        <div className="cs-blob cs-blob-1" />
        <div className="cs-blob cs-blob-2" />
        <div className="cs-blob cs-blob-3" />

        <div className="cs-inner">
          {/* ── LEFT PANEL ── */}
          <div className="cs-left">
            <div>
              <div className="cs-badge">
                <div className="cs-badge-dot" />
                <span className="cs-badge-txt">Platform Engine Active</span>
              </div>

              <h1 className="cs-hero-title">Career<br />Sync AI</h1>
              <p className="cs-hero-sub">
                Everything you need to land your dream job — interviews, resume, cover letters & more.
              </p>

              <div className="cs-feats">
                {FEATURES.map(f => (
                  <div className="cs-feat" key={f.name}>
                    <div
                      className="cs-feat-icon"
                      style={{ background: f.bg, border: `1px solid ${f.border}` }}
                    >
                      {f.icon}
                    </div>
                    <div>
                      <div className="cs-feat-name">{f.name}</div>
                      <div className="cs-feat-desc">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Testimonial — hidden on mobile */}
            <div className="cs-proof">
              <p className="cs-proof-quote">
                "Got my SDE offer after just 2 AI mock sessions. The feedback was incredibly specific to my answers."
              </p>
              <div className="cs-proof-author">
                <div className="cs-proof-av">P</div>
                <div>
                  <div className="cs-proof-name">Priya S.</div>
                  <div className="cs-proof-co">Placed at Flipkart · MCA Graduate</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="cs-right">
            <div className="cs-card">
              {/* Tab switcher */}
              <div className="cs-tabs">
                <button
                  className={`cs-tab ${!isSignUp ? 'active' : ''}`}
                  onClick={() => { setIsSignUp(false); setError(''); setMessage('') }}
                >
                  Sign In
                </button>
                <button
                  className={`cs-tab ${isSignUp ? 'active' : ''}`}
                  onClick={() => { setIsSignUp(true); setError(''); setMessage('') }}
                >
                  Create Account
                </button>
              </div>

              {/* Google */}
              <button className="cs-google" onClick={handleGoogleLogin}>
                <svg width="16" height="16" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4z" />
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.3 4.4-17.7 10.7z" />
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.5 5C9.8 39.7 16.4 44 24 44z" />
                  <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.8 6l6.2 5.2C40.5 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z" />
                </svg>
                Continue with Google
              </button>

              <div className="cs-div">
                <div className="cs-div-line" />
                <span className="cs-div-txt">or email</span>
                <div className="cs-div-line" />
              </div>

              <div className="cs-field">
                <label className="cs-label">Email Address</label>
                <input
                  type="email"
                  className="cs-input"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleEmailAuth()}
                />
              </div>

              <div className="cs-field">
                <label className="cs-label">Password</label>
                <input
                  type="password"
                  className="cs-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleEmailAuth()}
                />
              </div>

              {error && <div className="cs-error">⚠️ {error}</div>}
              {message && <div className="cs-success">{message}</div>}

              <button
                className="cs-cta"
                onClick={handleEmailAuth}
                disabled={loading}
              >
                {loading ? (
                  <><div className="cs-spinner" /><span>Please wait...</span></>
                ) : (
                  <span>{isSignUp ? 'Create Account →' : 'Sign In →'}</span>
                )}
              </button>

              <div className="cs-switch">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  className="cs-switch-link"
                  onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage('') }}
                >
                  {isSignUp ? 'Sign In' : 'Register'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}