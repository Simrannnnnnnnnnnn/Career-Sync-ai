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
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString()
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

  function getScoreColor(score: number) {
    if (score >= 75) return 'bg-emerald-500'
    if (score >= 50) return 'bg-amber-500'
    return 'bg-rose-500'
  }

  function getVerdictColor(verdict: string) {
    if (verdict === 'Excellent') return 'text-emerald-400'
    if (verdict === 'Good') return 'text-blue-400'
    if (verdict === 'Average') return 'text-amber-400'
    return 'text-rose-400'
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
    <div className="min-h-screen w-full bg-[#09090b] text-zinc-100 p-4 md:p-8 selection:bg-blue-500/30 selection:text-blue-200 antialiased relative overflow-hidden">
      
      {/* Dynamic Background Glows tailored to mode parameters */}
      <div className={`absolute top-24 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none -z-10 transition-all duration-700 ${
        mode === 'jd' ? 'bg-purple-500/5' : 'bg-blue-500/5'
      }`} />

      <div className="max-w-3xl mx-auto space-y-6 relative z-10">

        {/* Top Header Block */}
        <div className="flex flex-col space-y-2">
          <a 
            href="/dashboard" 
            className="text-zinc-500 hover:text-zinc-300 text-xs font-medium font-mono uppercase tracking-wider transition-colors w-fit flex items-center gap-1.5"
          >
            ← Back to Dashboard
          </a>
          <div className="pt-2">
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              ATS Resume Core Scorer
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Analyze structural integrity against specific domain roles or direct target job descriptions.
            </p>
          </div>
        </div>

        {/* Mode Selector Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => { setMode('ats'); setResult(null) }}
            className={`p-5 rounded-2xl border text-left transition-all duration-300 backdrop-blur-md relative overflow-hidden group ${
              mode === 'ats' 
                ? 'border-blue-500/80 bg-blue-500/[0.04] shadow-[0_0_20px_rgba(59,130,246,0.08)]' 
                : 'border-zinc-800/80 bg-zinc-900/20 hover:border-zinc-700'
            }`}
          >
            <div className="text-xl mb-2 filter drop-shadow-md">📊</div>
            <h3 className="font-bold text-sm tracking-wide text-white mb-1">Standard ATS Score Matrix</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Target a structured industry field. The engine will score your profile and provide strategic parameter optimizations.
            </p>
            {mode === 'ats' && <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full pointer-events-none" />}
          </button>

          <button
            onClick={() => { setMode('jd'); setResult(null) }}
            className={`p-5 rounded-2xl border text-left transition-all duration-300 backdrop-blur-md relative overflow-hidden group ${
              mode === 'jd' 
                ? 'border-purple-500/80 bg-purple-500/[0.04] shadow-[0_0_20px_rgba(168,85,247,0.08)]' 
                : 'border-zinc-800/80 bg-zinc-900/20 hover:border-zinc-700'
            }`}
          >
            <div className="text-xl mb-2 filter drop-shadow-md">🎯</div>
            <h3 className="font-bold text-sm tracking-wide text-white mb-1">Direct JD Match Pipeline</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Paste clear corporate criteria. The processor detects missing keywords and generates targeted resume components.
            </p>
            {mode === 'jd' && <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-bl-full pointer-events-none" />}
          </button>
        </div>

        {/* File Parser Sandbox Component */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
          <label className="block w-full border border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl p-6 text-center cursor-pointer bg-zinc-950/40 transition-all group">
            <div className="text-3xl mb-2 transition-transform duration-200 group-hover:-translate-y-0.5">📎</div>
            <p className="text-zinc-200 font-semibold text-sm mb-0.5 max-w-md mx-auto truncate">
              {fileName || 'Upload Structural Document Profile'}
            </p>
            <p className="text-zinc-500 text-xs font-mono">PDF, DOCX formats — Upper limit threshold 5MB</p>
            <input type="file" accept=".pdf,.docx" onChange={handleFileUpload} className="hidden" />
          </label>
          
          {resumeText && (
            <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <p className="text-emerald-400 text-xs font-medium tracking-wide">
                Stream Parsed Successfully Matrix Layer: <span className="font-mono text-zinc-300 font-bold ml-1">{resumeText.length} parameters</span>
              </p>
            </div>
          )}
        </div>

        {/* ATS Mode — Dynamic Grid Index */}
        {mode === 'ats' && (
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-4">
            <h2 className="text-sm font-bold text-zinc-300 tracking-wide">Select Targeted Engineering / Business Vector</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {jobRoles.map(role => {
                const isSelected = !isCustom && jobRole === role
                return (
                  <button
                    key={role}
                    onClick={() => { setJobRole(role); setIsCustom(false) }}
                    className={`p-3 rounded-xl border text-xs font-semibold tracking-wide transition-all duration-150 text-left truncate ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-sm' 
                        : 'border-zinc-800/60 bg-zinc-950/20 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    {role}
                  </button>
                )
              })}
              <button
                onClick={() => { setIsCustom(true); setJobRole('') }}
                className={`p-3 rounded-xl border text-xs font-semibold tracking-wide transition-all duration-150 text-left ${
                  isCustom 
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-sm' 
                    : 'border-zinc-800/60 bg-zinc-950/20 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                ✏️ Custom Workspace
              </button>
            </div>

            {isCustom && (
              <div className="pt-2 animate-fadeIn">
                <input
                  type="text"
                  value={customRole}
                  onChange={e => setCustomRole(e.target.value)}
                  placeholder="Allocate parameter e.g., React Native Engineer, Prompt Lead..."
                  className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                />
              </div>
            )}
          </div>
        )}

        {/* JD Mode — Full Content Workspace Area */}
        {mode === 'jd' && (
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-3">
            <div className="flex justify-between items-baseline">
              <h2 className="text-sm font-bold text-zinc-300 tracking-wide">Target Corporate Criteria / JD Text</h2>
              {jobDescription.trim() && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded">
                  {jobDescription.trim().split(/\s+/).length} Words Loaded
                </span>
              )}
            </div>
            <textarea
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              placeholder="Paste raw data specifications pulled from source tracking platforms..."
              rows={7}
              className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none transition-all duration-200"
            />
          </div>
        )}

        {/* Global Action Engine Execution Bar */}
        <button
          onClick={handleAnalyze}
          disabled={!canAnalyze || loading}
          className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-xl disabled:opacity-40 disabled:pointer-events-none hover:scale-[1.005] active:scale-[0.995] ${
            mode === 'jd' 
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/5' 
              : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-blue-500/5'
          }`}
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

        {/* Loading Spinner Block alternative layout fallback handles */}
        {loading && (
          <div className="text-center py-6 bg-zinc-900/20 border border-zinc-800/40 rounded-2xl animate-pulse">
            <p className="text-xs font-mono text-zinc-500 tracking-wider uppercase">Evaluating text hierarchies & structural tokens...</p>
          </div>
        )}

        {/* Complete Metrics Processing Result Output Wrapper Dashboard */}
        {result && (
          <div className="space-y-6 pt-2 animate-fadeIn">

            {/* Score Summary Core Display Plate */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 md:p-8 text-center backdrop-blur-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none" />
              <div className="text-6xl font-black tracking-tighter bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent mb-1">
                {result.atsScore}
              </div>
              <div className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase mb-4">
                {mode === 'jd' ? 'Matching Threshold Index / 100' : 'Global Vector Compliance Rating / 100'}
              </div>
              <div className={`text-xl font-extrabold tracking-tight ${getVerdictColor(result.verdict)}`}>
                {result.verdict === 'Excellent' && '🌟 Pristine Alignment Metrics'}
                {result.verdict === 'Good' && '✅ Solid Candidate Configuration'}
                {result.verdict === 'Average' && '⚠️ Variance Drift Present'}
                {result.verdict === 'Poor' && '❌ Structural Deficit Detected'}
              </div>
            </div>

            {/* Sub-Section Performance Indicators — ATS mode exclusive */}
            {mode === 'ats' && result.sections && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-4">
                <h2 className="text-sm font-bold text-zinc-300 tracking-wide">Internal Category Metrics</h2>
                <div className="space-y-3.5">
                  {Object.entries(result.sections).map(([key, score]: any) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between items-baseline font-mono text-xs">
                        <span className="text-zinc-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-zinc-200 font-bold">{score} / 100</span>
                      </div>
                      <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden p-[1px] border border-zinc-800/40">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${getScoreColor(score)}`} 
                          style={{ width: `${score}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Direct Recommendations Field Block — JD mode exclusive */}
            {mode === 'jd' && result.toAdd && (
              <div className="bg-zinc-900/40 border border-purple-900/40 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-4">
                <h2 className="text-sm font-bold text-purple-400 tracking-wide">🚀 Missing Parameters (Append for Selection)</h2>
                <div className="space-y-2.5">
                  {result.toAdd.map((item: string, i: number) => (
                    <div key={i} className="flex gap-3 p-3 bg-purple-500/[0.03] border border-purple-500/10 rounded-xl items-start">
                      <span className="text-purple-400 font-mono text-xs font-bold bg-purple-500/10 w-5 h-5 rounded flex items-center justify-center shrink-0">{i + 1}</span>
                      <p className="text-xs text-zinc-300 leading-relaxed pt-0.5">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Keyword Component Extraction Analysis Framework */}
            {result.keywords && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-4">
                <h2 className="text-sm font-bold text-zinc-300 tracking-wide">Lexical Keyword Distribution Analysis</h2>
                
                <div className="space-y-2">
                  <p className="text-[11px] font-bold font-mono tracking-wider text-emerald-400 uppercase">
                    ✓ Found Clusters ({result.keywords.found.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.keywords.found.map((k: string) => (
                      <span key={k} className="px-2.5 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-md text-xs font-medium text-emerald-400">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] font-bold font-mono tracking-wider text-rose-400 uppercase">
                    ✗ Deficit Clusters ({result.keywords.missing.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.keywords.missing.map((k: string) => (
                      <span key={k} className="px-2.5 py-1 bg-rose-500/5 border border-rose-500/10 rounded-md text-xs font-medium text-rose-400">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Architectural Profile Strengths vs Improvement Inversions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-900/40 border border-emerald-900/30 rounded-2xl p-5 shadow-xl backdrop-blur-xl space-y-3">
                <h2 className="text-sm font-bold text-emerald-400 tracking-wide">Verified Structural Strengths</h2>
                <ul className="space-y-2">
                  {result.strengths.map((s: string, i: number) => (
                    <li key={i} className="text-xs text-zinc-300 flex gap-2 items-start leading-relaxed">
                      <span className="text-emerald-500 text-xs shrink-0">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-zinc-900/40 border border-rose-900/30 rounded-2xl p-5 shadow-xl backdrop-blur-xl space-y-3">
                <h2 className="text-sm font-bold text-rose-400 tracking-wide">Actionable Optimization Vectors</h2>
                <ul className="space-y-2">
                  {result.improvements.map((s: string, i: number) => (
                    <li key={i} className="text-xs text-zinc-300 flex gap-2 items-start leading-relaxed">
                      <span className="text-rose-500 text-xs shrink-0">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Alternative Core Vector Recommendations Panel */}
            {result.recommendedRoles && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-3">
                <h2 className="text-sm font-bold text-zinc-300 tracking-wide">Alternative Resonant Career Pathways</h2>
                <div className="flex flex-wrap gap-2">
                  {result.recommendedRoles.map((role: string) => (
                    <span key={role} className="px-3 py-1.5 bg-blue-500/5 border border-blue-500/10 rounded-xl text-xs font-semibold text-blue-400">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Card Action Controls Footer Layer */}
            <div className="flex flex-col sm:flex-row gap-3 pb-12">
              <button 
                onClick={handleReset}
                className="flex-1 py-3 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-white transition-all shadow-md"
              >
                🔄 Purge Metrics & Re-Analyze Data
              </button>
              <a 
                href="/dashboard" 
                className="flex-1 py-3 text-xs font-bold bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-center transition-all"
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