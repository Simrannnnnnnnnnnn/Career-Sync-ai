'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Report {
  overallScore: number
  verdict: 'Ready' | 'Needs Practice' | 'Not Ready'
  technicalScore: number
  communicationScore: number
  confidenceScore: number
  strengths: string[]
  improvements: string[]
  questionFeedback: { question: string; answer: string; feedback: string }[]
}

export default function InterviewReport() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const role = searchParams.get('role') || ''
  const round = searchParams.get('round') || ''
  const difficulty = searchParams.get('difficulty') || ''
  const rawData = searchParams.get('data') || ''

  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function generateReport() {
      if (!rawData) { router.push('/dashboard'); return }

      let messages: Message[] = []
      try {
        messages = JSON.parse(decodeURIComponent(rawData))
      } catch {
        router.push('/dashboard')
        return
      }

      try {
        const res = await fetch('/api/interview/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role, round, difficulty, messages }),
        })
        const data = await res.json()
        setReport(data.report)
      } catch {
        router.push('/dashboard')
      }
      setLoading(false)
    }
    generateReport()
  }, [])

  function getVerdictColor(verdict: string) {
    if (verdict === 'Ready') return 'text-green-400'
    if (verdict === 'Needs Practice') return 'text-yellow-400'
    return 'text-red-400'
  }

  function getScoreColor(score: number) {
    if (score >= 75) return 'bg-green-500'
    if (score >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce" />
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce delay-100" />
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce delay-200" />
        </div>
        <p className="text-white text-lg font-medium">Report generate ho rahi hai...</p>
        <p className="text-gray-500 text-sm">AI tumhara performance analyze kar raha hai</p>
      </div>
    )
  }

  if (!report) return null

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Interview Report 📊</h1>
          <p className="text-gray-400 text-sm">
            {round.toUpperCase()} ROUND • {role} • {difficulty}
          </p>
        </div>

        {/* Overall Score + Verdict */}
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 mb-6 text-center">
          <div className="text-7xl font-bold mb-2">{report.overallScore}</div>
          <div className="text-gray-400 text-sm mb-4">Overall Score / 100</div>
          <div className={`text-2xl font-bold ${getVerdictColor(report.verdict)}`}>
            {report.verdict === 'Ready' && '✅ Interview Ready!'}
            {report.verdict === 'Needs Practice' && '⚠️ Needs Practice'}
            {report.verdict === 'Not Ready' && '❌ Not Ready Yet'}
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
          <h2 className="text-lg font-semibold mb-5">Score Breakdown</h2>
          <div className="space-y-4">
            {[
              { label: 'Technical Accuracy', score: report.technicalScore, icon: '💻' },
              { label: 'Communication', score: report.communicationScore, icon: '🗣️' },
              { label: 'Confidence', score: report.confidenceScore, icon: '💪' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-300">{item.icon} {item.label}</span>
                  <span className="text-sm font-medium">{item.score}/100</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getScoreColor(item.score)}`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths + Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-900 rounded-2xl p-6 border border-green-900">
            <h2 className="text-lg font-semibold mb-4 text-green-400">✅ Strengths</h2>
            <ul className="space-y-2">
              {report.strengths.map((s, i) => (
                <li key={i} className="text-sm text-gray-300 flex gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gray-900 rounded-2xl p-6 border border-red-900">
            <h2 className="text-lg font-semibold mb-4 text-red-400">🔧 Improve Karo</h2>
            <ul className="space-y-2">
              {report.improvements.map((imp, i) => (
                <li key={i} className="text-sm text-gray-300 flex gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  {imp}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Question wise feedback */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-8">
          <h2 className="text-lg font-semibold mb-5">Question-wise Feedback</h2>
          <div className="space-y-5">
            {report.questionFeedback.map((item, i) => (
              <div key={i} className="border-b border-gray-800 pb-5 last:border-0 last:pb-0">
                <p className="text-sm text-blue-400 font-medium mb-1">Q{i + 1}: {item.question}</p>
                <p className="text-sm text-gray-400 mb-2">
                  <span className="text-gray-500">Tumhara jawab: </span>{item.answer}
                </p>
                <p className="text-sm text-yellow-300">💡 {item.feedback}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link
            href="/interview/setup"
            className="flex-1 py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-center transition"
          >
            🔄 Dobara Practice Karo
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 py-4 rounded-xl border border-gray-700 hover:border-gray-500 text-gray-300 font-semibold text-center transition"
          >
            🏠 Dashboard
          </Link>
        </div>

      </div>
    </div>
  )
}