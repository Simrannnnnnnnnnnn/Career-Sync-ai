'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const steps = [
  { id: 1, title: 'Please Enter Your Good Name' },
  { id: 2, title: 'What is your Current Role?' },
  { id: 3, title: 'Please Enlist your Experience?' },
  { id: 4, title: 'Target Companies?' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    role: '',
    experience: '',
    target_companies: [] as string[],
  })
  const [companyInput, setCompanyInput] = useState('')

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile?.onboarding_complete) {
        setIsEditMode(true)
        setFormData({
          full_name: profile.full_name || '',
          role: profile.role || '',
          experience: profile.experience || '',
          target_companies: profile.target_companies || [],
        })
      }
    }
    loadProfile()
  }, [])

  function addCompany() {
    if (companyInput.trim() && formData.target_companies.length < 5) {
      setFormData(prev => ({
        ...prev,
        target_companies: [...prev.target_companies, companyInput.trim()]
      }))
      setCompanyInput('')
    }
  }

  function removeCompany(index: number) {
    setFormData(prev => ({
      ...prev,
      target_companies: prev.target_companies.filter((_, i) => i !== index)
    }))
  }

  async function handleSubmit() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase.from('profiles').upsert({
        id: user.id,
        ...formData,
        onboarding_complete: true,
      })
    }

    router.push('/dashboard')
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 antialiased relative overflow-hidden"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {/* Ambient background glows */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none -z-10 animate-pulse"
        style={{ background: 'var(--accent-bg)', filter: 'blur(120px)' }}
      />
      <div
        className="absolute bottom-10 right-10 w-72 h-72 rounded-full pointer-events-none -z-10"
        style={{ background: 'var(--purple-bg)', filter: 'blur(100px)' }}
      />

      <div
        className="w-full max-w-lg p-6 md:p-8 transition-all duration-300 animate-in"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* Header Indicators / Edit mode block */}
        <div className="flex items-center justify-between mb-6 min-h-[28px]">
          {isEditMode ? (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full"
              style={{ color: 'var(--accent)', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
              Profile Edit Mode
            </span>
          ) : (
            <span
              className="font-mono text-[10px] tracking-widest uppercase"
              style={{ color: 'var(--text-muted)' }}
            >
              Profile Configuration
            </span>
          )}

          {isEditMode && (
            <button
              onClick={() => router.push('/dashboard')}
              className="text-xs px-2.5 py-1 rounded-md transition"
              style={{ color: 'var(--text-secondary)', background: 'var(--bg-muted)', border: '1px solid var(--border)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-strong)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              Cancel
            </button>
          )}
        </div>

        {/* Progress Bar Tracker */}
        <div className="flex gap-2 mb-8">
          {steps.map(step => (
            <div
              key={step.id}
              className="h-1.5 flex-1 rounded-full transition-all duration-300"
              style={
                step.id <= currentStep
                  ? { background: `linear-gradient(90deg, var(--accent), var(--blue))`, boxShadow: '0 0 8px var(--accent-bg)' }
                  : { background: 'var(--bg-subtle)' }
              }
            />
          ))}
        </div>

        {/* Step Headings */}
        <div className="space-y-1 mb-6">
          <span
            className="text-xs font-bold font-mono tracking-wider uppercase"
            style={{ color: 'var(--accent)' }}
          >
            Step {currentStep} of 4
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {steps[currentStep - 1].title}
          </h2>
        </div>

        {/* Step Content */}
        <div className="min-h-[120px] flex flex-col justify-center">

          {/* Step 1 — Name input */}
          {currentStep === 1 && (
            <div className="w-full">
              <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                Your Full Name
              </label>
              <input
                type="text"
                placeholder="Jaise: Simran Kaur"
                value={formData.full_name}
                onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="w-full rounded-xl px-4 py-3 text-sm transition-all duration-200 focus:outline-none"
                style={{
                  background: 'var(--bg-muted)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-sm)',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = `0 0 0 1px var(--accent)` }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>
          )}

          {/* Step 2 — Role select */}
          {currentStep === 2 && (
            <div className="grid grid-cols-2 gap-3 w-full">
              {['Student', 'Fresher', 'Working Professional', 'Career Switch'].map(role => {
                const isSelected = formData.role === role
                return (
                  <button
                    key={role}
                    onClick={() => setFormData(prev => ({ ...prev, role }))}
                    className="py-3 px-4 text-xs font-semibold tracking-wide transition-all duration-200 text-center"
                    style={
                      isSelected
                        ? {
                            border: '1px solid var(--accent)',
                            background: 'var(--accent-bg)',
                            color: 'var(--accent)',
                            borderRadius: 'var(--radius-sm)',
                            boxShadow: '0 0 12px var(--accent-bg)',
                          }
                        : {
                            border: '1px solid var(--border)',
                            background: 'var(--bg-muted)',
                            color: 'var(--text-muted)',
                            borderRadius: 'var(--radius-sm)',
                          }
                    }
                  >
                    {role}
                  </button>
                )
              })}
            </div>
          )}

          {/* Step 3 — Experience select */}
          {currentStep === 3 && (
            <div className="grid grid-cols-2 gap-3 w-full">
              {['0-1 years', '1-3 years', '3-5 years', '5+ years'].map(exp => {
                const isSelected = formData.experience === exp
                return (
                  <button
                    key={exp}
                    onClick={() => setFormData(prev => ({ ...prev, experience: exp }))}
                    className="py-3 px-4 text-xs font-semibold tracking-wide transition-all duration-200 text-center"
                    style={
                      isSelected
                        ? {
                            border: '1px solid var(--accent)',
                            background: 'var(--accent-bg)',
                            color: 'var(--accent)',
                            borderRadius: 'var(--radius-sm)',
                            boxShadow: '0 0 12px var(--accent-bg)',
                          }
                        : {
                            border: '1px solid var(--border)',
                            background: 'var(--bg-muted)',
                            color: 'var(--text-muted)',
                            borderRadius: 'var(--radius-sm)',
                          }
                    }
                  >
                    {exp}
                  </button>
                )
              })}
            </div>
          )}

          {/* Step 4 — Target companies */}
          {currentStep === 4 && (
            <div className="w-full space-y-4">
              <div>
                <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                  Target Companies (Max 5)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Jaise: Google, Microsoft..."
                    value={companyInput}
                    onChange={e => setCompanyInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCompany()}
                    className="flex-1 rounded-xl px-4 py-2.5 text-sm transition-all duration-200 focus:outline-none"
                    style={{
                      background: 'var(--bg-muted)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
                  />
                  <button
                    onClick={addCompany}
                    className="text-xs px-4 font-semibold transition"
                    style={{
                      background: 'var(--bg-subtle)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                {formData.target_companies.map((company, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium"
                    style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
                  >
                    {company}
                    <button
                      onClick={() => removeCompany(i)}
                      className="font-bold text-sm leading-none transition-colors ml-0.5"
                      style={{ color: 'var(--accent)' }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-8 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="flex-1 py-3 text-xs font-bold transition-all"
              style={{
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-muted)'; e.currentTarget.style.color = 'var(--text-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              Back
            </button>
          )}

          {currentStep < 4 ? (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={currentStep === 1 && !formData.full_name.trim()}
              className="flex-1 py-3 text-xs font-bold transition-all duration-200 active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none"
              style={{
                background: `linear-gradient(90deg, var(--accent), var(--blue))`,
                color: '#fff',
                borderRadius: 'var(--radius-sm)',
                boxShadow: '0 4px 14px var(--accent-bg)',
              }}
            >
              Next Step
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 text-xs font-bold transition-all duration-200 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              style={{
                background: 'var(--accent)',
                color: '#fff',
                borderRadius: 'var(--radius-sm)',
                boxShadow: '0 4px 14px var(--accent-bg)',
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Configuring Profile...</span>
                </>
              ) : (
                <span>{isEditMode ? 'Save Changes ✅' : 'Dashboard Pe Jao! 🚀'}</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}