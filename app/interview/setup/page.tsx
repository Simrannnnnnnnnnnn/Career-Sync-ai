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
  { id: 'embedded', label: 'Embedded Systems Engineer', icon: '🔌', desc: 'C, RTOS, Hardware' },
  { id: 'dba', label: 'Database Administrator', icon: '🗄️', desc: 'SQL, NoSQL, Performance' },
  { id: 'techwriter', label: 'Technical Writer', icon: '✍️', desc: 'Docs, API Guides, Manuals' },
  { id: 'salesengineer', label: 'Sales Engineer', icon: '💼', desc: 'Pre-sales, Demos, Solutions' },
]

const rounds = [
  { id: 'hr', label: 'HR Round', icon: '🤝', desc: 'Behavioural questions, culture fit, and compensation discussion.', tag: 'Culture & Soft Skills' },
  { id: 'technical', label: 'Technical Round', icon: '💻', desc: 'In-depth domain-specific questions based on your role.', tag: 'Domain Knowledge' },
  { id: 'analytical', label: 'Analytical Round', icon: '🧠', desc: 'Case studies, logical reasoning, and structured problem solving.', tag: 'Problem Solving' },
]

const difficulties = [
  { id: 'easy', label: 'Entry Level', badge: '0–1 yrs', icon: '🟢', desc: 'Foundational questions for freshers entering the industry.' },
  { id: 'medium', label: 'Mid Level', badge: '1–3 yrs', icon: '🟡', desc: 'Practical scenarios for professionals with some experience.' },
  { id: 'hard', label: 'Senior Level', badge: '3+ yrs', icon: '🔴', desc: 'Advanced concepts, system design, and leadership questions.' },
]

const stepMeta = [
  { step: 1, label: 'Role', headline: 'What role are you interviewing for?', sub: "We'll tailor every question to match your specific domain and responsibilities." },
  { step: 2, label: 'Round', headline: 'Which interview round is this?', sub: 'Each round has a distinct focus. Pick the one that matches your upcoming session.' },
  { step: 3, label: 'Difficulty', headline: 'Set your experience level.', sub: "This calibrates question complexity so you're challenged just the right amount." },
]

