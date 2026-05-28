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

// ─── Client-side questionType detection (failsafe) ────────────────────────────
// If AI returns wrong type, we detect from the question text itself
function detectQuestionType(question: string, aiType: string): 'behavioral' | 'technical' {
  const q = question.toLowerCase()

  // Strong behavioral signals — these phrases almost always mean behavioral
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

  // Strong technical signals — these almost always mean technical
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

  // If we detect a clear behavioral signal → behavioral
  if (isBehavioral) return 'behavioral'

  // If we detect a clear technical signal → technical
  if (isTechnical) return 'technical'

  // Otherwise trust what AI returned (with 'technical' as default)
  return (aiType === 'behavioral' || aiType === 'technical') ? aiType as 'behavioral' | 'technical' : 'technical'
}

// ─── Types matching route.ts exactly ─────────────────────────────────────────
interface StarAnswer {
  situation: string
  task: string
  action: string
  result: string
}

interface ActionStep {
  heading: string
  content: string
  bullets?: string[]
}

interface TechnicalModelAnswer {
  situationTask: string
  actionSteps: ActionStep[]
  result: string
  whyItWins: string[]
}

interface QuestionData {
  question: string
  questionType: 'behavioral' | 'technical'
  star: StarAnswer | null
  modelAnswer: TechnicalModelAnswer | null
  tips: string[]
  companies: string[]
}

// ─── STAR section config ──────────────────────────────────────────────────────
const STAR_SECTIONS = [
  {
    key: 'situation' as const,
    label: 'Situation',
    tag: 'S',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.07)',
    border: 'rgba(59,130,246,0.2)',
    tagBg: 'rgba(59,130,246,0.12)',
    icon: '🎯',
    hint: 'Sets the scene — what was the context and what was at stake',
  },
  {
    key: 'task' as const,
    label: 'Task',
    tag: 'T',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.07)',
    border: 'rgba(139,92,246,0.2)',
    tagBg: 'rgba(139,92,246,0.12)',
    icon: '📋',
    hint: 'YOUR specific responsibility — what was on you to own',
  },
  {
    key: 'action' as const,
    label: 'Action',
    tag: 'A',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.07)',
    border: 'rgba(16,185,129,0.2)',
    tagBg: 'rgba(16,185,129,0.12)',
    icon: '⚡',
    hint: 'The core of your answer — what you actually did, step by step',
  },
  {
    key: 'result' as const,
    label: 'Result',
    tag: 'R',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.07)',
    border: 'rgba(245,158,11,0.2)',
    tagBg: 'rgba(245,158,11,0.12)',
    icon: '🏆',
    hint: 'Quantified outcome + the lesson you took forward',
  },
]

// ─── Phase colors for technical action steps ──────────────────────────────────
const PHASE_COLORS = [
  { color: '#6366f1', bg: 'rgba(99,102,241,0.07)', border: 'rgba(99,102,241,0.2)', tagBg: 'rgba(99,102,241,0.12)' },
  { color: '#10b981', bg: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.2)', tagBg: 'rgba(16,185,129,0.12)' },
  { color: '#f59e0b', bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.2)', tagBg: 'rgba(245,158,11,0.12)' },
  { color: '#ec4899', bg: 'rgba(236,72,153,0.07)', border: 'rgba(236,72,153,0.2)', tagBg: 'rgba(236,72,153,0.12)' },
  { color: '#14b8a6', bg: 'rgba(20,184,166,0.07)', border: 'rgba(20,184,166,0.2)', tagBg: 'rgba(20,184,166,0.12)' },
]

