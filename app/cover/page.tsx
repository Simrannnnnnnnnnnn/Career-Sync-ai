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

  const inputClass = "w-full rounded-2xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none transition"
  const inputStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
  }
  const inputFocusStyle = "focus:ring-1 focus:ring-blue-500/50"

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div className="max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto px-5 md:px-10 pt-10 md:pt-16 pb-28">

        {/* Header */}
        <div className="mb-8 md:mb-10">
          <Link href="/dashboard"
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm mb-5 transition">
            ← Dashboard
          </Link>

          {/* Ambient title card */}
          <div className="relative rounded-3xl p-6 md:p-8 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(249,115,22,0.1) 0%, rgba(239,68,68,0.06) 100%)',
              border: '1px solid rgba(249,115,22,0.2)',
            }}
          >
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
              style={{ background: '#f97316', filter: 'blur(60px)', opacity: 0.08, transform: 'translate(20%, -20%)' }} />
            <p className="text-zinc-500 text-[10px] md:text-xs font-semibold tracking-widest uppercase mb-2">AI Powered</p>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-1">Cover Letter ✍️</h1>
            <p className="text-zinc-400 text-sm md:text-base">Tailored letters for any job — in seconds.</p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4 md:space-y-5">

          {/* Job Title + Company — 2 col on all screens */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="text-zinc-500 text-xs font-semibold tracking-widest uppercase mb-2 block">Job Title</label>
              <input
                type="text" value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. ML Engineer"
                className={`${inputClass} ${inputFocusStyle}`}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="text-zinc-500 text-xs font-semibold tracking-widest uppercase mb-2 block">Company</label>
              <input
                type="text" value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Google"
                className={`${inputClass} ${inputFocusStyle}`}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Tone */}
          <div>
            <label className="text-zinc-500 text-xs font-semibold tracking-widest uppercase mb-3 block">Tone</label>
            <div className="flex gap-2">
              {[
                { key: 'professional', label: '💼 Professional' },
                { key: 'friendly', label: '😊 Friendly' },
                { key: 'confident', label: '🔥 Confident' },
              ].map((t) => (
                <button key={t.key} onClick={() => setTone(t.key)}
                  className="px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition"
                  style={tone === t.key ? {
                    background: 'rgba(249,115,22,0.15)',
                    border: '1px solid rgba(249,115,22,0.4)',
                    color: '#fb923c',
                  } : {
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#71717a',
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
              <label className="text-zinc-500 text-xs font-semibold tracking-widest uppercase mb-2 block">
                Job Description
                <span className="normal-case text-zinc-700 ml-1 font-normal">(optional)</span>
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={6}
                placeholder="Paste the job description here..."
                className={`${inputClass} ${inputFocusStyle} resize-none`}
                style={inputStyle}
              />
            </div>

            {/* Resume */}
            <div>
              <label className="text-zinc-500 text-xs font-semibold tracking-widest uppercase mb-2 block">
                Your Resume
                <span className="normal-case text-zinc-700 ml-1 font-normal">(optional)</span>
              </label>

              {/* Upload zone */}
              <div
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-2xl px-4 py-3 text-center cursor-pointer transition mb-2"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px dashed rgba(255,255,255,0.1)',
                }}
              >
                <input ref={fileRef} type="file" accept=".pdf,.docx" onChange={handleResumeUpload} className="hidden" />
                {parseLoading ? (
                  <p className="text-zinc-500 text-xs">⏳ Parsing resume...</p>
                ) : fileName ? (
                  <p className="text-green-400 text-xs">✅ {fileName}</p>
                ) : (
                  <p className="text-zinc-600 text-xs">📎 Upload PDF or DOCX</p>
                )}
              </div>

              <textarea
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                rows={4}
                placeholder="Or paste your skills here..."
                className={`${inputClass} ${inputFocusStyle} resize-none`}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateLetter}
            disabled={loading || !jobTitle || !company}
            className="w-full font-semibold py-3.5 md:py-4 rounded-2xl transition text-sm md:text-base disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: loading ? 'rgba(249,115,22,0.3)' : 'linear-gradient(135deg, #f97316, #ef4444)',
              boxShadow: loading ? 'none' : '0 0 30px rgba(249,115,22,0.2)',
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
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
                style={{ background: '#f97316', filter: 'blur(60px)', opacity: 0.05, transform: 'translate(20%, -20%)' }} />

              <div className="flex items-center justify-between mb-4">
                <p className="text-zinc-500 text-xs font-semibold tracking-widest uppercase">Your Cover Letter</p>
                <button onClick={copyToClipboard}
                  className="text-xs px-3 py-1.5 rounded-xl transition"
                  style={{
                    background: copied ? 'rgba(16,185,129,0.1)' : 'rgba(249,115,22,0.1)',
                    border: copied ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(249,115,22,0.3)',
                    color: copied ? '#10b981' : '#fb923c',
                  }}>
                  {copied ? '✅ Copied!' : '📋 Copy'}
                </button>
              </div>

              <p className="text-zinc-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap">{result}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}