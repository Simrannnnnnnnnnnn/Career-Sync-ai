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
    if (score >= 75) return 'bg-green-500'
    if (score >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  function getVerdictColor(verdict: string) {
    if (verdict === 'Excellent') return 'text-green-400'
    if (verdict === 'Good') return 'text-blue-400'
    if (verdict === 'Average') return 'text-yellow-400'
    return 'text-red-400'
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
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-3xl mx-auto">

        <div className="mb-8">
          <a href="/dashboard" className="text-gray-500 hover:text-gray-300 text-sm mb-4 inline-block">← Dashboard</a>
          <h1 className="text-3xl font-bold mb-2">ATS Resume Scorer 📄</h1>
          <p className="text-gray-400">Resume analyze karo — ATS score ya Job Description match</p>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => { setMode('ats'); setResult(null) }}
            className={`p-5 rounded-2xl border-2 text-left transition ${mode === 'ats' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-500'}`}
          >
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-white mb-1">ATS Score</h3>
            <p className="text-xs text-gray-400">Role select karo — AI tera resume score karega aur suggestions dega</p>
          </button>

          <button
            onClick={() => { setMode('jd'); setResult(null) }}
            className={`p-5 rounded-2xl border-2 text-left transition ${mode === 'jd' ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 hover:border-gray-500'}`}
          >
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-semibold text-white mb-1">JD Match</h3>
            <p className="text-xs text-gray-400">Job description paste karo — AI batayega kya add karo hired hone ke liye</p>
          </button>
        </div>

        {/* Resume Upload */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
          <label className="block w-full border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition">
            <div className="text-4xl mb-3">📎</div>
            <p className="text-gray-300 font-medium mb-1">{fileName || 'Resume upload karo'}</p>
            <p className="text-gray-500 text-sm">PDF ya DOCX — max 5MB</p>
            <input type="file" accept=".pdf,.docx" onChange={handleFileUpload} className="hidden" />
          </label>
          {resumeText && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
              <p className="text-green-400 text-sm">✅ Resume parse ho gaya — {resumeText.length} characters</p>
            </div>
          )}
        </div>

        {/* ATS Mode — Role Select */}
        {mode === 'ats' && (
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
            <h2 className="text-lg font-semibold mb-4">Kaunsi role ke liye apply kar rahe ho?</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {jobRoles.map(role => (
                <button
                  key={role}
                  onClick={() => { setJobRole(role); setIsCustom(false) }}
                  className={`p-3 rounded-xl border text-sm font-medium text-left transition ${!isCustom && jobRole === role ? 'border-blue-500 bg-blue-500/20 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}
                >
                  {role}
                </button>
              ))}
              <button
                onClick={() => { setIsCustom(true); setJobRole('') }}
                className={`p-3 rounded-xl border text-sm font-medium text-left transition ${isCustom ? 'border-blue-500 bg-blue-500/20 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}
              >
                ✏️ Other — khud likho
              </button>
            </div>

            {isCustom && (
              <input
                type="text"
                value={customRole}
                onChange={e => setCustomRole(e.target.value)}
                placeholder="e.g. React Native Developer, Prompt Engineer..."
                className="w-full bg-gray-800 text-white text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600"
              />
            )}
          </div>
        )}

        {/* JD Mode — Job Description Input */}
        {mode === 'jd' && (
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
            <h2 className="text-lg font-semibold mb-2">Job Description paste karo</h2>
            <p className="text-gray-500 text-sm mb-4">LinkedIn ya company website se JD copy karke yahan paste karo</p>
            <textarea
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={8}
              className="w-full bg-gray-800 text-white text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 resize-none placeholder-gray-600"
            />
            {jobDescription.trim() && (
              <p className="text-xs text-gray-500 mt-2">✅ {jobDescription.trim().split(' ').length} words</p>
            )}
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={!canAnalyze || loading}
          className={`w-full py-4 rounded-xl font-semibold text-lg transition disabled:opacity-40 disabled:cursor-not-allowed mb-8 ${mode === 'jd' ? 'bg-purple-500 hover:bg-purple-600' : 'bg-blue-500 hover:bg-blue-600'}`}
        >
          {loading ? '🔍 Analyzing...' : mode === 'jd' ? '🎯 JD se Match Karo' : '🚀 ATS Score Nikalo'}
        </button>

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <div className="flex justify-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce" />
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce delay-100" />
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce delay-200" />
            </div>
            <p className="text-gray-400">AI tera resume analyze kar raha hai...</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-6">

            {/* Score + Verdict */}
            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
              <div className="text-7xl font-bold mb-2">{result.atsScore}</div>
              <div className="text-gray-400 text-sm mb-4">
                {mode === 'jd' ? 'JD Match Score / 100' : 'ATS Score / 100'}
              </div>
              <div className={`text-2xl font-bold ${getVerdictColor(result.verdict)}`}>
                {result.verdict === 'Excellent' && '🌟 Excellent!'}
                {result.verdict === 'Good' && '✅ Good Match'}
                {result.verdict === 'Average' && '⚠️ Average Match'}
                {result.verdict === 'Poor' && '❌ Needs Major Work'}
              </div>
            </div>

            {/* Section Scores — ATS mode only */}
            {mode === 'ats' && result.sections && (
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <h2 className="text-lg font-semibold mb-5">Section Scores</h2>
                <div className="space-y-4">
                  {Object.entries(result.sections).map(([key, score]: any) => (
                    <div key={key}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-sm font-medium">{score}/100</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${getScoreColor(score)}`} style={{ width: `${score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* JD Mode — What to Add */}
            {mode === 'jd' && result.toAdd && (
              <div className="bg-gray-900 rounded-2xl p-6 border border-purple-900">
                <h2 className="text-lg font-semibold mb-4 text-purple-400">🚀 Yeh Add Karo — Hired Ho Jaoge</h2>
                <div className="space-y-3">
                  {result.toAdd.map((item: string, i: number) => (
                    <div key={i} className="flex gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                      <span className="text-purple-400 font-bold min-w-fit">{i + 1}.</span>
                      <p className="text-sm text-gray-300">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Keywords */}
            {result.keywords && (
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <h2 className="text-lg font-semibold mb-4">Keywords Analysis</h2>
                <div className="mb-4">
                  <p className="text-sm text-green-400 mb-2">✅ Found ({result.keywords.found.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {result.keywords.found.map((k: string) => (
                      <span key={k} className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-xs text-green-300">{k}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-red-400 mb-2">❌ Missing ({result.keywords.missing.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {result.keywords.missing.map((k: string) => (
                      <span key={k} className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-xs text-red-300">{k}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Strengths + Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-900 rounded-2xl p-6 border border-green-900">
                <h2 className="text-lg font-semibold mb-4 text-green-400">✅ Strengths</h2>
                <ul className="space-y-2">
                  {result.strengths.map((s: string, i: number) => (
                    <li key={i} className="text-sm text-gray-300 flex gap-2">
                      <span className="text-green-500 mt-0.5">•</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gray-900 rounded-2xl p-6 border border-red-900">
                <h2 className="text-lg font-semibold mb-4 text-red-400">🔧 Improve Karo</h2>
                <ul className="space-y-2">
                  {result.improvements.map((s: string, i: number) => (
                    <li key={i} className="text-sm text-gray-300 flex gap-2">
                      <span className="text-red-500 mt-0.5">•</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommended Roles */}
            {result.recommendedRoles && (
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <h2 className="text-lg font-semibold mb-4">🎯 Recommended Roles</h2>
                <div className="flex flex-wrap gap-3">
                  {result.recommendedRoles.map((role: string) => (
                    <span key={role} className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-xl text-sm text-blue-300">{role}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pb-8">
              <button onClick={handleReset}
                className="flex-1 py-4 rounded-xl bg-blue-500 hover:bg-blue-600 font-semibold transition">
                🔄 Dobara Analyze Karo
              </button>
              <a href="/dashboard" className="flex-1 py-4 rounded-xl border border-gray-700 hover:border-gray-500 text-gray-300 font-semibold text-center transition">
                🏠 Dashboard
              </a>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}