// ─── Behavioral Model Answer (STAR accordion) ─────────────────────────────────
function BehavioralAnswer({
  star,
  expandedSection,
  setExpandedSection,
}: {
  star: StarAnswer
  expandedSection: string | null
  setExpandedSection: (k: string | null) => void
}) {
  return (
    <div>
      {/* Header */}
      <div style={{
        borderRadius: '16px 16px 0 0', padding: '14px 20px',
        background: 'rgba(99,102,241,0.08)',
        border: '1px solid rgba(99,102,241,0.2)', borderBottom: 'none',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>⭐</span>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#818cf8', margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            STAR Model Answer
          </p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>
            Inspiration, not a script — adapt it to your own experience
          </p>
        </div>
      </div>

      {/* STAR accordion */}
      <div style={{
        border: '1px solid rgba(99,102,241,0.2)', borderTop: 'none',
        borderRadius: '0 0 16px 16px', overflow: 'hidden',
        background: 'rgba(10,10,20,0.5)',
      }}>
        {STAR_SECTIONS.map((section, idx) => {
          const isOpen = expandedSection === section.key
          const text = star[section.key]
          const paragraphs = text.split('\n\n').filter(Boolean)
          return (
            <div key={section.key} style={{
              borderBottom: idx < STAR_SECTIONS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              <button
                onClick={() => setExpandedSection(isOpen ? null : section.key)}
                style={{
                  width: '100%', padding: '14px 20px',
                  background: isOpen ? section.bg : 'transparent',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 12,
                  transition: 'background 0.2s',
                }}
              >
                <div style={{
                  flexShrink: 0, width: 28, height: 28, borderRadius: 8,
                  background: isOpen ? section.tagBg : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isOpen ? section.border : 'rgba(255,255,255,0.08)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800,
                  color: isOpen ? section.color : 'rgba(255,255,255,0.3)',
                  transition: 'all 0.2s',
                }}>
                  {section.tag}
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: isOpen ? section.color : 'rgba(255,255,255,0.55)', transition: 'color 0.2s' }}>
                    {section.icon} {section.label}
                  </span>
                  {!isOpen && (
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginLeft: 8 }}>
                      {section.hint}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 11, color: isOpen ? section.color : 'rgba(255,255,255,0.2)' }}>
                  {isOpen ? '▲' : '▼'}
                </span>
              </button>

              {isOpen && (
                <div style={{ padding: '0 20px 20px 20px', background: section.bg, borderTop: `1px solid ${section.border}` }}>
                  <div style={{ marginTop: 14, paddingLeft: 12, borderLeft: `2px solid ${section.border}` }}>
                    {paragraphs.map((para, i) => (
                      <p key={i} style={{
                        color: '#e4e4e7', fontSize: 14, lineHeight: 1.85,
                        margin: i < paragraphs.length - 1 ? '0 0 14px 0' : 0,
                      }}>
                        {para.trim()}
                      </p>
                    ))}
                  </div>
                  <p style={{ marginTop: 12, marginBottom: 0, fontSize: 11, color: section.color, opacity: 0.6, fontStyle: 'italic' }}>
                    💬 {section.hint}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Technical Model Answer ───────────────────────────────────────────────────
function TechnicalAnswer({
  modelAnswer,
  expandedPhase,
  setExpandedPhase,
}: {
  modelAnswer: TechnicalModelAnswer
  expandedPhase: number | null
  setExpandedPhase: (n: number | null) => void
}) {
  return (
    <div>
      {/* Header */}
      <div style={{
        borderRadius: '16px 16px 0 0', padding: '14px 20px',
        background: 'rgba(16,185,129,0.07)',
        border: '1px solid rgba(16,185,129,0.2)', borderBottom: 'none',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>🔧</span>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#34d399', margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Technical Model Answer
          </p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>
            A structured breakdown of how a strong candidate would answer this
          </p>
        </div>
      </div>

      <div style={{
        border: '1px solid rgba(16,185,129,0.2)', borderTop: 'none',
        borderRadius: '0 0 16px 16px', overflow: 'hidden',
        background: 'rgba(10,10,20,0.5)',
      }}>

        {/* Context block */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(16,185,129,0.04)' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#34d399', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>
            📌 Context & Ownership
          </p>
          <p style={{ color: '#e4e4e7', fontSize: 14, lineHeight: 1.8, margin: 0 }}>
            {modelAnswer.situationTask}
          </p>
        </div>

        {/* Action Steps — accordion */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0, padding: '14px 20px 10px' }}>
            ⚡ Approach & Steps
          </p>
          {modelAnswer.actionSteps.map((step, idx) => {
            const pc = PHASE_COLORS[idx % PHASE_COLORS.length]
            const isOpen = expandedPhase === idx
            return (
              <div key={idx} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <button
                  onClick={() => setExpandedPhase(isOpen ? null : idx)}
                  style={{
                    width: '100%', padding: '13px 20px',
                    background: isOpen ? pc.bg : 'transparent',
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 12,
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    flexShrink: 0, width: 26, height: 26, borderRadius: 7,
                    background: isOpen ? pc.tagBg : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isOpen ? pc.border : 'rgba(255,255,255,0.08)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800,
                    color: isOpen ? pc.color : 'rgba(255,255,255,0.3)',
                    transition: 'all 0.2s',
                  }}>
                    {idx + 1}
                  </div>
                  <span style={{
                    flex: 1, textAlign: 'left', fontSize: 13, fontWeight: 600,
                    color: isOpen ? pc.color : 'rgba(255,255,255,0.6)',
                    transition: 'color 0.2s',
                  }}>
                    {step.heading}
                  </span>
                  <span style={{ fontSize: 11, color: isOpen ? pc.color : 'rgba(255,255,255,0.2)' }}>
                    {isOpen ? '▲' : '▼'}
                  </span>
                </button>

                {isOpen && (
                  <div style={{ padding: '0 20px 18px 20px', background: pc.bg, borderTop: `1px solid ${pc.border}` }}>
                    <p style={{ color: '#e4e4e7', fontSize: 14, lineHeight: 1.85, margin: '14px 0 0', paddingLeft: 12, borderLeft: `2px solid ${pc.border}` }}>
                      {step.content}
                    </p>
                    {step.bullets && step.bullets.length > 0 && (
                      <ul style={{ margin: '12px 0 0 12px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {step.bullets.map((b, bi) => (
                          <li key={bi} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                            <span style={{ color: pc.color, fontSize: 14, marginTop: 1, flexShrink: 0 }}>▸</span>
                            <span style={{ color: '#a1a1aa', fontSize: 13, lineHeight: 1.6 }}>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Result */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(245,158,11,0.04)' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>
            📊 Result & Impact
          </p>
          <p style={{ color: '#e4e4e7', fontSize: 14, lineHeight: 1.8, margin: 0 }}>
            {modelAnswer.result}
          </p>
        </div>

        {/* Why It Wins */}
        <div style={{ padding: '16px 20px', background: 'rgba(99,102,241,0.04)' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px' }}>
            🏆 Why This Answer Wins
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
            {modelAnswer.whyItWins.map((w, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{
                  flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
                  background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800, color: '#818cf8',
                }}>{i + 1}</span>
                <span style={{ color: '#d4d4d8', fontSize: 13, lineHeight: 1.6 }}>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

// ─── Tips block (shared) ──────────────────────────────────────────────────────
function TipsBlock({ tips }: { tips: string[] }) {
  if (!tips?.length) return null
  return (
    <div style={{
      marginTop: 12, borderRadius: 14, padding: '16px 20px',
      background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)',
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px' }}>
        🎯 Tips for this question
      </p>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tips.map((tip, i) => (
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
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
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
  // For behavioral STAR accordion
  const [expandedSection, setExpandedSection] = useState<string | null>('situation')
  // For technical steps accordion
  const [expandedPhase,   setExpandedPhase]   = useState<number | null>(0)
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

      // ── KEY FIX: Use detectQuestionType to override wrong AI responses ──
      const rawType = data.questionType || 'technical'
      const questionType = detectQuestionType(question, rawType)

      const star: StarAnswer | null           = data.star        || null
      const modelAnswer: TechnicalModelAnswer | null = data.modelAnswer || null
      const tips: string[]                    = data.tips        || []

      askedRef.current.push(question)
      const companies = getCompanyTags(role)
      setQuestions(prev => {
        const updated = [...prev]
        updated[index] = { question, questionType, star, modelAnswer, tips, companies }
        return updated
      })
    } catch {
      askedRef.current.push('Tell me about a challenging project.')
      setQuestions(prev => {
        const u = [...prev]
        u[index] = {
          question: 'Tell me about a challenging project you worked on.',
          questionType: 'behavioral',
          star: null, modelAnswer: null, tips: [],
          companies: getCompanyTags(role),
        }
        return u
      })
    }

    setLoading(false)
    setLoadingNext(false)
  }

  useEffect(() => { fetchQuestion(0) }, [])

  function resetAnswerState() {
    setShowAnswer(false)
    setExpandedSection('situation')
    setExpandedPhase(0)
  }

  function handleNext() {
    if (userAnswer.trim()) setSavedAnswers(p => ({ ...p, [currentIndex]: userAnswer }))
    const next = currentIndex + 1
    if (next >= count) { setDone(true); return }
    setCurrentIndex(next)
    resetAnswerState()
    setUserAnswer(savedAnswers[next] || '')
    if (!questions[next]) fetchQuestion(next)
  }

  function handlePrev() {
    if (currentIndex === 0) return
    if (userAnswer.trim()) setSavedAnswers(p => ({ ...p, [currentIndex]: userAnswer }))
    const prev = currentIndex - 1
    setCurrentIndex(prev)
    resetAnswerState()
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
      <h1 style={{ color: '#f4f4f5', fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>Mock Complete!</h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, margin: 0, maxWidth: 360, lineHeight: 1.6 }}>
        You completed all {count} questions for <strong style={{ color: '#818cf8' }}>{role}</strong> — {roundLabel}
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
        <button onClick={() => router.push('/interview/mock-setup')} style={{
          padding: '14px 28px', borderRadius: 14, border: 'none',
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 0 30px rgba(99,102,241,0.25)',
        }}>🔄 Practice Again</button>
        <button onClick={() => router.push('/dashboard')} style={{
          padding: '14px 28px', borderRadius: 14,
          border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)',
          color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>🏠 Dashboard</button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#050507', fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: '#f4f4f5' }}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `linear-gradient(rgba(99,102,241,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.02) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />

      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(5,5,7,0.96)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '14px 28px',
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
            <button onClick={() => router.push('/dashboard')} style={{
              padding: '6px 14px', borderRadius: 99,
              border: '1px solid rgba(255,255,255,0.08)', background: 'transparent',
              color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
            }}>Exit</button>
          </div>
        </div>
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
            {/* Question card */}
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 22, padding: '32px', marginBottom: 16, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #6366f1, transparent)' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                    borderRadius: 99, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Question {currentIndex + 1}</span>
                  </div>
                  {/* Question type badge */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px',
                    borderRadius: 99,
                    background: current.questionType === 'behavioral' ? 'rgba(139,92,246,0.08)' : 'rgba(16,185,129,0.08)',
                    border: `1px solid ${current.questionType === 'behavioral' ? 'rgba(139,92,246,0.2)' : 'rgba(16,185,129,0.2)'}`,
                  }}>
                    <span style={{ fontSize: 10 }}>{current.questionType === 'behavioral' ? '⭐' : '🔧'}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: current.questionType === 'behavioral' ? '#a78bfa' : '#34d399',
                    }}>
                      {current.questionType === 'behavioral' ? 'Behavioral' : 'Technical'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {current.companies.map(c => (
                    <span key={c} style={{
                      fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.4)',
                    }}>🏢 {c}</span>
                  ))}
                </div>
              </div>
              <p style={{ color: '#f4f4f5', fontSize: 21, fontWeight: 600, lineHeight: 1.6, margin: 0, letterSpacing: '-0.01em' }}>
                {current.question}
              </p>
            </div>

            {/* Answer toggle */}
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={() => {
                  setShowAnswer(p => !p)
                  setExpandedSection('situation')
                  setExpandedPhase(0)
                }}
                style={{
                  width: '100%', padding: '15px 20px', borderRadius: 16,
                  border: showAnswer ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(255,255,255,0.08)',
                  background: showAnswer ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.02)',
                  color: showAnswer ? '#818cf8' : 'rgba(255,255,255,0.5)',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s',
                }}>
                <span>💡 {showAnswer ? 'Hide Model Answer' : 'Show Model Answer'}</span>
                <span style={{ fontSize: 12 }}>{showAnswer ? '▲' : '▼'}</span>
              </button>

              {showAnswer && (
                <div style={{ marginTop: 12 }}>
                  {/* ── Behavioral: STAR accordion ── */}
                  {current.questionType === 'behavioral' && current.star && (
                    <BehavioralAnswer
                      star={current.star}
                      expandedSection={expandedSection}
                      setExpandedSection={setExpandedSection}
                    />
                  )}

                  {/* ── Technical: structured breakdown ── */}
                  {current.questionType === 'technical' && current.modelAnswer && (
                    <TechnicalAnswer
                      modelAnswer={current.modelAnswer}
                      expandedPhase={expandedPhase}
                      setExpandedPhase={setExpandedPhase}
                    />
                  )}

                  {/* ── Fallback: if type detection and data mismatch ── */}
                  {current.questionType === 'technical' && !current.modelAnswer && current.star && (
                    <BehavioralAnswer
                      star={current.star}
                      expandedSection={expandedSection}
                      setExpandedSection={setExpandedSection}
                    />
                  )}
                  {current.questionType === 'behavioral' && !current.star && current.modelAnswer && (
                    <TechnicalAnswer
                      modelAnswer={current.modelAnswer}
                      expandedPhase={expandedPhase}
                      setExpandedPhase={setExpandedPhase}
                    />
                  )}

                  {/* Tips — shown for both types */}
                  <TipsBlock tips={current.tips} />
                </div>
              )}
            </div>

            {/* Your answer */}
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
                placeholder={
                  current.questionType === 'behavioral'
                    ? 'Type your answer using STAR — Situation, Task, Action, Result…'
                    : 'Type your answer — explain your approach, tools used, and outcome…'
                }
                rows={5}
                style={{
                  width: '100%', background: 'transparent', border: 'none',
                  color: '#e4e4e7', fontSize: 14, lineHeight: 1.7,
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
                  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)',
                  color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>← Prev</button>
              )}
              <button onClick={handleNext} disabled={loadingNext} style={{
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