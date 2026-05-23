'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

const COMPANY_TAGS: Record<string, string[]> = {
  frontend: ['Google', 'Meta', 'Netflix', 'Airbnb', 'Flipkart'],
  backend: ['Amazon', 'Microsoft', 'Uber', 'Swiggy', 'Zomato'],
  fullstack: ['Google', 'Infosys', 'TCS', 'Wipro', 'Razorpay'],
  datascience: ['Google', 'Amazon', 'Flipkart', 'Paytm', 'PhonePe'],
  aiml: ['Google', 'Meta', 'OpenAI', 'Microsoft', 'NVIDIA'],
  devops: ['Amazon', 'Microsoft', 'Atlassian', 'HashiCorp', 'Cloudflare'],
  dataengineer: ['Airbnb', 'Uber', 'Spotify', 'LinkedIn', 'Swiggy'],
  cloudarchitect: ['Amazon', 'Microsoft', 'Google', 'IBM', 'Accenture'],
  cybersecurity: ['Palo Alto', 'CrowdStrike', 'Infosys', 'TCS', 'HCL'],
  productmanager: ['Google', 'Meta', 'Flipkart', 'Paytm', 'CRED'],
  dataanalyst: ['Deloitte', 'TCS', 'Infosys', 'Accenture', 'Wipro'],
  default: ['Google', 'TCS', 'Infosys', 'Wipro', 'Amazon'],
}

function getCompanyTags(role: string): string[] {
  const tags = COMPANY_TAGS[role] || COMPANY_TAGS.default
  const shuffled = [...tags].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.floor(Math.random() * 2) + 2)
}

interface StarAnswer {
  situation: string
  task: string
  action: string
  result: string
}

interface ExampleAnswer extends StarAnswer {
  prose: string
}

interface QuestionData {
  question: string
  star: StarAnswer
  example: ExampleAnswer | null
  tips: string[]
  companies: string[]
}

