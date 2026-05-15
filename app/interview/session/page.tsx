'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function InterviewSession() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const role = searchParams.get('role') || ''
  const round = searchParams.get('round') || ''
  const difficulty = searchParams.get('difficulty') || ''

  // Camera
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Speech
  const recognitionRef = useRef<any>(null)
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)

  // AI correction
  const [correctedTranscript, setCorrectedTranscript] = useState('')
  const [correcting, setCorrecting] = useState(false)

  // Interview state
  const [messages, setMessages] = useState<Message[]>([])
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [interviewDone, setInterviewDone] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)

  // Tab switch warning
  const [tabWarnings, setTabWarnings] = useState(0)
  const [showWarning, setShowWarning] = useState(false)
  const [warningMsg, setWarningMsg] = useState('')

  // Session started
  const [sessionStarted, setSessionStarted] = useState(false)
  const [camReady, setCamReady] = useState(false)

  // AI speaking state
  const [isSpeaking, setIsSpeaking] = useState(false)

  // --- Camera Setup ---
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCamReady(true)
    } catch (err) {
      alert('Camera aur microphone access do — interview ke liye zaroori hai!')
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(track => track.stop())
  }

  // --- Text to Speech ---
  function speakText(text: string) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-IN'
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  // --- Speech Recognition ---
  function startListening() {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert('Tumhara browser speech recognition support nahi karta. Chrome use karo!')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)

    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript
      setTranscript(text)

      // AI auto correct
      setCorrecting(true)
      try {
        const res = await fetch('/api/interview/correct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: text, role, round }),
        })
        const data = await res.json()
        setCorrectedTranscript(data.corrected)
      } catch {
        setCorrectedTranscript(text)
      }
      setCorrecting(false)
    }

    recognition.onerror = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
  }

  function stopListening() {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  // --- Tab Switch Detection ---
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden && sessionStarted && !interviewDone) {
        const newCount = tabWarnings + 1
        setTabWarnings(newCount)

        if (newCount >= 3) {
          setWarningMsg('❌ 3 baar tab switch kiya — interview terminate ho raha hai!')
          setShowWarning(true)
          setTimeout(() => {
            stopCamera()
            router.push('/dashboard')
          }, 3000)
        } else {
          setWarningMsg(`⚠️ Warning ${newCount}/3 — Tab switch mat karo! Agli baar session band ho jaayega.`)
          setShowWarning(true)
          setTimeout(() => setShowWarning(false), 4000)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [sessionStarted, interviewDone, tabWarnings])

  // --- Right Click Disable ---
  useEffect(() => {
    function preventRightClick(e: MouseEvent) {
      if (sessionStarted) e.preventDefault()
    }
    document.addEventListener('contextmenu', preventRightClick)
    return () => document.removeEventListener('contextmenu', preventRightClick)
  }, [sessionStarted])

  // --- AI Question Fetch ---
  const fetchAIQuestion = useCallback(async (updatedMessages: Message[]) => {
    setAiLoading(true)
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, round, difficulty, messages: updatedMessages }),
      })
      const data = await res.json()
      const reply = data.reply || ''

      if (reply.includes('INTERVIEW_COMPLETE')) {
        setInterviewDone(true)
        setCurrentQuestion('Interview complete! Report generate ho rahi hai...')
        speakText('Interview complete! Your report is being generated.')
        setTimeout(() => {
          stopCamera()
          const reportData = encodeURIComponent(JSON.stringify(updatedMessages))
          router.push(`/interview/report?data=${reportData}&role=${role}&round=${round}&difficulty=${difficulty}`)
        }, 3000)
      } else {
        setCurrentQuestion(reply)
        speakText(reply)
        setQuestionCount(prev => prev + 1)
        setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      }
    } catch (err) {
      setCurrentQuestion('Error aaya — dobara try karo.')
    }
    setAiLoading(false)
  }, [role, round, difficulty, router])

  // --- Start Session ---
  async function handleStartSession() {
    await startCamera()
    setSessionStarted(true)
    await fetchAIQuestion([])
  }

  // --- Submit Answer ---
  async function handleSubmitAnswer() {
    const finalAnswer = correctedTranscript.trim() || transcript.trim()
    if (!finalAnswer) return

    const userMessage: Message = { role: 'user', content: finalAnswer }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setTranscript('')
    setCorrectedTranscript('')
    await fetchAIQuestion(updatedMessages)
  }

  // --- Cleanup on unmount ---
  useEffect(() => {
    return () => {
      stopCamera()
      window.speechSynthesis.cancel()
    }
  }, [])

  // =====================
  // UI
  // =====================

  if (!sessionStarted) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-gray-900 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">🎤</div>
          <h1 className="text-2xl font-bold mb-2">Interview Ready Ho?</h1>
          <p className="text-gray-400 mb-6 text-sm">Session shuru hone se pehle yeh padhlo:</p>

          <div className="bg-gray-800 rounded-xl p-4 mb-6 text-left space-y-2">
            <p className="text-sm text-gray-300">📹 Camera on rehna chahiye poore session mein</p>
            <p className="text-sm text-gray-300">🎤 Voice se jawab dena hai — keyboard nahi</p>
            <p className="text-sm text-gray-300">🔒 Tab switch mat karna — 3 warnings ke baad session band</p>
            <p className="text-sm text-gray-300">🚫 Right click disabled rahega</p>
            <p className="text-sm text-gray-300">⏱️ 8-10 questions honge</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-3 mb-6 text-sm">
            <p className="text-blue-400 font-medium">
              {round.toUpperCase()} ROUND • {role.toUpperCase()} • {difficulty.toUpperCase()}
            </p>
          </div>

          <button
            onClick={handleStartSession}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 rounded-xl transition text-lg"
          >
            Start Interview 🚀
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Tab Switch Warning */}
      {showWarning && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-3 font-semibold animate-pulse">
          {warningMsg}
        </div>
      )}

      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium">LIVE — {round.toUpperCase()} ROUND</span>
        </div>
        <div className="text-sm text-gray-400">
          Question {questionCount} • {role} • {difficulty}
        </div>
        <div className="flex items-center gap-2 text-sm text-yellow-400">
          ⚠️ Warnings: {tabWarnings}/3
        </div>
      </div>

      <div className="flex flex-1 gap-0">

        {/* Left — Camera */}
        <div className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col items-center p-4 gap-4">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/60 text-xs text-green-400 px-2 py-1 rounded-full">
              📹 Live
            </div>
          </div>

          {/* AI Speaking Indicator */}
          {isSpeaking && (
            <div className="flex items-center gap-2 bg-blue-500/20 border border-blue-500/40 rounded-xl px-3 py-2 w-full justify-center">
              <div className="flex gap-1">
                <div className="w-1 h-4 bg-blue-400 rounded-full animate-bounce" />
                <div className="w-1 h-4 bg-blue-400 rounded-full animate-bounce delay-75" />
                <div className="w-1 h-4 bg-blue-400 rounded-full animate-bounce delay-150" />
                <div className="w-1 h-4 bg-blue-400 rounded-full animate-bounce delay-200" />
              </div>
              <span className="text-xs text-blue-400">Interviewer bol raha hai...</span>
            </div>
          )}

          <p className="text-xs text-gray-500 text-center">
            Camera band mat karna — session terminate ho jaayega
          </p>
        </div>

        {/* Right — Interview */}
        <div className="flex-1 flex flex-col p-6">

          {/* AI Question */}
          <div className="flex-1 flex flex-col justify-center mb-6">
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 max-w-2xl">
              <p className="text-xs text-blue-400 font-medium mb-3">
                🤖 INTERVIEWER {isSpeaking && <span className="text-blue-300 ml-1">🔊</span>}
              </p>
              {aiLoading ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-100" />
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-200" />
                  <span className="text-sm ml-1">Interviewer soch raha hai...</span>
                </div>
              ) : (
                <p className="text-white text-lg leading-relaxed">{currentQuestion}</p>
              )}
            </div>
          </div>

          {/* Answer Section */}
          {!interviewDone && (
            <div className="max-w-2xl">

              {/* Transcript — AI corrected + editable */}
              {(transcript || correcting) && (
                <div className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-green-400 font-medium">✅ Jawab record hua</p>
                    {correcting && (
                      <span className="text-xs text-yellow-400 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                        AI fix kar raha hai...
                      </span>
                    )}
                    {!correcting && correctedTranscript && (
                      <span className="text-xs text-blue-400">✨ AI corrected</span>
                    )}
                  </div>
                  <textarea
                    value={correcting ? '' : correctedTranscript}
                    onChange={e => setCorrectedTranscript(e.target.value)}
                    disabled={correcting}
                    placeholder={correcting ? 'AI transcription fix kar raha hai...' : ''}
                    rows={3}
                    className="w-full bg-gray-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50 placeholder-gray-500"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    ✏️ Galat lage toh edit kar sakte ho
                  </p>
                </div>
              )}

              {/* Mic Button */}
              <div className="flex gap-3">
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={aiLoading || isSpeaking || correcting}
                  className={`flex-1 py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                      : isSpeaking || correcting
                      ? 'bg-gray-800 border border-gray-700 text-gray-600 cursor-not-allowed'
                      : 'bg-gray-800 hover:bg-gray-700 border border-gray-600'
                  } disabled:opacity-40`}
                >
                  {isListening
                    ? '🔴 Bol rahi ho... (stop karo)'
                    : isSpeaking
                    ? '⏳ Interviewer bol raha hai...'
                    : correcting
                    ? '✨ AI fix kar raha hai...'
                    : '🎤 Jawab Do (press karo)'}
                </button>

                {correctedTranscript && !isListening && !correcting && (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={aiLoading || isSpeaking}
                    className="px-6 py-4 bg-blue-500 hover:bg-blue-600 rounded-xl font-semibold transition disabled:opacity-40"
                  >
                    Submit ✅
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-600 text-center mt-3">
                {isSpeaking
                  ? 'Interviewer finish karne do pehle...'
                  : correcting
                  ? 'AI jawab polish kar raha hai...'
                  : 'Mic button dabao → bolo → chodo → edit karo → Submit karo'}
              </p>

            </div>
          )}

        </div>
      </div>
    </div>
  )
}