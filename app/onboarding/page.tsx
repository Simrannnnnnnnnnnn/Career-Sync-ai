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

  // Edit mode: existing profile data pre-fill kar do
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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-lg">

        {/* Edit mode indicator */}
        {isEditMode && (
          <div className="flex items-center justify-between mb-6">
            <span className="text-blue-400 text-sm font-medium">✏️ Profile Edit Mode</span>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-500 hover:text-gray-300 text-sm transition"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {steps.map(step => (
            <div
              key={step.id}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                step.id <= currentStep ? 'bg-blue-500' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        <h2 className="text-2xl font-bold text-white mb-6">
          {steps[currentStep - 1].title}
        </h2>

        {/* Step 1 */}
        {currentStep === 1 && (
          <input
            type="text"
            placeholder="Jaise: Simran Kaur"
            value={formData.full_name}
            onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}

        {/* Step 2 */}
        {currentStep === 2 && (
          <div className="grid grid-cols-2 gap-3">
            {['Student', 'Fresher', 'Working Professional', 'Career Switch'].map(role => (
              <button
                key={role}
                onClick={() => setFormData(prev => ({ ...prev, role }))}
                className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                  formData.role === role
                    ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                    : 'border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        )}

        {/* Step 3 */}
        {currentStep === 3 && (
          <div className="grid grid-cols-2 gap-3">
            {['0-1 years', '1-3 years', '3-5 years', '5+ years'].map(exp => (
              <button
                key={exp}
                onClick={() => setFormData(prev => ({ ...prev, experience: exp }))}
                className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                  formData.experience === exp
                    ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                    : 'border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {exp}
              </button>
            ))}
          </div>
        )}

        {/* Step 4 */}
        {currentStep === 4 && (
          <div>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Jaise: Google, Microsoft..."
                value={companyInput}
                onChange={e => setCompanyInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCompany()}
                className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addCompany}
                className="bg-blue-500 text-white px-4 rounded-xl hover:bg-blue-600 transition"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.target_companies.map((company, i) => (
                <span
                  key={i}
                  className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {company}
                  <button onClick={() => removeCompany(i)} className="hover:text-white">×</button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 mt-8">
          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 hover:border-gray-500 transition"
            >
              Back
            </button>
          )}
          {currentStep < 4 ? (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEditMode ? 'Save Changes ✅' : 'Dashboard Pe Jao! 🚀'}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}