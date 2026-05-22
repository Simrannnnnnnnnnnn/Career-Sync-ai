'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const roles = [
  { id: 'frontend', label: 'Frontend Developer', icon: '🖥️', desc: 'React, CSS, UI/UX' },
  { id: 'backend', label: 'Backend Developer', icon: '⚙️', desc: 'APIs, Databases, Systems' },
  { id: 'fullstack', label: 'Full Stack Developer', icon: '🔧', desc: 'End-to-end development' },
  { id: 'datascience', label: 'Data Scientist', icon: '📊', desc: 'Analytics, ML, Statistics' },
  { id: 'aiml', label: 'AI / ML Engineer', icon: '🤖', desc: 'Models, Pipelines, Research' },
  { id: 'devops', label: 'DevOps Engineer', icon: '☁️', desc: 'CI/CD, Cloud, Infrastructure' },
  { id: 'dataengineer', label: 'Data Engineer', icon: '🔄', desc: 'Pipelines, ETL, Warehousing' },
  { id: 'cloudarchitect', label: 'Cloud Architect', icon: '🏗️', desc: 'AWS, Azure, GCP' },
  { id: 'cybersecurity', label: 'Cybersecurity Analyst', icon: '🔐', desc: 'Threats, Compliance, SOC' },
  { id: 'productmanager', label: 'Product Manager', icon: '🎯', desc: 'Roadmaps, Strategy, Agile' },
]

const allSearchRoles = [
  ...roles,
  { id: 'dataanalyst', label: 'Data Analyst', icon: '📈', desc: 'SQL, Excel, BI Tools' },
  { id: 'mlops', label: 'MLOps Engineer', icon: '⚡', desc: 'Model Deployment, Monitoring' },
  { id: 'nlp', label: 'NLP Engineer', icon: '💬', desc: 'Text, Language Models, BERT' },
  { id: 'computervision', label: 'Computer Vision Engineer', icon: '👁️', desc: 'Image Processing, CNNs' },
  { id: 'blockchain', label: 'Blockchain Developer', icon: '🔗', desc: 'Smart Contracts, Web3' },
  { id: 'mobile', label: 'Mobile Developer', icon: '📱', desc: 'iOS, Android, React Native' },
  { id: 'qa', label: 'QA Engineer', icon: '✅', desc: 'Testing, Automation, Quality' },
  { id: 'sre', label: 'Site Reliability Engineer', icon: '🛠️', desc: 'Uptime, Monitoring, Incident' },
  { id: 'uxdesigner', label: 'UX Designer', icon: '🎨', desc: 'Figma, Research, Prototyping' },
  { id: 'businessanalyst', label: 'Business Analyst', icon: '📋', desc: 'Requirements, Process, Docs' },
  { id: 'scrum', label: 'Scrum Master', icon: '🏃', desc: 'Agile, Ceremonies, Teams' },
  { id: 'dba', label: 'Database Administrator', icon: '🗄️', desc: 'SQL, NoSQL, Performance' },
  { id: 'techwriter', label: 'Technical Writer', icon: '✍️', desc: 'Docs, API Guides, Manuals' },
]

const difficulties = [
  { id: 'easy', label: 'Entry Level', badge: '0–1 yrs', icon: '🟢', desc: 'Foundational questions for freshers entering the industry.' },
  { id: 'medium', label: 'Mid Level', badge: '1–3 yrs', icon: '🟡', desc: 'Practical scenarios for professionals with some experience.' },
  { id: 'hard', label: 'Senior Level', badge: '3+ yrs', icon: '🔴', desc: 'Advanced concepts, system design, and leadership questions.' },
]

const rounds = [
  {
    id: 'screening',
    label: 'Screening Call',
    icon: '📞',
    who: 'Recruiter / HR',
    desc: 'Basic qualifications, salary expectations, and availability check.',
    tag: '15–30 min',
  },
  {
    id: 'initial',
    label: 'Initial Interview',
    icon: '🤝',
    who: 'Hiring Manager',
    desc: 'Deep dive into your skills, past experience, and day-to-day responsibilities.',
    tag: 'Skills & Experience',
  },
  {
    id: 'technical',
    label: 'Technical Round',
    icon: '💻',
    who: 'Tech Lead / Team',
    desc: 'Hard skills, problem-solving, live coding, or take-home assignments.',
    tag: 'Domain Knowledge',
  },
  {
    id: 'final',
    label: 'Final / Executive Round',
    icon: '🏆',
    who: 'Senior Leadership',
    desc: 'Cultural fit, long-term potential, and high-level strategy discussion.',
    tag: 'Culture & Vision',
  },
]

const questionCounts = [
  { id: '10', label: '10 Questions', desc: 'Quick practice session (~15 min)', icon: '⚡' },
  { id: '20', label: '20 Questions', desc: 'Standard mock interview (~30 min)', icon: '🎯' },
  { id: '30', label: '30 Questions', desc: 'Deep practice session (~45 min)', icon: '🔥' },
]