export default function InterviewSetup() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedRound, setSelectedRound] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')
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
    if (currentStep === 2) return selectedRound !== ''
    if (currentStep === 3) return selectedDifficulty !== ''
    return false
  }

  function handleStart() {
    const params = new URLSearchParams({ role: selectedRole, round: selectedRound, difficulty: selectedDifficulty })
    router.push(`/interview/session?${params.toString()}`)
  }

  function handleRoleSelect(id: string) {
    setSelectedRole(id)
    setSearchQuery('')
  }

  return (
    <>
      <style>{`
        .iv-root {
          min-height: 100vh;
          background: var(--bg-base);
          display: flex; align-items: center; justify-content: center;
          padding: clamp(16px, 4vw, 24px) clamp(12px, 3vw, 16px);
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
          transition: background 0.25s ease;
        }
        .iv-glow {
          position: fixed; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse 60% 40% at 50% -10%, var(--accent-bg) 0%, transparent 70%);
        }
        .iv-wrap { width: 100%; max-width: 560px; position: relative; z-index: 1; }

        .iv-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--accent-bg); border: 1px solid var(--accent-border);
          color: var(--accent); font-size: 11px; font-weight: 600;
          letter-spacing: 0.07em; text-transform: uppercase;
          padding: 6px 14px; border-radius: 99px;
        }
        .iv-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); display: inline-block; }

        .iv-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: clamp(24px, 5vw, 40px) clamp(18px, 4vw, 36px) clamp(20px, 4vw, 36px);
          box-shadow: var(--shadow-card);
        }

        /* Step progress */
        .iv-steps { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .iv-step-circle {
          width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 600; flex-shrink: 0;
          transition: all 0.3s;
        }
        .iv-step-line { flex: 1; height: 1px; transition: background 0.3s; }
        .iv-step-labels { display: flex; justify-content: space-between; }
        .iv-step-label { font-size: 11px; transition: color 0.3s; flex: 1; }

        .iv-headline {
          color: var(--text-primary); font-size: clamp(18px, 4.5vw, 22px);
          font-weight: 700; margin: 0 0 8px; line-height: 1.3; letter-spacing: -0.02em;
        }
        .iv-sub { color: var(--text-muted); font-size: 13px; margin: 0; line-height: 1.6; }

        /* Role grid */
        .iv-role-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
          gap: 10px; margin-bottom: 16px;
        }
        .iv-role-tile {
          padding: 14px 16px; border-radius: 12px;
          text-align: left; cursor: pointer; transition: all 0.2s; outline: none;
        }
        .iv-role-icon { font-size: 22px; margin-bottom: 6px; }
        .iv-role-label { font-size: 13px; font-weight: 600; margin-bottom: 3px; }
        .iv-role-desc { font-size: 11px; color: var(--text-muted); }

        /* Search */
        .iv-search-wrap { position: relative; }
        .iv-search-icon {
          position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
          color: var(--text-faint); font-size: 16px; pointer-events: none;
        }
        .iv-search-input {
          width: 100%; padding: 11px 12px 11px 36px; border-radius: 10px;
          border: 1px solid var(--border); background: var(--bg-subtle);
          color: var(--text-primary); font-size: 13px; outline: none;
          box-sizing: border-box; font-family: inherit; transition: border-color 0.2s;
        }
        .iv-search-input:focus { border-color: var(--accent); }
        .iv-search-input::placeholder { color: var(--text-faint); }

        .iv-dropdown {
          margin-top: 6px; background: var(--bg-card);
          border: 1px solid var(--border); border-radius: 12px;
          overflow: hidden; max-height: 220px; overflow-y: auto;
        }
        .iv-dropdown-item {
          width: 100%; padding: 11px 14px; display: flex; align-items: center; gap: 10px;
          border: none; cursor: pointer; text-align: left; outline: none;
          transition: background 0.15s; background: transparent;
        }
        .iv-no-results {
          margin-top: 6px; padding: 12px 14px; background: var(--bg-card);
          border: 1px solid var(--border); border-radius: 10px;
          font-size: 13px; color: var(--text-muted); text-align: center;
        }

        /* Round / Difficulty cards */
        .iv-option-list { display: flex; flex-direction: column; gap: 10px; }
        .iv-option-card {
          padding: 16px 18px; border-radius: 12px;
          text-align: left; cursor: pointer; transition: all 0.2s; outline: none;
          display: flex; align-items: flex-start; gap: 14px;
        }
        .iv-option-icon { font-size: 24px; flex-shrink: 0; margin-top: 2px; }
        .iv-option-title { font-size: 14px; font-weight: 600; }
        .iv-option-desc { margin: 0; font-size: 12px; color: var(--text-muted); line-height: 1.5; }
        .iv-option-tag {
          font-size: 10px; font-weight: 600; letter-spacing: 0.05em;
          padding: 2px 8px; border-radius: 99px; text-transform: uppercase;
        }

        /* Nav buttons */
        .iv-nav { display: flex; gap: 10px; margin-top: 28px; }
        .iv-btn-back {
          flex: 1; padding: 13px 0; border-radius: 12px;
          border: 1px solid var(--border-strong); background: transparent;
          color: var(--text-muted); font-size: 14px; font-weight: 500;
          cursor: pointer; transition: all 0.2s; font-family: inherit;
        }
        .iv-btn-primary {
          flex: 1; padding: 13px 0; border-radius: 12px; border: none;
          color: #fff; font-size: 14px; font-weight: 700;
          transition: all 0.2s; font-family: inherit; letter-spacing: 0.02em;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }

        .iv-footer { text-align: center; color: var(--text-faint); font-size: 11px; margin-top: 20px; }

        /* ── MOBILE ── */
        @media (max-width: 480px) {
          .iv-card { border-radius: 16px; }
          .iv-role-grid { grid-template-columns: 1fr; }
          .iv-role-tile { padding: 12px 14px; }
          .iv-step-circle { width: 24px; height: 24px; font-size: 11px; }
          .iv-headline { font-size: 17px; }
          .iv-option-card { padding: 13px 14px; gap: 10px; }
          .iv-option-icon { font-size: 20px; }
        }
      `}</style>

      <div className="iv-root">
        <div className="iv-glow" />
        <div className="iv-wrap">

          {/* Top badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <span className="iv-badge">
              <span className="iv-badge-dot" />
              AI-Powered Mock Interview
            </span>
          </div>

          {/* Card */}
          <div className="iv-card">

            {/* Step progress */}
            <div style={{ marginBottom: 28 }}>
              <div className="iv-steps">
                {stepMeta.map((s, i) => (
                  <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: i < stepMeta.length - 1 ? 1 : undefined }}>
                    <div
                      className="iv-step-circle"
                      style={{
                        background: s.step < currentStep ? 'var(--accent)' : s.step === currentStep ? 'var(--accent-bg)' : 'var(--bg-subtle)',
                        border: s.step <= currentStep ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
                        color: s.step < currentStep ? '#ffffff' : s.step === currentStep ? 'var(--accent)' : 'var(--text-faint)',
                      }}
                    >
                      {s.step < currentStep ? '✓' : s.step}
                    </div>
                    {i < stepMeta.length - 1 && (
                      <div
                        className="iv-step-line"
                        style={{ background: s.step < currentStep ? 'var(--accent-border)' : 'var(--border)' }}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="iv-step-labels">
                {stepMeta.map(s => (
                  <span
                    key={s.step}
                    className="iv-step-label"
                    style={{
                      color: s.step === currentStep ? 'var(--accent)' : 'var(--text-faint)',
                      fontWeight: s.step === currentStep ? 600 : 400,
                      textAlign: s.step === 1 ? 'left' : s.step === 3 ? 'right' : 'center',
                    }}
                  >
                    {s.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Headline */}
            <div style={{ marginBottom: 24 }}>
              <h1 className="iv-headline">{meta.headline}</h1>
              <p className="iv-sub">{meta.sub}</p>
            </div>

            {/* Step 1 — Role */}
            {currentStep === 1 && (
              <div>
                <div className="iv-role-grid">
                  {roles.map(role => (
                    <button
                      key={role.id}
                      onClick={() => handleRoleSelect(role.id)}
                      className="iv-role-tile"
                      style={{
                        border: selectedRole === role.id ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                        background: selectedRole === role.id ? 'var(--accent-bg)' : 'var(--bg-subtle)',
                      }}
                    >
                      <div className="iv-role-icon">{role.icon}</div>
                      <div className="iv-role-label" style={{ color: selectedRole === role.id ? 'var(--accent)' : 'var(--text-primary)' }}>
                        {role.label}
                      </div>
                      <div className="iv-role-desc">{role.desc}</div>
                    </button>
                  ))}
                </div>

                <div className="iv-search-wrap">
                  <div style={{ position: 'relative' }}>
                    <span className="iv-search-icon">🔍</span>
                    <input
                      type="text"
                      placeholder="Search more roles... e.g. Data Analyst"
                      value={searchQuery}
                      onChange={e => {
                        setSearchQuery(e.target.value)
                        if (selectedRole && !roles.find(r => r.id === selectedRole)) setSelectedRole('')
                      }}
                      className="iv-search-input"
                    />
                  </div>

                  {filteredSearchRoles.length > 0 && (
                    <div className="iv-dropdown">
                      {filteredSearchRoles.map((role, idx) => (
                        <button
                          key={role.id}
                          onClick={() => handleRoleSelect(role.id)}
                          className="iv-dropdown-item"
                          style={{
                            borderBottom: idx < filteredSearchRoles.length - 1 ? '1px solid var(--border)' : 'none',
                            background: selectedRole === role.id ? 'var(--accent-bg)' : 'transparent',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                          onMouseLeave={e => (e.currentTarget.style.background = selectedRole === role.id ? 'var(--accent-bg)' : 'transparent')}
                        >
                          <span style={{ fontSize: 18 }}>{role.icon}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: selectedRole === role.id ? 'var(--accent)' : 'var(--text-primary)' }}>
                              {role.label}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{role.desc}</div>
                          </div>
                          {selectedRole === role.id && <span style={{ marginLeft: 'auto', color: 'var(--accent)', fontSize: 14 }}>✓</span>}
                        </button>
                      ))}
                    </div>
                  )}

                  {searchQuery.trim().length > 0 && filteredSearchRoles.length === 0 && (
                    <div className="iv-no-results">No roles found for "{searchQuery}"</div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2 — Round */}
            {currentStep === 2 && (
              <div className="iv-option-list">
                {rounds.map(round => (
                  <button
                    key={round.id}
                    onClick={() => setSelectedRound(round.id)}
                    className="iv-option-card"
                    style={{
                      border: selectedRound === round.id ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                      background: selectedRound === round.id ? 'var(--accent-bg)' : 'var(--bg-subtle)',
                    }}
                  >
                    <span className="iv-option-icon">{round.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span className="iv-option-title" style={{ color: selectedRound === round.id ? 'var(--accent)' : 'var(--text-primary)' }}>
                          {round.label}
                        </span>
                        <span
                          className="iv-option-tag"
                          style={{
                            background: selectedRound === round.id ? 'var(--accent-bg)' : 'var(--bg-card)',
                            color: selectedRound === round.id ? 'var(--accent)' : 'var(--text-faint)',
                          }}
                        >
                          {round.tag}
                        </span>
                      </div>
                      <p className="iv-option-desc">{round.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Step 3 — Difficulty */}
            {currentStep === 3 && (
              <div className="iv-option-list">
                {difficulties.map(diff => (
                  <button
                    key={diff.id}
                    onClick={() => setSelectedDifficulty(diff.id)}
                    className="iv-option-card"
                    style={{
                      alignItems: 'center',
                      border: selectedDifficulty === diff.id ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                      background: selectedDifficulty === diff.id ? 'var(--accent-bg)' : 'var(--bg-subtle)',
                    }}
                  >
                    <span className="iv-option-icon" style={{ marginTop: 0 }}>{diff.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                        <span className="iv-option-title" style={{ color: selectedDifficulty === diff.id ? 'var(--accent)' : 'var(--text-primary)' }}>
                          {diff.label}
                        </span>
                        <span className="iv-option-tag" style={{ background: 'var(--bg-card)', color: 'var(--text-faint)' }}>
                          {diff.badge}
                        </span>
                      </div>
                      <p className="iv-option-desc">{diff.desc}</p>
                    </div>
                    {selectedDifficulty === diff.id && <span style={{ color: 'var(--accent)', fontSize: 18, flexShrink: 0 }}>✓</span>}
                  </button>
                ))}
              </div>
            )}

            {/* Navigation */}
            <div className="iv-nav">
              {currentStep > 1 && (
                <button onClick={() => setCurrentStep(p => p - 1)} className="iv-btn-back">
                  ← Back
                </button>
              )}
              {currentStep < 3 ? (
                <button
                  onClick={() => setCurrentStep(p => p + 1)}
                  disabled={!canProceed()}
                  className="iv-btn-primary"
                  style={{
                    background: canProceed() ? 'var(--accent)' : 'var(--bg-subtle)',
                    color: canProceed() ? '#fff' : 'var(--text-faint)',
                    cursor: canProceed() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Continue →
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  disabled={!canProceed()}
                  className="iv-btn-primary"
                  style={{
                    background: canProceed() ? 'var(--accent)' : 'var(--bg-subtle)',
                    color: canProceed() ? '#fff' : 'var(--text-faint)',
                    cursor: canProceed() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Launch Interview 🚀
                </button>
              )}
            </div>
          </div>

          <p className="iv-footer">8–10 questions · AI-evaluated · Camera + mic required</p>
        </div>
      </div>
    </>
  )
}