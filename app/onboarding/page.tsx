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

  // Edit mode: existing profile data pre-fill
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
    <div className="min-h-screen w-full bg-[#09090b] text-zinc-100 flex items-center justify-center p-4 md:p-8 selection:bg-blue-500/30 selection:text-blue-200 antialiased relative overflow-hidden">
      
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 md:p-8 shadow-2xl shadow-black/50 backdrop-blur-xl w-full max-w-lg transition-all duration-300">

        {/* Header Indicators / Edit mode block */}
        <div className="flex items-center justify-between mb-6 min-h-[28px]">
          {isEditMode ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-400 bg-blue-500/10 rounded-full border border-blue-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> Profile Edit Mode
            </span>
          ) : (
            <span className="text-zinc-500 font-mono text-[10px] tracking-widest uppercase">
              Profile Configuration
            </span>
          )}

          {isEditMode && (
            <button
              onClick={() => router.push('/dashboard')}
              className="text-zinc-400 hover:text-white text-xs px-2.5 py-1 rounded-md bg-zinc-800/40 border border-zinc-800 hover:border-zinc-700 transition"
            >
              Cancel
            </button>
          )}
        </div>

        {/* ✅ Tabs / Pill Style Progress Bar Tracker */}
        <div className="flex gap-2 mb-8">
          {steps.map(step => (
            <div
              key={step.id}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                step.id <= currentStep 
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_8px_rgba(59,130,246,0.4)]' 
                  : 'bg-zinc-800/80'
              }`}
            />
          ))}
        </div>

        {/* Step Headings */}
        <div className="space-y-1 mb-6">
          <span className="text-xs font-bold font-mono tracking-wider text-blue-400 uppercase">Step {currentStep} of 4</span>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {steps[currentStep - 1].title}
          </h2>
        </div>

        {/* Step Content Container Blocks */}
        <div className="min-h-[120px] flex flex-col justify-center">
          
          {/* ✅ Step 1 — Input text box built using clean glass style styling */}
          {currentStep === 1 && (
            <div className="w-full">
              <label className="text-[11px] font-semibold text-zinc-400 mb-1.5 block">Your Full Name</label>
              <input
                type="text"
                placeholder="Jaise: Simran Kaur"
                value={formData.full_name}
                onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
              />
            </div>
          )}

          {/* ✅ Step 2 — Custom pill layout select grid with blue highlights */}
          {currentStep === 2 && (
            <div className="grid grid-cols-2 gap-3 w-full">
              {['Student', 'Fresher', 'Working Professional', 'Career Switch'].map(role => {
                const isSelected = formData.role === role
                return (
                  <button
                    key={role}
                    onClick={() => setFormData(prev => ({ ...prev, role }))}
                    className={`py-3 px-4 rounded-xl border text-xs font-semibold tracking-wide transition-all duration-200 text-center ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.1)]'
                        : 'border-zinc-800/80 bg-zinc-900/20 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    {role}
                  </button>
                )
              })}
            </div>
          )}

          {/* ✅ Step 3 — Custom experience pills built with blue border selections */}
          {currentStep === 3 && (
            <div className="grid grid-cols-2 gap-3 w-full">
              {['0-1 years', '1-3 years', '3-5 years', '5+ years'].map(exp => {
                const isSelected = formData.experience === exp
                return (
                  <button
                    key={exp}
                    onClick={() => setFormData(prev => ({ ...prev, experience: exp }))}
                    className={`py-3 px-4 rounded-xl border text-xs font-semibold tracking-wide transition-all duration-200 text-center ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.1)]'
                        : 'border-zinc-800/80 bg-zinc-900/20 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    {exp}
                  </button>
                )
              })}
            </div>
          )}

          {/* ✅ Step 4 — Multi-value Dynamic Tag input blocks with layout parameters */}
          {currentStep === 4 && (
            <div className="w-full space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 mb-1.5 block">Target Companies (Max 5)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Jaise: Google, Microsoft..."
                    value={companyInput}
                    onChange={e => setCompanyInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCompany()}
                    className="flex-1 bg-zinc-950/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-all duration-200"
                  />
                  <button
                    onClick={addCompany}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs px-4 rounded-xl font-semibold transition"
                  >
                    Add
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                {formData.target_companies.map((company, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-400 px-3 py-1 rounded-md text-xs font-medium border border-blue-500/20"
                  >
                    {company}
                    <button 
                      onClick={() => removeCompany(i)} 
                      className="text-blue-400 hover:text-white font-bold text-sm leading-none transition-colors ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Action Buttons Container Group */}
        <div className="flex gap-3 mt-8 pt-4 border-t border-zinc-800/40">
          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="flex-1 py-3 text-xs font-bold text-zinc-400 border border-zinc-800 rounded-xl hover:bg-zinc-900/60 hover:text-white transition-all"
            >
              Back
            </button>
          )}
          
          {currentStep < 4 ? (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={currentStep === 1 && !formData.full_name.trim()}
              className="flex-1 py-3 text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/10 active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none"
            >
              Next Step
            </button>
          ) : (
            /* ✅ Save/Submit button styled with matching gradient engine & reactive loader spinner */
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 text-xs font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/10 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
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