const stepMeta = [
  { step: 1, label: 'Role', headline: 'What role are you preparing for?', sub: "We'll tailor every question to your specific domain." },
  { step: 2, label: 'Level', headline: 'Set your experience level.', sub: 'This calibrates question complexity for you.' },
  { step: 3, label: 'Round', headline: 'Which interview round?', sub: 'Each round has a distinct focus and question style.' },
  { step: 4, label: 'Questions', headline: 'How many questions?', sub: 'Choose based on how much time you have.' },
]

export default function MockSetup() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')
  const [selectedRound, setSelectedRound] = useState('')
  const [selectedCount, setSelectedCount] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const meta = stepMeta[currentStep - 1]

  const filteredSearchRoles = searchQuery.trim().length > 0
    ? allSearchRoles.filter(r =>
        r.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.desc.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  function canProceed() {
    if (currentStep === 1) return selectedRole !== ''
    if (currentStep === 2) return selectedDifficulty !== ''
    if (currentStep === 3) return selectedRound !== ''
    if (currentStep === 4) return selectedCount !== ''
    return false
  }

  function handleStart() {
    const params = new URLSearchParams({
      role: selectedRole,
      round: selectedRound,
      difficulty: selectedDifficulty,
      count: selectedCount,
    })
    router.push(`/interview/mock?${params.toString()}`)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#09090b',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px', fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    }}>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 40% at 50% -10%, rgba(99,102,241,0.08) 0%, transparent 70%)',
      }} />

      <div style={{ width: '100%', maxWidth: 560, position: 'relative', zIndex: 1 }}>

        {/* Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
            color: '#818cf8', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase', padding: '6px 14px', borderRadius: 99,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8', display: 'inline-block' }} />
            Mock Interview Setup
          </span>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: '40px 36px 36px', backdropFilter: 'blur(12px)',
        }}>

          {/* Step progress */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              {stepMeta.map((s, i) => (
                <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: i < stepMeta.length - 1 ? '1' : undefined }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 600, flexShrink: 0, transition: 'all 0.3s',
                    background: s.step < currentStep ? '#818cf8' : s.step === currentStep ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
                    border: s.step === currentStep ? '1.5px solid #818cf8' : s.step < currentStep ? '1.5px solid #818cf8' : '1.5px solid rgba(255,255,255,0.1)',
                    color: s.step <= currentStep ? (s.step < currentStep ? '#fff' : '#818cf8') : 'rgba(255,255,255,0.3)',
                  }}>
                    {s.step < currentStep ? '✓' : s.step}
                  </div>
                  {i < stepMeta.length - 1 && (
                    <div style={{
                      flex: 1, height: 1,
                      background: s.step < currentStep ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)',
                      transition: 'background 0.3s',
                    }} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {stepMeta.map(s => (
                <span key={s.step} style={{
                  fontSize: 11, flex: 1, textAlign: s.step === 1 ? 'left' : s.step === 4 ? 'right' : 'center',
                  color: s.step === currentStep ? '#818cf8' : 'rgba(255,255,255,0.25)',
                  fontWeight: s.step === currentStep ? 600 : 400, transition: 'color 0.3s',
                }}>{s.label}</span>
              ))}
            </div>
          </div>

          {/* Headline */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ color: '#f4f4f5', fontSize: 22, fontWeight: 700, margin: '0 0 8px', lineHeight: 1.3, letterSpacing: '-0.02em' }}>
              {meta.headline}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: 0, lineHeight: 1.6 }}>{meta.sub}</p>
          </div>

          {/* Step 1 — Role */}
          {currentStep === 1 && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 16 }}>
                {roles.map(role => (
                  <button key={role.id} onClick={() => { setSelectedRole(role.id); setSearchQuery('') }}
                    style={{
                      padding: '14px 16px', borderRadius: 12, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', outline: 'none',
                      border: selectedRole === role.id ? '1.5px solid rgba(99,102,241,0.6)' : '1px solid rgba(255,255,255,0.07)',
                      background: selectedRole === role.id ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                    }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{role.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: selectedRole === role.id ? '#818cf8' : '#e4e4e7', marginBottom: 3 }}>{role.label}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{role.desc}</div>
                  </button>
                ))}
              </div>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: 16, pointerEvents: 'none' }}>🔍</span>
                <input type="text" placeholder="Search more roles..." value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); if (selectedRole && !roles.find(r => r.id === selectedRole)) setSelectedRole('') }}
                  style={{
                    width: '100%', padding: '11px 12px 11px 36px', borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
                    color: '#f4f4f5', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                {filteredSearchRoles.length > 0 && (
                  <div style={{ marginTop: 6, background: '#111113', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden', maxHeight: 220, overflowY: 'auto' }}>
                    {filteredSearchRoles.map((role, idx) => (
                      <button key={role.id} onClick={() => { setSelectedRole(role.id); setSearchQuery('') }}
                        style={{
                          width: '100%', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10,
                          border: 'none', borderBottom: idx < filteredSearchRoles.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          background: selectedRole === role.id ? 'rgba(99,102,241,0.08)' : 'transparent',
                          cursor: 'pointer', textAlign: 'left', outline: 'none', fontFamily: 'inherit',
                        }}>
                        <span style={{ fontSize: 18 }}>{role.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: selectedRole === role.id ? '#818cf8' : '#e4e4e7' }}>{role.label}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{role.desc}</div>
                        </div>
                        {selectedRole === role.id && <span style={{ marginLeft: 'auto', color: '#818cf8' }}>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2 — Difficulty */}
          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {difficulties.map(diff => (
                <button key={diff.id} onClick={() => setSelectedDifficulty(diff.id)}
                  style={{
                    padding: '16px 18px', borderRadius: 12, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', outline: 'none',
                    display: 'flex', alignItems: 'center', gap: 14,
                    border: selectedDifficulty === diff.id ? '1.5px solid rgba(99,102,241,0.6)' : '1px solid rgba(255,255,255,0.07)',
                    background: selectedDifficulty === diff.id ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                  }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{diff.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: selectedDifficulty === diff.id ? '#818cf8' : '#e4e4e7' }}>{diff.label}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}>{diff.badge}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{diff.desc}</p>
                  </div>
                  {selectedDifficulty === diff.id && <span style={{ color: '#818cf8', fontSize: 18 }}>✓</span>}
                </button>
              ))}
            </div>
          )}

          {/* Step 3 — Round */}
          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rounds.map(round => (
                <button key={round.id} onClick={() => setSelectedRound(round.id)}
                  style={{
                    padding: '16px 18px', borderRadius: 12, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', outline: 'none',
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                    border: selectedRound === round.id ? '1.5px solid rgba(99,102,241,0.6)' : '1px solid rgba(255,255,255,0.07)',
                    background: selectedRound === round.id ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                  }}>
                  <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{round.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: selectedRound === round.id ? '#818cf8' : '#e4e4e7' }}>{round.label}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.05em',
                        background: selectedRound === round.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)',
                        color: selectedRound === round.id ? '#818cf8' : 'rgba(255,255,255,0.35)',
                      }}>{round.tag}</span>
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>👤 {round.who}</p>
                    <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{round.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 4 — Question Count */}
          {currentStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {questionCounts.map(qc => (
                <button key={qc.id} onClick={() => setSelectedCount(qc.id)}
                  style={{
                    padding: '20px 22px', borderRadius: 12, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', outline: 'none',
                    display: 'flex', alignItems: 'center', gap: 16,
                    border: selectedCount === qc.id ? '1.5px solid rgba(99,102,241,0.6)' : '1px solid rgba(255,255,255,0.07)',
                    background: selectedCount === qc.id ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                  }}>
                  <span style={{ fontSize: 28, flexShrink: 0 }}>{qc.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: selectedCount === qc.id ? '#818cf8' : '#e4e4e7' }}>{qc.label}</p>
                    <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{qc.desc}</p>
                  </div>
                  {selectedCount === qc.id && <span style={{ color: '#818cf8', fontSize: 20 }}>✓</span>}
                </button>
              ))}
            </div>
          )}

          {/* Nav buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
            {currentStep > 1 && (
              <button onClick={() => setCurrentStep(p => p - 1)}
                style={{
                  flex: 1, padding: '13px 0', borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
                  color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>← Back</button>
            )}
            {currentStep < 4 ? (
              <button onClick={() => setCurrentStep(p => p + 1)} disabled={!canProceed()}
                style={{
                  flex: 1, padding: '13px 0', borderRadius: 12, border: 'none',
                  background: canProceed() ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(255,255,255,0.05)',
                  color: canProceed() ? '#fff' : 'rgba(255,255,255,0.2)',
                  fontSize: 14, fontWeight: 600, cursor: canProceed() ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit', letterSpacing: '0.02em',
                }}>Continue →</button>
            ) : (
              <button onClick={handleStart} disabled={!canProceed()}
                style={{
                  flex: 1, padding: '13px 0', borderRadius: 12, border: 'none',
                  background: canProceed() ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(255,255,255,0.05)',
                  color: canProceed() ? '#fff' : 'rgba(255,255,255,0.2)',
                  fontSize: 14, fontWeight: 700, cursor: canProceed() ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit', letterSpacing: '0.02em',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>Start Mock Interview 🚀</button>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 20 }}>
          No camera · No time pressure · AI-powered questions
        </p>
      </div>
    </div>
  )
}
