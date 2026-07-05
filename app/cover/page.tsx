'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

export default function CoverLetter() {
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [resume, setResume] = useState('')
  const [tone, setTone] = useState('professional')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)
  const [parseLoading, setParseLoading] = useState(false)
  const [fileName, setFileName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setParseLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/resume', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.text) setResume(data.text)
    } catch (err) {
      console.error(err)
    } finally {
      setParseLoading(false)
    }
  }

  async function generateLetter() {
    if (!jobTitle || !company) return
    setLoading(true)
    setResult('')
    try {
      const res = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle, company, jobDescription, resume, tone }),
      })
      const data = await res.json()
      setResult(data.letter)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inputClass = "w-full rounded-2xl px-4 py-3 text-sm focus:outline-none transition"
  const inputStyle = {
    background: 'var(--bg-muted)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <div className="max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto px-5 md:px-10 pt-10 md:pt-16 pb-28">

        {/* Header */}
        <div className="mb-8 md:mb-10">
          <Link href="/dashboard"
            className="inline-flex items-center gap-2 text-sm mb-5 transition"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            ← Dashboard
          </Link>

          {/* Ambient title card */}
          <div className="relative rounded-3xl p-6 md:p-8 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, var(--coral-bg) 0%, var(--coral-bg) 100%)',
              border: '1px solid var(--accent-border)',
              borderRadius: 'var(--radius-card)',
            }}
          >
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
              style={{ background: 'var(--coral)', filter: 'blur(60px)', opacity: 0.08, transform: 'translate(20%, -20%)' }} />
            <p className="text-[10px] md:text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>AI Powered</p>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-1">Cover Letter ✍️</h1>
            <p className="text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>Tailored letters for any job — in seconds.</p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4 md:space-y-5">

          {/* Job Title + Company — 2 col on all screens */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="text-xs font-semibold tracking-widest uppercase mb-2 block" style={{ color: 'var(--text-muted)' }}>Job Title</label>
              <input
                type="text" value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. ML Engineer"
                className={inputClass}
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-bg)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold tracking-widest uppercase mb-2 block" style={{ color: 'var(--text-muted)' }}>Company</label>
              <input
                type="text" value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Google"
                className={inputClass}
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-bg)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>
          </div>

          {/* Tone */}
          <div>
            <label className="text-xs font-semibold tracking-widest uppercase mb-3 block" style={{ color: 'var(--text-muted)' }}>Tone</label>
            <div className="flex gap-2">
              {[
                { key: 'professional', label: '💼 Professional' },
                { key: 'friendly', label: '😊 Friendly' },
                { key: 'confident', label: '🔥 Confident' },
              ].map((t) => (
                <button key={t.key} onClick={() => setTone(t.key)}
                  className="px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition"
                  style={tone === t.key ? {
                    background: 'var(--coral-bg)',
                    border: '1px solid var(--coral)',
                    color: 'var(--coral)',
                  } : {
                    background: 'var(--bg-muted)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop: 2 col for JD + Resume, Mobile: single col */}
          <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">

            {/* Job Description */}
            <div>
              <label className="text-xs font-semibold tracking-widest uppercase mb-2 block" style={{ color: 'var(--text-muted)' }}>
                Job Description
                <span className="normal-case ml-1 font-normal" style={{ color: 'var(--text-faint)' }}>(optional)</span>
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={6}
                placeholder="Paste the job description here..."
                className={`${inputClass} resize-none`}
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-bg)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>

            {/* Resume */}
            <div>
              <label className="text-xs font-semibold tracking-widest uppercase mb-2 block" style={{ color: 'var(--text-muted)' }}>
                Your Resume
                <span className="normal-case ml-1 font-normal" style={{ color: 'var(--text-faint)' }}>(optional)</span>
              </label>

              {/* Upload zone */}
              <div
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-2xl px-4 py-3 text-center cursor-pointer transition mb-2"
                style={{
                  background: 'var(--bg-muted)',
                  border: '1px dashed var(--border-strong)',
                }}
              >
                <input ref={fileRef} type="file" accept=".pdf,.docx" onChange={handleResumeUpload} className="hidden" />
                {parseLoading ? (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>⏳ Parsing resume...</p>
                ) : fileName ? (
                  <p className="text-xs" style={{ color: 'var(--accent)' }}>✅ {fileName}</p>
                ) : (
                  <p className="text-xs" style={{ color: 'var(--text-faint)' }}>📎 Upload PDF or DOCX</p>
                )}
              </div>

              <textarea
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                rows={4}
                placeholder="Or paste your skills here..."
                className={`${inputClass} resize-none`}
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-bg)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateLetter}
            disabled={loading || !jobTitle || !company}
            className="w-full font-semibold py-3.5 md:py-4 rounded-2xl transition text-sm md:text-base disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: loading ? 'var(--coral-bg)' : `linear-gradient(135deg, var(--coral), color-mix(in srgb, var(--coral) 70%, red))`,
              boxShadow: loading ? 'none' : '0 0 30px var(--coral-bg)',
              color: '#fff',
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </span>
            ) : '✍️ Generate Cover Letter'}
          </button>

          {/* Result */}
          {result && (
            <div className="relative rounded-3xl p-5 md:p-7 overflow-hidden"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-card)',
              }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
                style={{ background: 'var(--coral)', filter: 'blur(60px)', opacity: 0.05, transform: 'translate(20%, -20%)' }} />

              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Your Cover Letter</p>
                <button onClick={copyToClipboard}
                  className="text-xs px-3 py-1.5 rounded-xl transition"
                  style={{
                    background: copied ? 'var(--accent-bg)' : 'var(--coral-bg)',
                    border: copied ? '1px solid var(--accent-border)' : '1px solid var(--coral)',
                    color: copied ? 'var(--accent)' : 'var(--coral)',
                  }}>
                  {copied ? '✅ Copied!' : '📋 Copy'}
                </button>
              </div>

              <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{result}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}