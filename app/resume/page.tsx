'use client'

import { useState } from 'react'

const jobRoles = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Data Scientist', 'AI/ML Engineer', 'DevOps Engineer', 'UI/UX Designer',
  'Android Developer', 'iOS Developer', 'Cloud Engineer',
  'Cybersecurity Analyst', 'Database Administrator', 'QA Engineer',
  'Product Manager', 'Business Analyst', 'Blockchain Developer',
]

type Mode = 'ats' | 'jd'

export default function ResumePage() {
  const [mode, setMode] = useState<Mode>('ats')
  const [resumeText, setResumeText] = useState('')
  const [jobRole, setJobRole] = useState('')
  const [customRole, setCustomRole] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [fileName, setFileName] = useState('')

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    if (file.type === 'application/pdf') {
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.js', import.meta.url).toString()
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      let text = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        text += content.items.map((item: any) => item.str).join(' ') + '\n'
      }
      setResumeText(text)
    } else if (file.name.endsWith('.docx')) {
      const mammoth = await import('mammoth')
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      setResumeText(result.value)
    }
  }

  const finalRole = isCustom ? customRole : jobRole

  async function handleAnalyze() {
    if (!resumeText) return
    if (mode === 'ats' && !finalRole.trim()) return
    if (mode === 'jd' && !jobDescription.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobRole: finalRole, jobDescription, mode }),
      })
      const data = await res.json()
      setResult(data.result)
    } catch {
      alert('Error aaya — dobara try karo')
    }
    setLoading(false)
  }

  function getScoreColorVar(score: number) {
    if (score >= 75) return 'var(--accent)'
    if (score >= 50) return 'var(--amber)'
    return '#f43f5e'
  }

  function getVerdictColorVar(verdict: string) {
    if (verdict === 'Excellent') return 'var(--accent)'
    if (verdict === 'Good') return 'var(--blue)'
    if (verdict === 'Average') return 'var(--amber)'
    return '#f43f5e'
  }

  function handleReset() {
    setResult(null)
    setResumeText('')
    setFileName('')
    setJobRole('')
    setCustomRole('')
    setIsCustom(false)
    setJobDescription('')
  }

  const canAnalyze = resumeText &&
    (mode === 'jd' ? jobDescription.trim() : (isCustom ? customRole.trim() : jobRole))

  return (
    <div
      className="min-h-screen w-full p-4 md:p-8 antialiased relative overflow-hidden"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {/* Dynamic Background Glow */}
      <div
        className="absolute top-24 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full pointer-events-none -z-10 transition-all duration-700"
        style={{ background: mode === 'jd' ? 'var(--purple-bg)' : 'var(--blue-bg)', filter: 'blur(140px)' }}
      />

      <div className="max-w-3xl mx-auto space-y-6 relative z-10">

        {/* Top Header */}
        <div className="flex flex-col space-y-2">
          <a
            href="/dashboard"
            className="text-xs font-medium font-mono uppercase tracking-wider transition-colors w-fit flex items-center gap-1.5"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            ← Back to Dashboard
          </a>
          <div className="pt-2">
            <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              ATS Resume Core Scorer
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Analyze structural integrity against specific domain roles or direct target job descriptions.
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => { setMode('ats'); setResult(null) }}
            className="p-5 text-left transition-all duration-300 relative overflow-hidden"
            style={
              mode === 'ats'
                ? { border: '1px solid var(--blue)', background: 'var(--blue-bg)', borderRadius: 'var(--radius-card)', boxShadow: '0 0 20px var(--blue-bg)' }
                : { border: '1px solid var(--border)', background: 'var(--bg-muted)', borderRadius: 'var(--radius-card)' }
            }
          >
            <div className="text-xl mb-2 filter drop-shadow-md">📊</div>
            <h3 className="font-bold text-sm tracking-wide mb-1" style={{ color: 'var(--text-primary)' }}>
              Standard ATS Score Matrix
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Target a structured industry field. The engine will score your profile and provide strategic parameter optimizations.
            </p>
            {mode === 'ats' && (
              <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full pointer-events-none" style={{ background: 'var(--blue-bg)' }} />
            )}
          </button>

          <button
            onClick={() => { setMode('jd'); setResult(null) }}
            className="p-5 text-left transition-all duration-300 relative overflow-hidden"
            style={
              mode === 'jd'
                ? { border: '1px solid var(--purple)', background: 'var(--purple-bg)', borderRadius: 'var(--radius-card)', boxShadow: '0 0 20px var(--purple-bg)' }
                : { border: '1px solid var(--border)', background: 'var(--bg-muted)', borderRadius: 'var(--radius-card)' }
            }
          >
            <div className="text-xl mb-2 filter drop-shadow-md">🎯</div>
            <h3 className="font-bold text-sm tracking-wide mb-1" style={{ color: 'var(--text-primary)' }}>
              Direct JD Match Pipeline
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Paste clear corporate criteria. The processor detects missing keywords and generates targeted resume components.
            </p>
            {mode === 'jd' && (
              <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full pointer-events-none" style={{ background: 'var(--purple-bg)' }} />
            )}
          </button>
        </div>

        {/* File Upload */}
        <div
          className="p-6"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
        >
          <label
            className="block w-full rounded-xl p-6 text-center cursor-pointer transition-all group"
            style={{ border: '1px dashed var(--border-strong)', background: 'var(--bg-muted)' }}
          >
            <div className="text-3xl mb-2 transition-transform duration-200 group-hover:-translate-y-0.5">📎</div>
            <p className="font-semibold text-sm mb-0.5 max-w-md mx-auto truncate" style={{ color: 'var(--text-primary)' }}>
              {fileName || 'Upload Structural Document Profile'}
            </p>
            <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>PDF, DOCX formats — Upper limit threshold 5MB</p>
            <input type="file" accept=".pdf,.docx" onChange={handleFileUpload} className="hidden" />
          </label>

          {resumeText && (
            <div
              className="mt-4 p-3 rounded-xl flex items-center gap-2"
              style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)', boxShadow: '0 0 8px var(--accent-bg)' }} />
              <p className="text-xs font-medium tracking-wide" style={{ color: 'var(--accent)' }}>
                Stream Parsed Successfully Matrix Layer: <span className="font-mono font-bold ml-1" style={{ color: 'var(--text-secondary)' }}>{resumeText.length} parameters</span>
              </p>
            </div>
          )}
        </div>

        {/* ATS Mode */}
        {mode === 'ats' && (
          <div
            className="p-6 space-y-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
          >
            <h2 className="text-sm font-bold tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              Select Targeted Engineering / Business Vector
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {jobRoles.map(role => {
                const isSelected = !isCustom && jobRole === role
                return (
                  <button
                    key={role}
                    onClick={() => { setJobRole(role); setIsCustom(false) }}
                    className="p-3 text-xs font-semibold tracking-wide transition-all duration-150 text-left truncate"
                    style={
                      isSelected
                        ? { border: '1px solid var(--blue)', background: 'var(--blue-bg)', color: 'var(--blue)', borderRadius: 'var(--radius-sm)' }
                        : { border: '1px solid var(--border)', background: 'var(--bg-muted)', color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)' }
                    }
                  >
                    {role}
                  </button>
                )
              })}
              <button
                onClick={() => { setIsCustom(true); setJobRole('') }}
                className="p-3 text-xs font-semibold tracking-wide transition-all duration-150 text-left"
                style={
                  isCustom
                    ? { border: '1px solid var(--blue)', background: 'var(--blue-bg)', color: 'var(--blue)', borderRadius: 'var(--radius-sm)' }
                    : { border: '1px solid var(--border)', background: 'var(--bg-muted)', color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)' }
                }
              >
                ✏️ Custom Workspace
              </button>
            </div>

            {isCustom && (
              <div className="pt-2 animate-in">
                <input
                  type="text"
                  value={customRole}
                  onChange={e => setCustomRole(e.target.value)}
                  placeholder="Allocate parameter e.g., React Native Engineer, Prompt Lead..."
                  className="w-full rounded-xl px-4 py-3 text-sm transition-all duration-200 focus:outline-none"
                  style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--blue)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
                />
              </div>
            )}
          </div>
        )}

        {/* JD Mode */}
        {mode === 'jd' && (
          <div
            className="p-6 space-y-3"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
          >
            <div className="flex justify-between items-baseline">
              <h2 className="text-sm font-bold tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                Target Corporate Criteria / JD Text
              </h2>
              {jobDescription.trim() && (
                <span
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                  style={{ background: 'var(--purple-bg)', border: '1px solid var(--purple-bg)', color: 'var(--purple)' }}
                >
                  {jobDescription.trim().split(/\s+/).length} Words Loaded
                </span>
              )}
            </div>
            <textarea
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              placeholder="Paste raw data specifications pulled from source tracking platforms..."
              rows={7}
              className="w-full rounded-xl px-4 py-3 text-sm resize-none transition-all duration-200 focus:outline-none"
              style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--purple)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
            />
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={!canAnalyze || loading}
          className="w-full py-3.5 font-bold text-sm transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none hover:scale-[1.005] active:scale-[0.995]"
          style={{
            background: mode === 'jd' ? `linear-gradient(90deg, var(--purple), var(--indigo))` : `linear-gradient(90deg, var(--blue), var(--accent))`,
            color: '#fff',
            borderRadius: 'var(--radius-sm)',
            boxShadow: mode === 'jd' ? '0 4px 14px var(--purple-bg)' : '0 4px 14px var(--blue-bg)',
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Compiling Analysis Engine...</span>
            </div>
          ) : mode === 'jd' ? (
            'Execute Target Criteria Comparison Pipeline →'
          ) : (
            'Initialize Structural Score Diagnostic 🚀'
          )}
        </button>

        {loading && (
          <div className="text-center py-6 animate-pulse" style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)' }}>
            <p className="text-xs font-mono tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
              Evaluating text hierarchies & structural tokens...
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6 pt-2 animate-in">

            {/* Score Summary */}
            <div
              className="p-6 md:p-8 text-center relative overflow-hidden"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
            >
              <div className="text-6xl font-black tracking-tighter mb-1" style={{ color: 'var(--text-primary)' }}>
                {result.atsScore}
              </div>
              <div className="text-[10px] font-mono tracking-widest uppercase mb-4" style={{ color: 'var(--text-muted)' }}>
                {mode === 'jd' ? 'Matching Threshold Index / 100' : 'Global Vector Compliance Rating / 100'}
              </div>
              <div className="text-xl font-extrabold tracking-tight" style={{ color: getVerdictColorVar(result.verdict) }}>
                {result.verdict === 'Excellent' && '🌟 Pristine Alignment Metrics'}
                {result.verdict === 'Good' && '✅ Solid Candidate Configuration'}
                {result.verdict === 'Average' && '⚠️ Variance Drift Present'}
                {result.verdict === 'Poor' && '❌ Structural Deficit Detected'}
              </div>
            </div>

            {/* Category Metrics — ATS mode only */}
            {mode === 'ats' && result.sections && (
              <div
                className="p-6 space-y-4"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
              >
                <h2 className="text-sm font-bold tracking-wide" style={{ color: 'var(--text-secondary)' }}>Internal Category Metrics</h2>
                <div className="space-y-3.5">
                  {Object.entries(result.sections).map(([key, score]: any) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between items-baseline font-mono text-xs">
                        <span className="capitalize" style={{ color: 'var(--text-muted)' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{score} / 100</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden p-[1px]" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ width: `${score}%`, background: getScoreColorVar(score) }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Params — JD mode only */}
            {mode === 'jd' && result.toAdd && (
              <div
                className="p-6 space-y-4"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--purple-bg)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
              >
                <h2 className="text-sm font-bold tracking-wide" style={{ color: 'var(--purple)' }}>🚀 Missing Parameters (Append for Selection)</h2>
                <div className="space-y-2.5">
                  {result.toAdd.map((item: string, i: number) => (
                    <div key={i} className="flex gap-3 p-3 rounded-xl items-start" style={{ background: 'var(--purple-bg)', border: '1px solid var(--purple-bg)' }}>
                      <span
                        className="font-mono text-xs font-bold w-5 h-5 rounded flex items-center justify-center shrink-0"
                        style={{ color: 'var(--purple)', background: 'var(--purple-bg)' }}
                      >
                        {i + 1}
                      </span>
                      <p className="text-xs leading-relaxed pt-0.5" style={{ color: 'var(--text-secondary)' }}>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Keyword Analysis */}
            {result.keywords && (
              <div
                className="p-6 space-y-4"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
              >
                <h2 className="text-sm font-bold tracking-wide" style={{ color: 'var(--text-secondary)' }}>Lexical Keyword Distribution Analysis</h2>

                <div className="space-y-2">
                  <p className="text-[11px] font-bold font-mono tracking-wider uppercase" style={{ color: 'var(--accent)' }}>
                    ✓ Found Clusters ({result.keywords.found.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.keywords.found.map((k: string) => (
                      <span key={k} className="px-2.5 py-1 rounded-md text-xs font-medium" style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }}>
                        {k}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <p className="text-[11px] font-bold font-mono tracking-wider uppercase" style={{ color: '#f43f5e' }}>
                    ✗ Deficit Clusters ({result.keywords.missing.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.keywords.missing.map((k: string) => (
                      <span key={k} className="px-2.5 py-1 rounded-md text-xs font-medium" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.18)', color: '#f43f5e' }}>
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Strengths vs Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className="p-5 space-y-3"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
              >
                <h2 className="text-sm font-bold tracking-wide" style={{ color: 'var(--accent)' }}>Verified Structural Strengths</h2>
                <ul className="space-y-2">
                  {result.strengths.map((s: string, i: number) => (
                    <li key={i} className="text-xs flex gap-2 items-start leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      <span className="text-xs shrink-0" style={{ color: 'var(--accent)' }}>•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div
                className="p-5 space-y-3"
                style={{ background: 'var(--bg-card)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
              >
                <h2 className="text-sm font-bold tracking-wide" style={{ color: '#f43f5e' }}>Actionable Optimization Vectors</h2>
                <ul className="space-y-2">
                  {result.improvements.map((s: string, i: number) => (
                    <li key={i} className="text-xs flex gap-2 items-start leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      <span className="text-xs shrink-0" style={{ color: '#f43f5e' }}>•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Alternative Roles */}
            {result.recommendedRoles && (
              <div
                className="p-6 space-y-3"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
              >
                <h2 className="text-sm font-bold tracking-wide" style={{ color: 'var(--text-secondary)' }}>Alternative Resonant Career Pathways</h2>
                <div className="flex flex-wrap gap-2">
                  {result.recommendedRoles.map((role: string) => (
                    <span key={role} className="px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: 'var(--blue-bg)', border: '1px solid var(--blue-bg)', color: 'var(--blue)' }}>
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pb-12">
              <button
                onClick={handleReset}
                className="flex-1 py-3 text-xs font-bold transition-all"
                style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-card)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-hover)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-subtle)' }}
              >
                🔄 Purge Metrics & Re-Analyze Data
              </button>
              <a
                href="/dashboard"
                className="flex-1 py-3 text-xs font-bold text-center transition-all"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                Return to Core Hub Dashboard
              </a>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}