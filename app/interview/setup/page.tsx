'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const steps = [
  { id: 1, title: 'Please choose ROLE?' },
  { id: 2, title: 'Please Choose the Round?' },
  { id: 3, title: 'Difficulty Level?' },
]

const roles = [
  { id: 'frontend', label: 'Frontend Developer', icon: '🖥️' },
  { id: 'backend', label: 'Backend Developer', icon: '⚙️' },
  { id: 'fullstack', label: 'Full Stack Developer', icon: '🔧' },
  { id: 'datascience', label: 'Data Science', icon: '📊' },
  { id: 'aiml', label: 'AI / ML Engineer', icon: '🤖' },
  { id: 'devops', label: 'DevOps Engineer', icon: '☁️' },
]

const rounds = [
  { id: 'hr', label: 'HR Round', icon: '🤝', desc: 'Behavioural, culture fit, salary' },
  { id: 'technical', label: 'Technical Round', icon: '💻', desc: 'Domain-specific questions' },
  { id: 'analytical', label: 'Analytical Round', icon: '🧠', desc: 'Case studies, problem solving' },
]

const difficulties = [
  { id: 'easy', label: 'Easy', icon: '🟢', desc: 'Fresher level' },
  { id: 'medium', label: 'Medium', icon: '🟡', desc: '1-3 years exp' },
  { id: 'hard', label: 'Hard', icon: '🔴', desc: '3+ years exp' },
]

export default function InterviewSetup() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedRound, setSelectedRound] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')

  function handleNext() {
    if (currentStep < 3) setCurrentStep(prev => prev + 1)
  }

  function handleBack() {
    if (currentStep > 1) setCurrentStep(prev => prev - 1)
  }

  function canProceed() {
    if (currentStep === 1) return selectedRole !== ''
    if (currentStep === 2) return selectedRound !== ''
    if (currentStep === 3) return selectedDifficulty !== ''
    return false
  }

  function handleStart() {
    const params = new URLSearchParams({
      role: selectedRole,
      round: selectedRound,
      difficulty: selectedDifficulty,
    })
    router.push(`/interview/session?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-lg">

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

        {/* Step Title */}
        <h2 className="text-2xl font-bold text-white mb-6">
          {steps[currentStep - 1].title}
        </h2>

        {/* Step 1 — Role */}
        {currentStep === 1 && (
          <div className="grid grid-cols-2 gap-3">
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedRole === role.id
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-gray-700 hover:border-gray-500'
                }`}
              >
                <div className="text-2xl mb-2">{role.icon}</div>
                <div className="text-sm font-medium text-white">{role.label}</div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2 — Round */}
        {currentStep === 2 && (
          <div className="flex flex-col gap-3">
            {rounds.map(round => (
              <button
                key={round.id}
                onClick={() => setSelectedRound(round.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedRound === round.id
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-gray-700 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{round.icon}</div>
                  <div>
                    <div className="text-sm font-medium text-white">{round.label}</div>
                    <div className="text-xs text-gray-500">{round.desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 3 — Difficulty */}
        {currentStep === 3 && (
          <div className="flex flex-col gap-3">
            {difficulties.map(diff => (
              <button
                key={diff.id}
                onClick={() => setSelectedDifficulty(diff.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedDifficulty === diff.id
                    ? 'border-green-500 bg-green-500/20'
                    : 'border-gray-700 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{diff.icon}</div>
                  <div>
                    <div className="text-sm font-medium text-white">{diff.label}</div>
                    <div className="text-xs text-gray-500">{diff.desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 mt-8">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 hover:border-gray-500 transition"
            >
              Back
            </button>
          )}
          {currentStep < 3 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={!canProceed()}
              className="flex-1 py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Start Interview 🚀
            </button>
          )}
        </div>

      </div>
    </div>
  )
}