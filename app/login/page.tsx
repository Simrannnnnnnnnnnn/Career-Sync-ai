'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const FEATURES = [
  { icon: '🎤', name: 'AI Interviews', desc: 'Live mock + real-time feedback', color: 'var(--blue)', bg: 'var(--blue-bg)' },
  { icon: '📄', name: 'ATS Resume', desc: 'Beat the filters, get more calls', color: 'var(--purple)', bg: 'var(--purple-bg)' },
  { icon: '✍️', name: 'Cover Letter', desc: 'Tailored drafts in 30 seconds', color: 'var(--coral)', bg: 'var(--coral-bg)' },
  { icon: '🚀', name: 'Growth Hub', desc: 'LinkedIn · Career test · Roadmap', color: 'var(--accent)', bg: 'var(--accent-bg)' },
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
      options: { redirectTo: `${window.location.origin}/auth/callback` },
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
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) setError(error.message)
      else setMessage('Confirmation email sent! Please check your inbox.')
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

        .cs-root {
          min-height: 100vh;
          background: var(--bg-base);
          color: var(--text-primary);
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
          display: flex;
          position: relative;
          overflow: hidden;
          transition: background 0.25s ease, color 0.2s ease;
        }

        /* Ambient blobs — subtle in both themes */
        .cs-blob {
          position: fixed; border-radius: 50%;
          pointer-events: none; z-index: 0;
        }
        .cs-blob-1 {
          width: 600px; height: 600px; top: -180px; left: -140px;
          background: radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 65%);
        }
        .cs-blob-2 {
          width: 400px; height: 400px; bottom: -80px; left: 60px;
          background: radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 65%);
        }
        .cs-blob-3 {
          width: 300px; height: 300px; top: 40%; right: 380px;
          background: radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 65%);
        }

        .cs-inner {
          display: flex; width: 100%; max-width: 1100px;
          margin: 0 auto; position: relative; z-index: 1;
        }

        /* ── LEFT ── */
        .cs-left {
          flex: 1; padding: 52px 44px;
          display: flex; flex-direction: column;
          justify-content: center; gap: 32px;
        }

        /* Live badge */
        .cs-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 13px; border-radius: 99px; width: fit-content;
          background: var(--accent-bg);
          border: 1px solid var(--accent-border);
        }
        .cs-badge-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 8px var(--accent);
          animation: csBlink 2.2s ease-in-out infinite;
        }
        @keyframes csBlink { 0%,100%{opacity:1} 50%{opacity:0.35} }
        .cs-badge-txt {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.12em; color: var(--accent);
          text-transform: uppercase;
        }

        /* Hero text */
        .cs-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(36px, 5vw, 56px);
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 0.95;
          color: var(--text-primary);
          margin: 16px 0 10px;
        }
        .cs-tagline {
          font-size: 13px;
          color: var(--text-muted);
          font-weight: 500;
          letter-spacing: 0.01em;
          line-height: 1.5;
          max-width: 340px;
        }
        .cs-tagline strong {
          color: var(--text-secondary);
          font-weight: 600;
        }

        /* Feature grid */
        .cs-feats {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 9px; margin-top: 8px;
        }
        .cs-feat {
          display: flex; align-items: center; gap: 11px;
          padding: 12px 14px; border-radius: 14px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          transition: border-color 0.2s, background 0.2s;
          box-shadow: var(--shadow-card);
        }
        .cs-feat:hover {
          border-color: var(--border-strong);
          background: var(--bg-card-hover);
        }
        .cs-feat-icon {
          width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; border: 1px solid var(--border);
        }
        .cs-feat-name {
          font-size: 12px; font-weight: 600;
          color: var(--text-primary);
        }
        .cs-feat-desc {
          font-size: 11px; color: var(--text-muted); margin-top: 1px;
        }

        /* ── RIGHT ── */
        .cs-right {
          width: 400px; flex-shrink: 0;
          background: var(--bg-card);
          border-left: 1px solid var(--border);
          display: flex; align-items: center;
          justify-content: center; padding: 40px 32px;
          box-shadow: var(--shadow-card);
        }

        .cs-form { width: 100%; }

        /* Tabs */
        .cs-tabs {
          display: flex;
          background: var(--bg-subtle);
          border: 1px solid var(--border);
          border-radius: 12px; padding: 3px; margin-bottom: 22px;
        }
        .cs-tab {
          flex: 1; padding: 9px 0; border-radius: 9px; border: none;
          font-size: 12px; font-weight: 600; cursor: pointer;
          transition: all 0.2s; background: transparent;
          color: var(--text-muted);
          font-family: 'DM Sans', sans-serif;
        }
        .cs-tab.active {
          background: var(--accent-bg);
          color: var(--accent);
          border: 1px solid var(--accent-border);
        }

        /* Google btn */
        .cs-google {
          width: 100%; display: flex; align-items: center;
          justify-content: center; gap: 10px;
          background: var(--bg-base);
          color: var(--text-primary);
          border: 1px solid var(--border-strong);
          border-radius: 12px; padding: 11px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          transition: all 0.2s; font-family: 'DM Sans', sans-serif;
          margin-bottom: 16px;
        }
        .cs-google:hover {
          border-color: var(--accent);
          background: var(--bg-subtle);
          transform: translateY(-1px);
        }

        /* Divider */
        .cs-div {
          display: flex; align-items: center;
          gap: 10px; margin-bottom: 16px;
        }
        .cs-div-line { flex: 1; height: 1px; background: var(--border); }
        .cs-div-txt {
          font-size: 10px; color: var(--text-faint);
          text-transform: uppercase; letter-spacing: 0.14em;
        }

        /* Inputs */
        .cs-field { margin-bottom: 12px; }
        .cs-label {
          font-size: 10px; font-weight: 700;
          color: var(--text-muted); display: block;
          margin-bottom: 6px; letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .cs-input {
          width: 100%;
          background: var(--bg-subtle);
          border: 1px solid var(--border);
          border-radius: 11px; padding: 10px 14px;
          font-size: 13px; color: var(--text-primary);
          outline: none; transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .cs-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-bg);
        }
        .cs-input::placeholder { color: var(--text-faint); }

        /* Alerts */
        .cs-error {
          font-size: 12px; color: #f87171;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.18);
          border-radius: 10px; padding: 10px 13px;
          margin-bottom: 10px; text-align: center;
        }
        .cs-success {
          font-size: 12px; color: var(--accent);
          background: var(--accent-bg);
          border: 1px solid var(--accent-border);
          border-radius: 10px; padding: 10px 13px;
          margin-bottom: 10px; text-align: center;
        }

        /* CTA */
        .cs-cta {
          width: 100%; padding: 12px; margin-top: 4px;
          background: var(--accent);
          border: none; border-radius: 12px; color: #fff;
          font-size: 14px; font-weight: 700; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 20px var(--accent-bg);
          transition: all 0.2s;
          display: flex; align-items: center;
          justify-content: center; gap: 8px;
        }
        .cs-cta:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 8px 28px var(--accent-bg);
        }
        .cs-cta:active:not(:disabled) { transform: translateY(0); }
        .cs-cta:disabled { opacity: 0.5; cursor: not-allowed; }

        .cs-spinner {
          width: 15px; height: 15px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          animation: csSpin 0.7s linear infinite;
        }
        @keyframes csSpin { to { transform: rotate(360deg) } }

        .cs-switch {
          text-align: center; margin-top: 14px;
          font-size: 12px; color: var(--text-muted);
        }
        .cs-switch-btn {
          color: var(--accent); cursor: pointer; font-weight: 600;
          background: none; border: none;
          font-family: inherit; font-size: inherit;
        }
        .cs-switch-btn:hover { text-decoration: underline; }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .cs-inner { flex-direction: column; }
          .cs-left { padding: 32px 20px 20px; gap: 20px; }
          .cs-right {
            width: 100%; border-left: none;
            border-top: 1px solid var(--border);
            padding: 24px 16px 36px;
          }
          .cs-feats { gap: 7px; }
          .cs-feat { padding: 10px 12px; }
        }

        @media (max-width: 380px) {
          .cs-feats { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="cs-root">
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

              <h1 className="cs-title">Career<br />Sync AI</h1>

              <p className="cs-tagline">
                <strong>A Generative AI-Powered Career Development Platform</strong> for Students
              </p>

              <div className="cs-feats" style={{ marginTop: 24 }}>
                {FEATURES.map(f => (
                  <div className="cs-feat" key={f.name}>
                    <div className="cs-feat-icon" style={{ background: f.bg }}>
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
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="cs-right">
            <div className="cs-form">

              {/* Tabs */}
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
                  <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.3 4.4-17.7 10.7z"/>
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.5 5C9.8 39.7 16.4 44 24 44z"/>
                  <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.8 6l6.2 5.2C40.5 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
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
              {message && <div className="cs-success">✅ {message}</div>}

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
                  className="cs-switch-btn"
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