const STAR_CONFIG = [
  { key: 'situation', label: 'S — Situation', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', icon: '🎯' },
  { key: 'task',      label: 'T — Task',      color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)', icon: '📋' },
  { key: 'action',    label: 'A — Action',    color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', icon: '⚡' },
  { key: 'result',    label: 'R — Result',    color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', icon: '🏆' },
]

// ── BreakdownToggle: prose ke neeche S/T/A/R labeled accordion ──
function BreakdownToggle({ example }: { example: ExampleAnswer }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{
      borderRadius: 12, overflow: 'hidden',
      border: open ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.07)',
      transition: 'border 0.2s',
    }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: '100%', padding: '12px 16px',
          background: open ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'background 0.2s',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: open ? '#818cf8' : '#a1a1aa', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🔍</span> Break it down →
        </span>
        <span style={{ fontSize: 11, color: open ? '#818cf8' : '#52525b' }}>
          {open ? '▲ Hide' : '▼ Show S/T/A/R'}
        </span>
      </button>

      {open && (
        <div style={{ padding: '4px 16px 16px', background: 'rgba(99,102,241,0.04)' }}>
          {[
            { key: 'situation', label: 'Situation', color: '#3b82f6', icon: '🎯' },
            { key: 'task',      label: 'Task',      color: '#8b5cf6', icon: '📋' },
            { key: 'action',    label: 'Action',    color: '#10b981', icon: '⚡' },
            { key: 'result',    label: 'Result',    color: '#f59e0b', icon: '🏆' },
          ].map(({ key, label, color, icon }, idx, arr) => (
            <div key={key} style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 13 }}>{icon}</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, color,
                  letterSpacing: '0.08em', textTransform: 'uppercase' as const,
                }}>
                  {label}
                </span>
              </div>
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}22`,
              }}>
                <p style={{ color: '#d4d4d8', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
                  {example[key as keyof StarAnswer]}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MockInner() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const role       = searchParams.get('role')       || ''
  const round      = searchParams.get('round')      || ''
  const difficulty = searchParams.get('difficulty') || ''
  const count      = parseInt(searchParams.get('count') || '10')

  const [currentIndex,  setCurrentIndex]  = useState(0)
  const [questions,     setQuestions]     = useState<QuestionData[]>([])
  const [loading,       setLoading]       = useState(true)
  const [loadingNext,   setLoadingNext]   = useState(false)
  const [showAnswer,    setShowAnswer]    = useState(false)
  const [userAnswer,    setUserAnswer]    = useState('')
  const [savedAnswers,  setSavedAnswers]  = useState<Record<number, string>>({})
  const [done,          setDone]          = useState(false)
  const [expandedStar,  setExpandedStar]  = useState<string | null>(null)
  const [showExample,   setShowExample]   = useState(false)
  const askedRef = useRef<string[]>([])

  const roundLabel = round === 'screening' ? 'Screening Call'
    : round === 'initial' ? 'Initial Interview'
    : round === 'technical' ? 'Technical Round'
    : round === 'final' ? 'Final Round' : round

  const diffLabel = difficulty === 'easy' ? 'Entry Level'
    : difficulty === 'medium' ? 'Mid Level' : 'Senior Level'

  async function fetchQuestion(index: number) {
    if (index === 0) setLoading(true)
    else setLoadingNext(true)

    try {
      const res = await fetch('/api/interview/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, round, difficulty, askedQuestions: askedRef.current }),
      })
      const data = await res.json()

      const question = data.question || 'Tell me about a challenging project you worked on.'
      const star: StarAnswer = data.star || {
        situation: 'Set the context of your story — what was happening and why it mattered.',
        task: 'Explain what YOUR specific responsibility was in this situation.',
        action: 'Walk through the specific steps you took. Be detailed about your thinking and decisions.',
        result: 'Share the outcome. Quantify the impact wherever possible.',
      }
      const example: ExampleAnswer | null = data.example || null
      const tips: string[] = data.tips || [
        'Use specific numbers and metrics in your result',
        'Keep situation + task brief — spend most time on action',
        'Practice out loud before your interview',
      ]

      askedRef.current.push(question)
      const companies = getCompanyTags(role)

      setQuestions(prev => {
        const updated = [...prev]
        updated[index] = { question, star, example, tips, companies }
        return updated
      })
    } catch {
      const fallback: QuestionData = {
        question: 'Tell me about a challenging project you worked on.',
        star: {
          situation: 'Set the context of your story — what was happening and why it mattered.',
          task: 'Explain what YOUR specific responsibility was in this situation.',
          action: 'Walk through the specific steps you took. Be detailed about your thinking and decisions.',
          result: 'Share the outcome. Quantify the impact wherever possible.',
        },
        example: {
          prose: "The project I'm most proud of is our college quiz platform overhaul. It was crashing under exam load — 200+ students affected — because the whole backend was built on SQLite with no session handling. I was the backend lead, so the fix was entirely on me. I migrated to MongoDB Atlas, rewrote the API in Node.js, and added Redis for session caching. The trickiest part was building a submission queue so concurrent requests wouldn't cause data loss. Total: 3 weeks. Result: zero crashes in the next 3 exam cycles, load time down from 8s to 1.5s, and we now comfortably handle 500+ concurrent users.",
          situation: 'Our college quiz platform was crashing during exams — 200+ students affected.',
          task: 'I was the backend lead responsible for fixing the stability and performance issues.',
          action: 'I migrated from SQLite to MongoDB Atlas, added Redis caching, and built a queue for concurrent submissions. The migration took 3 weeks including testing.',
          result: 'Zero crashes in the next 3 exam cycles. Load time dropped from 8s to 1.5s. Now handles 500+ concurrent users.',
        },
        tips: ['Use the STAR method', 'Be specific with numbers', 'Practice out loud'],
        companies: getCompanyTags(role),
      }
      askedRef.current.push(fallback.question)
      setQuestions(prev => { const u = [...prev]; u[index] = fallback; return u })
    }

    setLoading(false)
    setLoadingNext(false)
  }

  useEffect(() => { fetchQuestion(0) }, [])

  function handleNext() {
    if (userAnswer.trim()) setSavedAnswers(p => ({ ...p, [currentIndex]: userAnswer }))
    const next = currentIndex + 1
    if (next >= count) { setDone(true); return }
    setCurrentIndex(next)
    setShowAnswer(false)
    setExpandedStar(null)
    setShowExample(false)
    setUserAnswer(savedAnswers[next] || '')
    if (!questions[next]) fetchQuestion(next)
  }

  function handlePrev() {
    if (currentIndex === 0) return
    if (userAnswer.trim()) setSavedAnswers(p => ({ ...p, [currentIndex]: userAnswer }))
    const prev = currentIndex - 1
    setCurrentIndex(prev)
    setShowAnswer(false)
    setExpandedStar(null)
    setShowExample(false)
    setUserAnswer(savedAnswers[prev] || '')
  }

  const current = questions[currentIndex]
  const progress = ((currentIndex + 1) / count) * 100

  // ── Done screen ──
  if (done) return (
    <div style={{
      minHeight: '100vh', background: '#050507',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 24, padding: 32,
      fontFamily: "'DM Sans', sans-serif", textAlign: 'center',
    }}>
      <div style={{ fontSize: 72 }}>🎉</div>
      <h1 style={{ color: '#f4f4f5', fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>
        Mock Complete!
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, margin: 0, maxWidth: 360, lineHeight: 1.6 }}>
        You completed all {count} questions for <strong style={{ color: '#818cf8' }}>{role}</strong> — {roundLabel}
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
        <button onClick={() => router.push('/interview/mock-setup')}
          style={{
            padding: '14px 28px', borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 0 30px rgba(99,102,241,0.25)',
          }}>🔄 Practice Again</button>
        <button onClick={() => router.push('/dashboard')}
          style={{
            padding: '14px 28px', borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)',
            color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>🏠 Dashboard</button>
      </div>
    </div>
  )

  // ── Main screen ──
  return (
    <div style={{
      minHeight: '100vh', background: '#050507',
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: '#f4f4f5',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `linear-gradient(rgba(99,102,241,0.02) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(99,102,241,0.02) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />

      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(5,5,7,0.96)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '14px 28px',
      }}>
        <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
              borderRadius: 99, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Mock · {roundLabel}
              </span>
            </div>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{role} · {diffLabel}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#818cf8' }}>{currentIndex + 1} / {count}</span>
            <button onClick={() => router.push('/dashboard')}
              style={{
                padding: '6px 14px', borderRadius: 99,
                border: '1px solid rgba(255,255,255,0.08)', background: 'transparent',
                color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              }}>Exit</button>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ maxWidth: 780, margin: '10px auto 0' }}>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: 'linear-gradient(90deg, #6366f1, #818cf8)',
              width: `${progress}%`, transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '32px 24px 80px', position: 'relative', zIndex: 1 }}>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 20 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: '#6366f1', animation: `bounce 0.9s ease-in-out ${i*0.18}s infinite alternate` }} />
              ))}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, margin: 0 }}>Generating your question…</p>
          </div>
        ) : current ? (
          <div>
            {/* ── Question card ── */}
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 22, padding: '32px', marginBottom: 16, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #6366f1, transparent)' }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                  borderRadius: 99, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Question {currentIndex + 1}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {current.companies.map(c => (
                    <span key={c} style={{
                      fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.4)', letterSpacing: '0.04em',
                    }}>🏢 {c}</span>
                  ))}
                </div>
              </div>

              <p style={{ color: '#f4f4f5', fontSize: 21, fontWeight: 600, lineHeight: 1.6, margin: 0, letterSpacing: '-0.01em' }}>
                {current.question}
              </p>
            </div>

            {/* ── Answer toggle ── */}
            <div style={{ marginBottom: 16 }}>
              <button onClick={() => { setShowAnswer(p => !p); setExpandedStar(null); setShowExample(false) }}
                style={{
                  width: '100%', padding: '15px 20px', borderRadius: 16,
                  border: showAnswer ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(255,255,255,0.08)',
                  background: showAnswer ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.02)',
                  color: showAnswer ? '#818cf8' : 'rgba(255,255,255,0.5)',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'all 0.2s',
                }}>
                <span>💡 {showAnswer ? 'Hide Model Answer' : 'Show Detailed STAR Answer + Tips'}</span>
                <span style={{ fontSize: 12 }}>{showAnswer ? '▲' : '▼'}</span>
              </button>

              {showAnswer && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>

                  {/* STAR header */}
                  <div style={{
                    padding: '12px 16px', borderRadius: 12,
                    background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <span style={{ fontSize: 16 }}>⭐</span>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#818cf8', margin: 0 }}>STAR Method Breakdown</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>
                        Click each section to expand — use these as a guide to structure your answer
                      </p>
                    </div>
                  </div>

                  {/* STAR accordion sections */}
                  {STAR_CONFIG.map(({ key, label, color, bg, border, icon }) => {
                    const isOpen = expandedStar === key
                    const text = current.star[key as keyof StarAnswer]
                    return (
                      <div key={key} style={{
                        borderRadius: 14, overflow: 'hidden',
                        border: isOpen ? `1px solid ${border}` : '1px solid rgba(255,255,255,0.07)',
                        transition: 'border 0.2s',
                      }}>
                        <button
                          onClick={() => setExpandedStar(isOpen ? null : key)}
                          style={{
                            width: '100%', padding: '14px 18px',
                            background: isOpen ? bg : 'rgba(255,255,255,0.02)',
                            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', gap: 12,
                            transition: 'background 0.2s',
                          }}
                        >
                          <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                          <span style={{ flex: 1, textAlign: 'left', fontSize: 13, fontWeight: 700, color: isOpen ? color : '#a1a1aa', letterSpacing: '0.02em' }}>
                            {label}
                          </span>
                          <span style={{ fontSize: 12, color: isOpen ? color : '#52525b' }}>{isOpen ? '▲' : '▼'}</span>
                        </button>

                        {isOpen && (
                          <div style={{ padding: '0 18px 18px 18px', background: bg }}>
                            <div style={{ width: '100%', height: 1, background: border, marginBottom: 14 }} />
                            <p style={{ color: '#e4e4e7', fontSize: 14, lineHeight: 1.75, margin: 0 }}>
                              {text}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* ── Example section ── */}
                  {current.example && (
                    <div style={{
                      borderRadius: 14, overflow: 'hidden',
                      border: showExample ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.07)',
                      transition: 'border 0.2s',
                    }}>
                      {/* Toggle header */}
                      <button
                        onClick={() => setShowExample(p => !p)}
                        style={{
                          width: '100%', padding: '14px 18px',
                          background: showExample ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
                          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', gap: 12,
                          transition: 'background 0.2s',
                        }}
                      >
                        <span style={{ fontSize: 18, flexShrink: 0 }}>💬</span>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: showExample ? '#10b981' : '#a1a1aa', letterSpacing: '0.02em' }}>
                            See a Full Example Answer
                          </span>
                          {!showExample && (
                            <span style={{ display: 'block', fontSize: 11, color: '#52525b', marginTop: 2 }}>
                              A real-world sample answer using the STAR structure above
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 12, color: showExample ? '#10b981' : '#52525b' }}>{showExample ? '▲' : '▼'}</span>
                      </button>

                      {/* ── Example content: prose first, then Break it down ── */}
                      {showExample && (
                        <div style={{ padding: '0 18px 20px', background: 'rgba(16,185,129,0.04)' }}>
                          <div style={{ width: '100%', height: 1, background: 'rgba(16,185,129,0.2)', marginBottom: 16 }} />

                          {/* Prose answer */}
                          <p style={{
                            fontSize: 10, fontWeight: 700, color: '#10b981',
                            letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 10px',
                          }}>
                            🎙️ How a strong candidate might answer
                          </p>
                          <div style={{
                            padding: '16px 18px', borderRadius: 12, marginBottom: 14,
                            background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
                          }}>
                            <p style={{
                              color: '#e4e4e7', fontSize: 14, lineHeight: 1.85,
                              margin: 0, fontStyle: 'italic',
                            }}>
                              "{current.example.prose}"
                            </p>
                          </div>

                          {/* Break it down accordion */}
                          <BreakdownToggle example={current.example} />

                          {/* Reminder note */}
                          <div style={{
                            marginTop: 14, padding: '10px 14px', borderRadius: 10,
                            background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
                          }}>
                            <p style={{ fontSize: 12, color: '#6ee7b7', lineHeight: 1.6, margin: 0 }}>
                              💡 <strong>Remember:</strong> This is just a template. Replace with YOUR real experience — the structure is what matters, not copying this example word for word.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tips */}
                  {current.tips?.length > 0 && (
                    <div style={{
                      borderRadius: 14, padding: '18px 20px',
                      background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)',
                    }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 14px' }}>
                        🎯 Tips & Tricks
                      </p>
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {current.tips.map((tip, i) => (
                          <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <span style={{
                              flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
                              background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, fontWeight: 800, color: '#f59e0b',
                            }}>{i + 1}</span>
                            <span style={{ color: '#d4d4d8', fontSize: 13, lineHeight: 1.6 }}>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Your answer ── */}
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: '20px 22px', marginBottom: 20,
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px' }}>
                ✏️ Your Practice Answer <span style={{ color: '#3f3f46', fontWeight: 400 }}>(optional — saved as you move)</span>
              </p>
              <textarea
                value={userAnswer}
                onChange={e => setUserAnswer(e.target.value)}
                placeholder="Type your answer here using the STAR structure — Situation, Task, Action, Result..."
                rows={5}
                style={{
                  width: '100%', background: 'transparent', border: 'none',
                  color: '#e4e4e7', fontSize: 14, lineHeight: 1.7,
                  outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                  boxSizing: 'border-box', padding: 0,
                }}
              />
            </div>

            {/* ── Navigation ── */}
            <div style={{ display: 'flex', gap: 12 }}>
              {currentIndex > 0 && (
                <button onClick={handlePrev}
                  style={{
                    padding: '14px 24px', borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)',
                    color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 500,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>← Prev</button>
              )}
              <button onClick={handleNext} disabled={loadingNext}
                style={{
                  flex: 1, padding: '14px', borderRadius: 14, border: 'none',
                  background: loadingNext ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: loadingNext ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: loadingNext ? 'none' : '0 0 24px rgba(99,102,241,0.2)',
                }}>
                {loadingNext
                  ? <><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'pulse 0.8s infinite', display: 'inline-block' }} />Loading next…</>
                  : currentIndex + 1 >= count ? 'Finish ✓' : 'Next Question →'}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <style>{`
        @keyframes bounce { from{transform:translateY(0)} to{transform:translateY(-6px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        textarea::placeholder { color: rgba(255,255,255,0.15); }
      `}</style>
    </div>
  )
}

export default function MockPage() {
  return (
    <Suspense fallback={<div style={{ background: '#050507', minHeight: '100vh' }} />}>
      <MockInner />
    </Suspense>
  )
}