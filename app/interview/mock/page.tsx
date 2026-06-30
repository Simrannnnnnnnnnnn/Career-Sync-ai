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

function detectQuestionType(question: string, aiType: string): 'behavioral' | 'technical' {
  const q = question.toLowerCase()

  const behavioralPhrases = [
    'tell me about a time',
    'describe a situation',
    'give me an example',
    'have you ever',
    'walk me through a time',
    'share an experience',
    'describe a time',
    'talk about a time',
    'when you had to',
    'when you were',
    'how did you handle',
    'how have you handled',
    'what did you do when',
  ]

  const technicalPhrases = [
    'what is your approach',
    'how would you',
    'how do you',
    'explain how',
    'explain the',
    'what are the',
    'describe how',
    'walk me through how',
    'what is the difference',
    'how does',
    'design a',
    'implement a',
    'write a',
    'what is',
    'why would you',
    'when would you',
  ]

  const isBehavioral = behavioralPhrases.some(p => q.includes(p))
  const isTechnical = technicalPhrases.some(p => q.startsWith(p) || q.includes(p))

  if (isBehavioral) return 'behavioral'
  if (isTechnical) return 'technical'
  return (aiType === 'behavioral' || aiType === 'technical') ? aiType as 'behavioral' | 'technical' : 'technical'
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface QuestionData {
  question: string
  questionType: 'behavioral' | 'technical'
  spokenAnswer: string
  tips: string[]
  companies: string[]
}

// ─── Spoken Answer Component ──────────────────────────────────────────────────
function SpokenAnswer({ answer }: { answer: string }) {
  const paragraphs = answer.split('\n\n').filter(Boolean)

  return (
    <div style={{
      borderRadius: 16,
      overflow: 'hidden',
      border: '1px solid var(--indigo-bg)',
      background: 'var(--bg-subtle)',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px',
        background: 'var(--indigo-bg)',
        borderBottom: '1px solid var(--indigo-bg)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>💬</span>
        <div>
          <p style={{
            fontSize: 12, fontWeight: 700, color: 'var(--indigo)',
            margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            How a Strong Candidate Would Answer
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-faint)', margin: '2px 0 0' }}>
            Use this as inspiration — adapt it to your own experience
          </p>
        </div>
      </div>

      {/* Answer body */}
      <div style={{ padding: '22px 24px' }}>
        <div style={{
          borderLeft: '3px solid var(--indigo)',
          paddingLeft: 18,
        }}>
          {paragraphs.map((para, i) => (
            <p key={i} style={{
              color: 'var(--text-primary)',
              fontSize: 15,
              lineHeight: 1.9,
              margin: i < paragraphs.length - 1 ? '0 0 16px 0' : 0,
              fontStyle: 'italic',
            }}>
              {i === 0 ? `"${para}` : para}
              {i === paragraphs.length - 1 ? '"' : ''}
            </p>
          ))}
        </div>

        {/* Footer note */}
        <div style={{
          marginTop: 18,
          padding: '10px 14px',
          borderRadius: 10,
          background: 'var(--indigo-bg)',
          border: '1px solid var(--indigo-bg)',
        }}>
          <p style={{
            fontSize: 11, color: 'var(--text-muted)',
            margin: 0, lineHeight: 1.6,
          }}>
            💡 <strong style={{ color: 'var(--text-secondary)' }}>Notice:</strong> Real project context, specific tools with reasons, actual numbers, and one honest mistake — that's what makes an answer memorable.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Tips Block ───────────────────────────────────────────────────────────────
function TipsBlock({ tips }: { tips: string[] }) {
  if (!tips?.length) return null
  return (
    <div style={{
      marginTop: 12, borderRadius: 14, padding: '16px 20px',
      background: 'var(--amber-bg)', border: '1px solid var(--amber-bg)',
    }}>
      <p style={{
        fontSize: 11, fontWeight: 700, color: 'var(--amber)',
        letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px',
      }}>
        🎯 Tips for this question
      </p>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tips.map((tip, i) => (
          <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{
              flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
              background: 'var(--amber-bg)', border: '1px solid var(--amber)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 800, color: 'var(--amber)',
            }}>{i + 1}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
function MockInner() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const role       = searchParams.get('role')       || ''
  const round      = searchParams.get('round')      || ''
  const difficulty = searchParams.get('difficulty') || ''
  const count      = parseInt(searchParams.get('count') || '10')

  const [currentIndex, setCurrentIndex] = useState(0)
  const [questions,    setQuestions]    = useState<QuestionData[]>([])
  const [loading,      setLoading]      = useState(true)
  const [loadingNext,  setLoadingNext]  = useState(false)
  const [showAnswer,   setShowAnswer]   = useState(false)
  const [userAnswer,   setUserAnswer]   = useState('')
  const [savedAnswers, setSavedAnswers] = useState<Record<number, string>>({})
  const [done,         setDone]         = useState(false)
  const askedRef = useRef<string[]>([])

  const roundLabel = round === 'screening' ? 'Screening Call'
    : round === 'initial'   ? 'Initial Interview'
    : round === 'technical' ? 'Technical Round'
    : round === 'final'     ? 'Final Round' : round

  const diffLabel = difficulty === 'easy'   ? 'Entry Level'
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

      const question     = data.question     || 'Tell me about a challenging project you worked on.'
      const rawType      = data.questionType || 'technical'
      const questionType = detectQuestionType(question, rawType)
      const spokenAnswer = data.spokenAnswer || ''
      const tips: string[] = data.tips || []

      askedRef.current.push(question)
      const companies = getCompanyTags(role)

      setQuestions(prev => {
        const updated = [...prev]
        updated[index] = { question, questionType, spokenAnswer, tips, companies }
        return updated
      })
    } catch {
      askedRef.current.push('Tell me about a challenging project.')
      setQuestions(prev => {
        const u = [...prev]
        u[index] = {
          question: 'Tell me about a challenging project you worked on.',
          questionType: 'behavioral',
          spokenAnswer: '',
          tips: [],
          companies: getCompanyTags(role),
        }
        return u
      })
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
    setUserAnswer(savedAnswers[next] || '')
    if (!questions[next]) fetchQuestion(next)
  }

  function handlePrev() {
    if (currentIndex === 0) return
    if (userAnswer.trim()) setSavedAnswers(p => ({ ...p, [currentIndex]: userAnswer }))
    const prev = currentIndex - 1
    setCurrentIndex(prev)
    setShowAnswer(false)
    setUserAnswer(savedAnswers[prev] || '')
  }

  const current  = questions[currentIndex]
  const progress = ((currentIndex + 1) / count) * 100

  // ── Done screen ──────────────────────────────────────────────────────────────
  if (done) return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 24, padding: 32,
      fontFamily: "'DM Sans', sans-serif", textAlign: 'center',
    }}>
      <div style={{ fontSize: 72 }}>🎉</div>
      <h1 style={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>
        Mock Complete!
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: 0, maxWidth: 360, lineHeight: 1.6 }}>
        You completed all {count} questions for{' '}
        <strong style={{ color: 'var(--indigo)' }}>{role}</strong> — {roundLabel}
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
        <button onClick={() => router.push('/interview/mock-setup')} style={{
          padding: '14px 28px', borderRadius: 14, border: 'none',
          background: 'var(--indigo)',
          color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}>🔄 Practice Again</button>
        <button onClick={() => router.push('/dashboard')} style={{
          padding: '14px 28px', borderRadius: 14,
          border: '1px solid var(--border-strong)', background: 'var(--bg-subtle)',
          color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>🏠 Dashboard</button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: 'var(--text-primary)', transition: 'background 0.25s ease, color 0.2s ease' }}>

      {/* Grid background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `linear-gradient(var(--bg-muted) 1px, transparent 1px), linear-gradient(90deg, var(--bg-muted) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />

      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--bg-card)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)', padding: '14px 28px',
      }}>
        <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
              borderRadius: 99, background: 'var(--indigo-bg)', border: '1px solid var(--indigo)',
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--indigo)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Mock · {roundLabel}
              </span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{role} · {diffLabel}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--indigo)' }}>{currentIndex + 1} / {count}</span>
            <button onClick={() => router.push('/dashboard')} style={{
              padding: '6px 14px', borderRadius: 99,
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
            }}>Exit</button>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ maxWidth: 780, margin: '10px auto 0' }}>
          <div style={{ height: 3, background: 'var(--bg-subtle)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: 'var(--indigo)',
              width: `${progress}%`, transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '32px 24px 80px', position: 'relative', zIndex: 1 }}>

        {/* Loading state */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 20 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 10, height: 10, borderRadius: '50%', background: 'var(--indigo)',
                  animation: `bounce 0.9s ease-in-out ${i * 0.18}s infinite alternate`,
                }} />
              ))}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>Generating your question…</p>
          </div>

        ) : current ? (
          <div>

            {/* Question card */}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 22, padding: '32px', marginBottom: 16,
              position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-card)',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: 'var(--indigo)',
              }} />

              {/* Badge row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                    borderRadius: 99, background: 'var(--indigo-bg)', border: '1px solid var(--indigo)',
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--indigo)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      Question {currentIndex + 1}
                    </span>
                  </div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px',
                    borderRadius: 99,
                    background: current.questionType === 'behavioral' ? 'var(--purple-bg)' : 'var(--accent-bg)',
                    border: `1px solid ${current.questionType === 'behavioral' ? 'var(--purple)' : 'var(--accent)'}`,
                  }}>
                    <span style={{ fontSize: 10 }}>{current.questionType === 'behavioral' ? '⭐' : '🔧'}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: current.questionType === 'behavioral' ? 'var(--purple)' : 'var(--accent)',
                    }}>
                      {current.questionType === 'behavioral' ? 'Behavioral' : 'Technical'}
                    </span>
                  </div>
                </div>

                {/* Company tags */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {current.companies.map(c => (
                    <span key={c} style={{
                      fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
                      background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                      color: 'var(--text-muted)',
                    }}>🏢 {c}</span>
                  ))}
                </div>
              </div>

              {/* Question text */}
              <p style={{ color: 'var(--text-primary)', fontSize: 21, fontWeight: 600, lineHeight: 1.6, margin: 0, letterSpacing: '-0.01em' }}>
                {current.question}
              </p>
            </div>

            {/* Show / Hide answer toggle */}
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={() => setShowAnswer(p => !p)}
                style={{
                  width: '100%', padding: '15px 20px', borderRadius: 16,
                  border: showAnswer ? '1px solid var(--indigo)' : '1px solid var(--border)',
                  background: showAnswer ? 'var(--indigo-bg)' : 'var(--bg-subtle)',
                  color: showAnswer ? 'var(--indigo)' : 'var(--text-muted)',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'all 0.2s',
                }}>
                <span>💡 {showAnswer ? 'Hide Model Answer' : 'Show Model Answer'}</span>
                <span style={{ fontSize: 12 }}>{showAnswer ? '▲' : '▼'}</span>
              </button>

              {showAnswer && (
                <div style={{ marginTop: 12 }}>
                  {current.spokenAnswer ? (
                    <SpokenAnswer answer={current.spokenAnswer} />
                  ) : (
                    <div style={{
                      borderRadius: 16, padding: '24px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      textAlign: 'center',
                    }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
                        Answer not available for this question.
                      </p>
                    </div>
                  )}
                  <TipsBlock tips={current.tips} />
                </div>
              )}
            </div>

            {/* Your answer textarea */}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 16, padding: '20px 22px', marginBottom: 20,
            }}>
              <p style={{
                fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
                letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px',
              }}>
                ✏️ Your Practice Answer{' '}
                <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(optional — saved as you move)</span>
              </p>
              <textarea
                value={userAnswer}
                onChange={e => setUserAnswer(e.target.value)}
                placeholder={
                  current.questionType === 'behavioral'
                    ? 'Answer naturally — describe the situation, what you did, and the outcome with real details…'
                    : 'Explain your approach with specific tools, numbers, and tradeoffs you actually considered…'
                }
                rows={5}
                style={{
                  width: '100%', background: 'transparent', border: 'none',
                  color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7,
                  outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                  boxSizing: 'border-box', padding: 0,
                }}
              />
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', gap: 12 }}>
              {currentIndex > 0 && (
                <button onClick={handlePrev} style={{
                  padding: '14px 24px', borderRadius: 14,
                  border: '1px solid var(--border)', background: 'var(--bg-subtle)',
                  color: 'var(--text-muted)', fontSize: 14, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>← Prev</button>
              )}
              <button onClick={handleNext} disabled={loadingNext} style={{
                flex: 1, padding: '14px', borderRadius: 14, border: 'none',
                background: loadingNext ? 'var(--indigo-bg)' : 'var(--indigo)',
                color: loadingNext ? 'var(--indigo)' : '#fff', fontSize: 14, fontWeight: 700,
                cursor: loadingNext ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {loadingNext
                  ? <><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', animation: 'pulse 0.8s infinite', display: 'inline-block' }} />Loading next…</>
                  : currentIndex + 1 >= count ? 'Finish ✓' : 'Next Question →'
                }
              </button>
            </div>

          </div>
        ) : null}
      </div>

      <style>{`
        @keyframes bounce { from { transform: translateY(0) } to { transform: translateY(-6px) } }
        @keyframes pulse  { 0%,100% { opacity: 1 } 50% { opacity: 0.3 } }
        textarea::placeholder { color: var(--text-faint); }
      `}</style>
    </div>
  )
}

export default function MockPage() {
  return (
    <Suspense fallback={<div style={{ background: 'var(--bg-base)', minHeight: '100vh' }} />}>
      <MockInner />
    </Suspense>
  )
}