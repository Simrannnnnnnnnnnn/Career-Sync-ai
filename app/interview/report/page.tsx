'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface QuestionFeedback {
  question: string
  answerSummary: string
  feedback: string
}

interface Report {
  overallScore: number
  verdict: 'Ready' | 'Needs Practice' | 'Not Ready'
  technicalScore: number
  communicationScore: number
  confidenceScore: number
  strengths: string[]
  improvements: string[]
  questionFeedback: QuestionFeedback[]
  overallFeedback: string
}

function CircleScore({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const filled = (score / 100) * circ
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width={72} height={72} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={36} cy={36} r={r} fill="none" stroke="var(--border)" strokeWidth={5} />
        <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
        <text x={36} y={40} textAnchor="middle"
          style={{ fill: 'var(--text-primary)', fontSize: 14, fontWeight: 700, transform: 'rotate(90deg)', transformOrigin: '36px 36px' }}>
          {score}
        </text>
      </svg>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
    </div>
  )
}

function ReportInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const role       = searchParams.get('role')       || ''
  const round      = searchParams.get('round')      || ''
  const difficulty = searchParams.get('difficulty') || ''

  const [report,    setReport]    = useState<Report | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [expandedQ, setExpandedQ] = useState<number | null>(null)
  const [saved,     setSaved]     = useState(false)

  // Save to Supabase
  async function saveToSupabase(r: Report, durationSeconds: number) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('interviews').insert({
        user_id:             user.id,
        role,
        round,
        difficulty,
        overall_score:       r.overallScore,
        verdict:             r.verdict,
        technical_score:     r.technicalScore,
        communication_score: r.communicationScore,
        confidence_score:    r.confidenceScore,
        duration_seconds:    durationSeconds,
      })

      if (!error) setSaved(true)
    } catch (e) {
      console.error('Failed to save interview:', e)
    }
  }

  useEffect(() => {
    async function generateReport() {
      try {
        const raw  = localStorage.getItem('interviewMessages')
        const meta = localStorage.getItem('interviewMeta')

        if (!raw) {
          setError('No interview data found. Please complete an interview session first.')
          setLoading(false)
          return
        }

        const messages        = JSON.parse(raw)
        const metaParsed      = meta ? JSON.parse(meta) : {}
        const durationSeconds = metaParsed.duration || 0

        const res = await fetch('/api/interview/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role, round, difficulty, messages }),
        })
        const data = await res.json()
        if (data.error) {
          setError(data.error)
          setLoading(false)
          return
        }

        setReport(data.report)

        // Save to Supabase
        await saveToSupabase(data.report, durationSeconds)

        // Clean up
        localStorage.removeItem('interviewMessages')
        localStorage.removeItem('interviewMeta')

      } catch {
        setError('Failed to generate report. Please try again.')
      }
      setLoading(false)
    }

    generateReport()
  }, [])

  const verdictColor = report?.verdict === 'Ready' ? 'var(--accent)' : report?.verdict === 'Needs Practice' ? 'var(--amber)' : 'var(--coral)'
  const verdictBg    = report?.verdict === 'Ready' ? 'var(--accent-bg)' : report?.verdict === 'Needs Practice' ? 'var(--amber-bg)' : 'var(--coral-bg)'
  const roundLabel   = round === 'hr' ? 'HR' : round === 'technical' ? 'Technical' : 'Analytical'
  const diffLabel    = difficulty === 'easy' ? 'Entry Level' : difficulty === 'medium' ? 'Mid Level' : 'Senior Level'

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {[0,1,2].map(i => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', animation: `bounce 0.9s ease-in-out ${i * 0.18}s infinite alternate` }} />)}
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: 0 }}>Analysing your interview performance…</p>
      <style>{`@keyframes bounce { from{transform:translateY(0)} to{transform:translateY(-8px)} }`}</style>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: "'DM Sans', sans-serif", padding: 24 }}>
      <div style={{ fontSize: 48 }}>⚠️</div>
      <h2 style={{ color: 'var(--coral)', fontSize: 20, fontWeight: 700, margin: 0 }}>Report Generation Failed</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0, textAlign: 'center', maxWidth: 360 }}>{error}</p>
      <button onClick={() => router.push('/dashboard')} style={{ marginTop: 8, padding: '12px 28px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
        Back to Dashboard
      </button>
    </div>
  )

  if (!report) return null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: 'var(--text-primary)', padding: '32px 24px 64px', transition: 'background 0.25s ease, color 0.2s ease' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: `linear-gradient(var(--bg-muted) 1px, transparent 1px), linear-gradient(90deg, var(--bg-muted) 1px, transparent 1px)`, backgroundSize: '48px 48px' }} />

      <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 99, border: '1px solid var(--accent-border)', background: 'var(--accent-bg)', marginBottom: 16 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--accent)', textTransform: 'uppercase' }}>Interview Report</span>
          </div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.02em' }}>Performance Analysis</h1>
          <p style={{ color: 'var(--text-faint)', fontSize: 13, margin: 0 }}>
            {role} · {roundLabel} Round · {diffLabel}
          </p>
          {saved && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '4px 12px', borderRadius: 99, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}>
              <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>✓ Saved to your profile</span>
            </div>
          )}
        </div>

        {/* Verdict + Overall Score */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '32px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, boxShadow: 'var(--shadow-card)' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 99, background: verdictBg, border: `1px solid ${verdictColor}`, marginBottom: 12 }}>
              <span style={{ fontSize: 16 }}>{report.verdict === 'Ready' ? '🎉' : report.verdict === 'Needs Practice' ? '📈' : '📚'}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: verdictColor }}>{report.verdict}</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0, maxWidth: 340, lineHeight: 1.6 }}>{report.overallFeedback}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <svg width={100} height={100} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={50} cy={50} r={40} fill="none" stroke="var(--border)" strokeWidth={6} />
              <circle cx={50} cy={50} r={40} fill="none" stroke={verdictColor} strokeWidth={6}
                strokeDasharray={`${(report.overallScore / 100) * 2 * Math.PI * 40} ${2 * Math.PI * 40}`}
                strokeLinecap="round" />
              <text x={50} y={56} textAnchor="middle"
                style={{ fill: 'var(--text-primary)', fontSize: 22, fontWeight: 800, transform: 'rotate(90deg)', transformOrigin: '50px 50px' }}>
                {report.overallScore}
              </text>
            </svg>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Overall</span>
          </div>
        </div>

        {/* Sub Scores */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '28px 32px', marginBottom: 20, display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 20, boxShadow: 'var(--shadow-card)' }}>
          <CircleScore score={report.technicalScore}     label="Technical"     color="var(--indigo)" />
          <CircleScore score={report.communicationScore} label="Communication" color="var(--blue)" />
          <CircleScore score={report.confidenceScore}    label="Confidence"    color="var(--accent)" />
        </div>

        {/* Strengths + Improvements */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-card)', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 18 }}>💪</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Strengths</span>
            </div>
            {report.strengths.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: i < report.strengths.length - 1 ? 12 : 0 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', marginTop: 6, flexShrink: 0 }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0, lineHeight: 1.6 }}>{s}</p>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber)', borderRadius: 'var(--radius-card)', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 18 }}>🎯</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Improve</span>
            </div>
            {report.improvements.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: i < report.improvements.length - 1 ? 12 : 0 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--amber)', marginTop: 6, flexShrink: 0 }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0, lineHeight: 1.6 }}>{s}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Question Feedback */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '28px', marginBottom: 28, boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 18 }}>📝</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Question-by-Question Feedback</span>
          </div>
          {report.questionFeedback.map((qf, i) => (
            <div key={i} style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: i < report.questionFeedback.length - 1 ? 12 : 0 }}>
              <button onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                style={{ width: '100%', padding: '16px 18px', background: 'var(--bg-subtle)', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontFamily: 'inherit' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: 'var(--indigo-bg)', color: 'var(--indigo)', flexShrink: 0, marginTop: 1 }}>Q{i + 1}</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, lineHeight: 1.5 }}>{qf.question}</span>
                </div>
                <span style={{ color: 'var(--text-faint)', fontSize: 16, flexShrink: 0 }}>{expandedQ === i ? '▲' : '▼'}</span>
              </button>
              {expandedQ === i && (
                <div style={{ padding: '0 18px 18px', background: 'var(--bg-muted)' }}>
                  <div style={{ background: 'var(--bg-subtle)', borderRadius: 10, padding: '12px 14px', marginBottom: 10, borderLeft: '2px solid var(--blue)' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--blue)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px' }}>Your Answer</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0, lineHeight: 1.6 }}>{qf.answerSummary}</p>
                  </div>
                  <div style={{ background: 'var(--bg-subtle)', borderRadius: 10, padding: '12px 14px', borderLeft: '2px solid var(--accent)' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px' }}>Feedback</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0, lineHeight: 1.6 }}>{qf.feedback}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/interview/setup')}
            style={{ flex: 1, minWidth: 160, padding: '14px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            🔄 Retake Interview
          </button>
          <button onClick={() => router.push('/dashboard')}
            style={{ flex: 1, minWidth: 160, padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--bg-subtle)', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            🏠 Dashboard
          </button>
        </div>
      </div>
      <style>{`@keyframes bounce { from{transform:translateY(0)} to{transform:translateY(-8px)} } * { box-sizing: border-box; }`}</style>
    </div>
  )
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: 'var(--text-faint)', fontFamily: 'sans-serif' }}>Loading…</div></div>}>
      <ReportInner />
    </Suspense>
  )
}