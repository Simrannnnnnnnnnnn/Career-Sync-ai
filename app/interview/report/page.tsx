'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

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
        <circle cx={36} cy={36} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
        <circle
          cx={36} cy={36} r={r} fill="none"
          stroke={color} strokeWidth={5}
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        <text
          x={36} y={40} textAnchor="middle"
          style={{ fill: '#f4f4f5', fontSize: 14, fontWeight: 700, transform: 'rotate(90deg)', transformOrigin: '36px 36px' }}
        >
          {score}
        </text>
      </svg>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
    </div>
  )
}

function ReportInner() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const role       = searchParams.get('role')       || ''
  const round      = searchParams.get('round')      || ''
  const difficulty = searchParams.get('difficulty') || ''

  const [report,    setReport]    = useState<Report | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [expandedQ, setExpandedQ] = useState<number | null>(null)

  useEffect(() => {
    async function generateReport() {
      try {
        // FIX: Use localStorage instead of sessionStorage
        // sessionStorage can be cleared on redirect in some browsers/Vercel deployments
        const raw = localStorage.getItem('interviewMessages')
        if (!raw) {
          setError('No interview data found. Please complete an interview session first.')
          setLoading(false)
          return
        }

        const messages = JSON.parse(raw)

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

        // FIX: Clean up localStorage after successful report generation
        localStorage.removeItem('interviewMessages')
      } catch (e) {
        setError('Failed to generate report. Please try again.')
      }
      setLoading(false)
    }

    generateReport()
  }, [])

  const verdictColor = report?.verdict === 'Ready' ? '#10b981' : report?.verdict === 'Needs Practice' ? '#f59e0b' : '#ef4444'
  const verdictBg    = report?.verdict === 'Ready' ? 'rgba(16,185,129,0.1)' : report?.verdict === 'Needs Practice' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)'
  const roundLabel   = round === 'hr' ? 'HR' : round === 'technical' ? 'Technical' : round === 'screening' ? 'Screening' : round === 'initial' ? 'Initial' : round === 'final' ? 'Final' : 'Analytical'
  const diffLabel    = difficulty === 'easy' ? 'Entry Level' : difficulty === 'medium' ? 'Mid Level' : 'Senior Level'

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#050507',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: '50%', background: '#10b981',
            animation: `bounce 0.9s ease-in-out ${i * 0.18}s infinite alternate`,
          }} />
        ))}
      </div>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, margin: 0 }}>Analysing your interview performance…</p>
      <style>{`@keyframes bounce { from{transform:translateY(0)} to{transform:translateY(-8px)} }`}</style>
    </div>
  )

  if (error) return (
    <div style={{
      minHeight: '100vh', background: '#050507',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
      fontFamily: "'DM Sans', sans-serif", padding: 24,
    }}>
      <div style={{ fontSize: 48 }}>⚠️</div>
      <h2 style={{ color: '#ef4444', fontSize: 20, fontWeight: 700, margin: 0 }}>Report Generation Failed</h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: 0, textAlign: 'center', maxWidth: 360 }}>{error}</p>
      <button onClick={() => router.push('/dashboard')} style={{
        marginTop: 8, padding: '12px 28px', borderRadius: 12, border: 'none',
        background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
        fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
      }}>Back to Dashboard</button>
    </div>
  )

  if (!report) return null

  return (
    <div style={{
      minHeight: '100vh', background: '#050507',
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: '#f4f4f5',
      padding: '32px 24px 64px',
    }}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `linear-gradient(rgba(16,185,129,0.02) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(16,185,129,0.02) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />

      <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px',
            borderRadius: 99, border: '1px solid rgba(16,185,129,0.3)',
            background: 'rgba(16,185,129,0.06)', marginBottom: 16,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#10b981', textTransform: 'uppercase' }}>
              Interview Report
            </span>
          </div>
          <h1 style={{ color: '#f4f4f5', fontSize: 28, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Performance Analysis
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
            {role} &nbsp;·&nbsp; {roundLabel} Round &nbsp;·&nbsp; {diffLabel}
          </p>
        </div>

        {/* Verdict + Overall Score */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20, padding: '32px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24,
        }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 18px', borderRadius: 99,
              background: verdictBg, border: `1px solid ${verdictColor}40`,
              marginBottom: 12,
            }}>
              <span style={{ fontSize: 16 }}>
                {report.verdict === 'Ready' ? '🎉' : report.verdict === 'Needs Practice' ? '📈' : '📚'}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: verdictColor }}>{report.verdict}</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0, maxWidth: 340, lineHeight: 1.6 }}>
              {report.overallFeedback}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <svg width={100} height={100} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={50} cy={50} r={40} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
              <circle
                cx={50} cy={50} r={40} fill="none"
                stroke={verdictColor} strokeWidth={6}
                strokeDasharray={`${(report.overallScore / 100) * 2 * Math.PI * 40} ${2 * Math.PI * 40}`}
                strokeLinecap="round"
              />
              <text x={50} y={56} textAnchor="middle"
                style={{ fill: '#f4f4f5', fontSize: 22, fontWeight: 800, transform: 'rotate(90deg)', transformOrigin: '50px 50px' }}>
                {report.overallScore}
              </text>
            </svg>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Overall</span>
          </div>
        </div>

        {/* Sub Scores */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20, padding: '28px 32px', marginBottom: 20,
          display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 20,
        }}>
          <CircleScore score={report.technicalScore}      label="Technical"      color="#6366f1" />
          <CircleScore score={report.communicationScore}  label="Communication"  color="#3b82f6" />
          <CircleScore score={report.confidenceScore}     label="Confidence"     color="#10b981" />
        </div>

        {/* Strengths + Improvements */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={{
            background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)',
            borderRadius: 20, padding: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 18 }}>💪</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Strengths</span>
            </div>
            {report.strengths.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: i < report.strengths.length - 1 ? 12 : 0 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', marginTop: 6, flexShrink: 0 }} />
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0, lineHeight: 1.6 }}>{s}</p>
              </div>
            ))}
          </div>
          <div style={{
            background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)',
            borderRadius: 20, padding: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 18 }}>🎯</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Improve</span>
            </div>
            {report.improvements.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: i < report.improvements.length - 1 ? 12 : 0 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', marginTop: 6, flexShrink: 0 }} />
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0, lineHeight: 1.6 }}>{s}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Question Feedback */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20, padding: '28px', marginBottom: 28,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 18 }}>📝</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Question-by-Question Feedback</span>
          </div>

          {report.questionFeedback.map((qf, i) => (
            <div key={i} style={{
              borderRadius: 14, overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.06)',
              marginBottom: i < report.questionFeedback.length - 1 ? 12 : 0,
            }}>
              <button
                onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                style={{
                  width: '100%', padding: '16px 18px', background: 'rgba(255,255,255,0.02)',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  fontFamily: 'inherit',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
                    background: 'rgba(99,102,241,0.12)', color: '#6366f1', flexShrink: 0, marginTop: 1,
                  }}>Q{i + 1}</span>
                  <span style={{ color: '#e4e4e7', fontSize: 13, fontWeight: 600, lineHeight: 1.5 }}>{qf.question}</span>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 16, flexShrink: 0 }}>
                  {expandedQ === i ? '▲' : '▼'}
                </span>
              </button>

              {expandedQ === i && (
                <div style={{ padding: '0 18px 18px', background: 'rgba(0,0,0,0.2)' }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.03)', borderRadius: 10,
                    padding: '12px 14px', marginBottom: 10,
                    borderLeft: '2px solid rgba(59,130,246,0.5)',
                  }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#60a5fa', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px' }}>Your Answer</p>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0, lineHeight: 1.6 }}>{qf.answerSummary}</p>
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.03)', borderRadius: 10,
                    padding: '12px 14px',
                    borderLeft: '2px solid rgba(16,185,129,0.5)',
                  }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#10b981', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px' }}>Feedback</p>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0, lineHeight: 1.6 }}>{qf.feedback}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => router.push('/interview/setup')}
            style={{
              flex: 1, minWidth: 160, padding: '14px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            🔄 Retake Interview
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              flex: 1, minWidth: 160, padding: '14px', borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)',
              color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            🏠 Dashboard
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce { from{transform:translateY(0)} to{transform:translateY(-8px)} }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div style={{ background: '#050507', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'sans-serif' }}>Loading…</div>
      </div>
    }>
      <ReportInner />
    </Suspense>
  )
}