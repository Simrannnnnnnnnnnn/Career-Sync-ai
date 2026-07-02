'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const STEPS = [
  { id: 1, title: 'Please Enter Your Good Name' },
  { id: 2, title: 'What is your Current Role?' },
  { id: 3, title: 'Please Enlist your Experience?' },
  { id: 4, title: 'Target Companies?' },
  { id: 5, title: 'Links & Portfolio' },
]

// Simple validators — not super strict, just enough to catch obvious junk
const isValidUrl = (val: string) => {
  if (!val) return true // empty is allowed, all fields optional
  try {
    const u = new URL(val)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

const isLinkedinUrl = (val: string) =>
  !val || (isValidUrl(val) && val.includes('linkedin.com'))

const isGithubUrl = (val: string) =>
  !val || (isValidUrl(val) && val.includes('github.com'))

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  const [form, setForm] = useState({
    full_name: '',
    role: '',
    experience: '',
    target_companies: [] as string[],
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    resume_url: '',
  })

  const [companyInput, setCompanyInput] = useState('')
  const [linkErrors, setLinkErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile?.onboarding_complete) {
        setIsEditMode(true)
        setForm({
          full_name: profile.full_name || '',
          role: profile.role || '',
          experience: profile.experience || '',
          target_companies: profile.target_companies || [],
          linkedin_url: profile.linkedin_url || '',
          github_url: profile.github_url || '',
          portfolio_url: profile.portfolio_url || '',
          resume_url: profile.resume_url || '',
        })
      }
    })()
  }, [])

  function addCompany() {
    if (companyInput.trim() && form.target_companies.length < 5) {
      setForm(f => ({ ...f, target_companies: [...f.target_companies, companyInput.trim()] }))
      setCompanyInput('')
    }
  }

  function removeCompany(idx: number) {
    setForm(f => ({ ...f, target_companies: f.target_companies.filter((_, i) => i !== idx) }))
  }

  function validateLinks() {
    const errors: Record<string, string> = {}
    if (!isLinkedinUrl(form.linkedin_url)) errors.linkedin_url = 'Enter a valid LinkedIn URL (e.g. https://linkedin.com/in/yourname)'
    if (!isGithubUrl(form.github_url)) errors.github_url = 'Enter a valid GitHub URL (e.g. https://github.com/yourname)'
    if (!isValidUrl(form.portfolio_url)) errors.portfolio_url = 'Enter a valid URL (must start with https://)'
    if (!isValidUrl(form.resume_url)) errors.resume_url = 'Enter a valid URL (must start with https://)'
    setLinkErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSave() {
    if (!validateLinks()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').upsert({
        id: user.id,
        ...form,
        onboarding_complete: true,
      })
    }
    router.push('/dashboard')
  }

  function handleNext() {
    if (step === 5) {
      if (!validateLinks()) return
    }
    if (step < 5) setStep(s => s + 1)
    else handleSave()
  }

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-zinc-100 flex items-center justify-center p-4 md:p-8 selection:bg-blue-500/30 selection:text-blue-200 antialiased relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 md:p-8 shadow-2xl shadow-black/50 backdrop-blur-xl w-full max-w-lg transition-all duration-300">
        <div className="flex items-center justify-between mb-6 min-h-[28px]">
          {isEditMode ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-400 bg-blue-500/10 rounded-full border border-blue-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> Profile Edit Mode
            </span>
          ) : (
            <span className="text-zinc-500 font-mono text-[10px] tracking-widest uppercase">Profile Configuration</span>
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

        <div className="flex gap-2 mb-8">
          {STEPS.map(s => (
            <div
              key={s.id}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                s.id <= step
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_8px_rgba(59,130,246,0.4)]'
                  : 'bg-zinc-800/80'
              }`}
            />
          ))}
        </div>

        <div className="space-y-1 mb-6">
          <span className="text-xs font-bold font-mono tracking-wider text-blue-400 uppercase">
            Step {step} of {STEPS.length}
          </span>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">{STEPS[step - 1].title}</h2>
        </div>

        <div className="min-h-[120px] flex flex-col justify-center">
          {step === 1 && (
            <div className="w-full">
              <label className="text-[11px] font-semibold text-zinc-400 mb-1.5 block">Your Full Name</label>
              <input
                type="text"
                placeholder="e.g. Simran Kaur"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
              />
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 gap-3 w-full">
              {['Student', 'Fresher', 'Working Professional', 'Career Switch'].map(r => (
                <button
                  key={r}
                  onClick={() => setForm(f => ({ ...f, role: r }))}
                  className={`py-3 px-4 rounded-xl border text-xs font-semibold tracking-wide transition-all duration-200 text-center ${
                    form.role === r
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.1)]'
                      : 'border-zinc-800/80 bg-zinc-900/20 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-2 gap-3 w-full">
              {['0-1 years', '1-3 years', '3-5 years', '5+ years'].map(exp => (
                <button
                  key={exp}
                  onClick={() => setForm(f => ({ ...f, experience: exp }))}
                  className={`py-3 px-4 rounded-xl border text-xs font-semibold tracking-wide transition-all duration-200 text-center ${
                    form.experience === exp
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.1)]'
                      : 'border-zinc-800/80 bg-zinc-900/20 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {exp}
                </button>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="w-full space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 mb-1.5 block">Target Companies (Max 5)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Google, Microsoft..."
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
                {form.target_companies.map((c, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-400 px-3 py-1 rounded-md text-xs font-medium border border-blue-500/20"
                  >
                    {c}
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

          {step === 5 && (
            <div className="w-full space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.86 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 11.01-4.12 2.06 2.06 0 01-.01 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.8 0 0 .78 0 1.75v20.5C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.75V1.75C24 .78 23.2 0 22.22 0z"/></svg>
                  LinkedIn Profile
                </label>
                <input
                  type="text"
                  placeholder="https://linkedin.com/in/yourname"
                  value={form.linkedin_url}
                  onChange={e => setForm(f => ({ ...f, linkedin_url: e.target.value }))}
                  className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-all duration-200"
                />
                {linkErrors.linkedin_url && <p className="text-[11px] text-red-400 mt-1">{linkErrors.linkedin_url}</p>}
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="text-zinc-300"><path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.73-1.54-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.05 11.05 0 015.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .3.2.66.79.55A10.51 10.51 0 0023.5 12c0-6.27-5.23-11.5-11.5-11.5z"/></svg>
                  GitHub Profile
                </label>
                <input
                  type="text"
                  placeholder="https://github.com/yourusername"
                  value={form.github_url}
                  onChange={e => setForm(f => ({ ...f, github_url: e.target.value }))}
                  className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-all duration-200"
                />
                {linkErrors.github_url && <p className="text-[11px] text-red-400 mt-1">{linkErrors.github_url}</p>}
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-400 mb-1.5 block">Portfolio Website</label>
                <input
                  type="text"
                  placeholder="https://yourportfolio.com"
                  value={form.portfolio_url}
                  onChange={e => setForm(f => ({ ...f, portfolio_url: e.target.value }))}
                  className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-all duration-200"
                />
                {linkErrors.portfolio_url && <p className="text-[11px] text-red-400 mt-1">{linkErrors.portfolio_url}</p>}
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-400 mb-1.5 block">Resume Link</label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/... or resume URL"
                  value={form.resume_url}
                  onChange={e => setForm(f => ({ ...f, resume_url: e.target.value }))}
                  className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-all duration-200"
                />
                {linkErrors.resume_url && <p className="text-[11px] text-red-400 mt-1">{linkErrors.resume_url}</p>}
                <p className="text-[10px] text-zinc-500 mt-1">All fields optional — add what you have, skip the rest.</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-8 pt-4 border-t border-zinc-800/40">
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 text-xs font-bold text-zinc-400 border border-zinc-800 rounded-xl hover:bg-zinc-900/60 hover:text-white transition-all"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={(step === 1 && !form.full_name.trim()) || saving}
            className={
              step < 5
                ? 'flex-1 py-3 text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/10 active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none'
                : 'flex-1 py-3 text-xs font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/10 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2'
            }
          >
            {step < 5 ? (
              'Next Step'
            ) : saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Configuring Profile...</span>
              </>
            ) : (
              <span>{isEditMode ? 'Save Changes ✅' : 'Complete Setup 🚀'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}