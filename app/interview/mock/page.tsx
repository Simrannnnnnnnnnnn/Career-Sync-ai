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
  mlops: ['Google', 'Amazon', 'Databricks', 'Uber', 'LinkedIn'],
  default: ['Google', 'TCS', 'Infosys', 'Wipro', 'Amazon'],
}

function getCompanyTags(role: string): string[] {
  const tags = COMPANY_TAGS[role] || COMPANY_TAGS.default
  // Pick 2-3 random companies
  const shuffled = [...tags].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.floor(Math.random() * 2) + 2)
}

function MockInner() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const role = searchParams.get('role') || ''
  const round = searchParams.get('round') || ''
  const difficulty = searchParams.get('difficulty') || ''
  const count = parseInt(searchParams.get('count') || '10')

  const [currentIndex, setCurrentIndex] = useState(0)
  const [questions, setQuestions] = useState<{ question: string; modelAnswer: string; companies: string[] }[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingNext, setLoadingNext] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [userAnswer, setUserAnswer] = useState('')
  const [savedAnswers, setSavedAnswers] = useState<Record<number, string>>({})
  const [done, setDone] = useState(false)
  const askedQuestionsRef = useRef<string[]>([])

  const roundLabel = round === 'screening' ? 'Screening Call' : round === 'initial' ? 'Initial Interview' : round === 'technical' ? 'Technical Round' : round === 'final' ? 'Final / Executive Round' : round
  const diffLabel = difficulty === 'easy' ? 'Entry Level' : difficulty === 'medium' ? 'Mid Level' : 'Senior Level'

  async function fetchQuestion(index: number) {
    if (index === 0) setLoading(true)
    else setLoadingNext(true)

    try {
      const askedList = askedQuestionsRef.current.map((q, i) => `${i + 1}. ${q}`).join('\n')
      const systemPrompt = `You are an expert interview question generator for ${role} role interviews.
Generate ONE interview question for a ${round} round at ${difficulty} level.

RULES:
- Return ONLY valid JSON, no markdown, no backticks
- Question must be unique and different from all previously asked questions
- Include a thorough model answer (3-5 sentences)
- Question should be realistic and commonly asked at top tech companies

${askedList ? `Already asked questions (DO NOT repeat):\n${askedList}` : ''}

JSON format:
{
  "question": "<the interview question>",
  "modelAnswer": "<thorough model answer in 3-5 sentences>"
}`

      const res = await fetch('/api/interview/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role, round, difficulty,
          askedQuestions: askedQuestionsRef.current,
        }),
      })
      const data = await res.json()
      let parsed: { question: string; modelAnswer: string } | null = null

      try {
        const raw = data.reply || ''
        const clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
        const firstBrace = clean.indexOf('{')
        const lastBrace = clean.lastIndexOf('}')
        if (firstBrace !== -1 && lastBrace !== -1) {
          parsed = JSON.parse(clean.slice(firstBrace, lastBrace + 1))
        }
      } catch { }

      const question = parsed?.question || data.reply || 'Tell me about a challenging project you worked on.'
      const modelAnswer = parsed?.modelAnswer || 'Focus on the STAR method: describe the Situation, Task, Action you took, and the Result achieved. Be specific with metrics and outcomes.'

      askedQuestionsRef.current.push(question)
      const companies = getCompanyTags(role)

      setQuestions(prev => {
        const updated = [...prev]
        updated[index] = { question, modelAnswer, companies }
        return updated
      })
    } catch {
      const fallback = 'Tell me about yourself and your experience relevant to this role.'
      askedQuestionsRef.current.push(fallback)
      setQuestions(prev => {
        const updated = [...prev]
        updated[index] = {
          question: fallback,
          modelAnswer: 'Give a structured 2-minute overview: who you are, your key skills, relevant experience, and why you are excited about this role.',
          companies: getCompanyTags(role),
        }
        return updated
      })
    }

    setLoading(false)
    setLoadingNext(false)
  }

  useEffect(() => { fetchQuestion(0) }, [])

  function handleNext() {
    if (userAnswer.trim()) {
      setSavedAnswers(prev => ({ ...prev, [currentIndex]: userAnswer }))
    }
    const next = currentIndex + 1
    if (next >= count) { setDone(true); return }
    setCurrentIndex(next)
    setShowAnswer(false)
    setUserAnswer(savedAnswers[next] || '')
    if (!questions[next]) fetchQuestion(next)
  }

  function handlePrev() {
    if (currentIndex === 0) return
    if (userAnswer.trim()) {
      setSavedAnswers(prev => ({ ...prev, [currentIndex]: userAnswer }))
    }
    const prev = currentIndex - 1
    setCurrentIndex(prev)
    setShowAnswer(false)
    setUserAnswer(savedAnswers[prev] || '')
  }

  const current = questions[currentIndex]
  const progress = ((currentIndex + 1) / count) * 100

  // ── Done screen ──
  if (done) return (
    <div style={{
      minHeight: '100vh', background: '#050507',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 24, padding: 32, fontFamily: "'DM Sans', sans-serif", textAlign: 'center',
    }}>
      <div style={{ fontSize: 64 }}>🎉</div>
      <h1 style={{ color: '#f4f4f5', fontSize: 28, fontWeight: 700, margin: 0 }}>Mock Interview Complete!</h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, margin: 0, maxWidth: 360 }}>
        You completed all {count} questions for {role} — {roundLabel}
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => router.push(`/interview/mock-setup?role=${role}&round=${round}&difficulty=${difficulty}`)}
          style={{
            padding: '14px 28px', borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>🔄 Practice Again</button>
        <button onClick={() => router.push('/dashboard')}
          style={{
            padding: '14px 28px', borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)',
            color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>🏠 Dashboard</button>
      </div>
    </div>
  )

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
        background: 'rgba(5,5,7,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '14px 28px',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
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
            <span style={{ fontSize: 13, fontWeight: 700, color: '#818cf8' }}>
              {currentIndex + 1} / {count}
            </span>
            <button onClick={() => router.push('/dashboard')}
              style={{
                padding: '6px 14px', borderRadius: 99,
                border: '1px solid rgba(255,255,255,0.08)', background: 'transparent',
                color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              }}>Exit</button>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ maxWidth: 800, margin: '10px auto 0' }}>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: 'linear-gradient(90deg, #6366f1, #818cf8)',
              width: `${progress}%`, transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px 64px', position: 'relative', zIndex: 1 }}>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 20 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: '#6366f1', animation: `bounce 0.9s ease-in-out ${i*0.18}s infinite alternate` }} />
              ))}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, margin: 0 }}>Generating your question…</p>
          </div>
        ) : current ? (
          <div>
            {/* Question card */}
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 20, padding: '32px', marginBottom: 16, position: 'relative', overflow: 'hidden',
            }}>
              {/* Top accent line */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #6366f1, transparent)' }} />

              {/* Question number + company tags */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                  borderRadius: 99, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Question {currentIndex + 1}
                  </span>
                </div>
                {/* Company tags */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {current.companies.map(company => (
                    <span key={company} style={{
                      fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em',
                    }}>
                      🏢 Asked at {company}
                    </span>
                  ))}
                </div>
              </div>

              {/* Question text */}
              <p style={{ color: '#f4f4f5', fontSize: 20, fontWeight: 500, lineHeight: 1.65, margin: 0, letterSpacing: '-0.01em' }}>
                {current.question}
              </p>
            </div>

            {/* Model Answer */}
            <div style={{ marginBottom: 16 }}>
              <button onClick={() => setShowAnswer(p => !p)}
                style={{
                  width: '100%', padding: '14px 20px', borderRadius: 14,
                  border: showAnswer ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  background: showAnswer ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
                  color: showAnswer ? '#10b981' : 'rgba(255,255,255,0.5)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'all 0.2s',
                }}>
                <span>💡 {showAnswer ? 'Hide Model Answer' : 'Show Model Answer'}</span>
                <span>{showAnswer ? '▲' : '▼'}</span>
              </button>

              {showAnswer && (
                <div style={{
                  marginTop: 8, padding: '20px 22px', borderRadius: 14,
                  background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.12)',
                }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#10b981', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px' }}>
                    ✨ Model Answer
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                    {current.modelAnswer}
                  </p>
                </div>
              )}
            </div>

            {/* Type your answer */}
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: '20px 22px', marginBottom: 20,
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px' }}>
                ✏️ Your Answer (optional)
              </p>
              <textarea
                value={userAnswer}
                onChange={e => setUserAnswer(e.target.value)}
                placeholder="Type your answer here to practice... Your answer is saved as you move between questions."
                rows={4}
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
                }}>
                {loadingNext ? (
                  <>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'pulse 0.8s infinite', display: 'inline-block' }} />
                    Loading next…
                  </>
                ) : currentIndex + 1 >= count ? 'Finish ✓' : 'Next Question →'}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <style>{`
        @keyframes bounce { from{transform:translateY(0)} to{transform:translateY(-6px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        textarea::placeholder { color: rgba(255,255,255,0.2); }
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