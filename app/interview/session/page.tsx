'use client'

import { useEffect, useRef, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// ─── Warning beep sound (Web Audio API — no file needed) ────────────────────
function playWarningBeep(type: 'warn' | 'critical' = 'warn') {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(type === 'critical' ? 220 : 440, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(type === 'critical' ? 110 : 880, ctx.currentTime + 0.3)
    gainNode.gain.setValueAtTime(0.6, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.6)
    if (type === 'critical') {
      // Double beep for critical
      const o2 = ctx.createOscillator()
      const g2 = ctx.createGain()
      o2.connect(g2); g2.connect(ctx.destination)
      o2.type = 'sine'
      o2.frequency.setValueAtTime(180, ctx.currentTime + 0.7)
      o2.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 1)
      g2.gain.setValueAtTime(0.7, ctx.currentTime + 0.7)
      g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2)
      o2.start(ctx.currentTime + 0.7)
      o2.stop(ctx.currentTime + 1.2)
    }
  } catch { /* silently ignore if audio context blocked */ }
}

// ─── AI Tool detection patterns ─────────────────────────────────────────────
const AI_BLOCKED_PATTERNS = [
  'chatgpt', 'openai', 'claude', 'gemini', 'bard', 'copilot', 'perplexity',
  'you.com', 'phind', 'poe.com', 'character.ai', 'pi.ai', 'mistral',
  'anthropic', 'cohere', 'huggingface', 'ollama', 'lmstudio',
  'deepseek', 'grok', 'groq', 'together.ai', 'replicate.com',
]

function InterviewSessionInner() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const role       = searchParams.get('role')       || ''
  const round      = searchParams.get('round')      || ''
  const difficulty = searchParams.get('difficulty') || ''

  // Refs
  const videoRef        = useRef<HTMLVideoElement>(null)
  const streamRef       = useRef<MediaStream | null>(null)
  const recognitionRef  = useRef<any>(null)
  const mediaRecRef     = useRef<MediaRecorder | null>(null)
  const recordedChunks  = useRef<Blob[]>([])
  const warningCountRef = useRef(0) // instant-sync ref alongside state

  // Core state
  const [transcript,          setTranscript]          = useState('')
  const [isListening,         setIsListening]         = useState(false)
  const [correctedTranscript, setCorrectedTranscript] = useState('')
  const [correcting,          setCorrecting]          = useState(false)
  const [messages,            setMessages]            = useState<Message[]>([])
  const [currentQuestion,     setCurrentQuestion]     = useState('')
  const [aiLoading,           setAiLoading]           = useState(false)
  const [interviewDone,       setInterviewDone]       = useState(false)
  const [questionCount,       setQuestionCount]       = useState(0)
  const [sessionStarted,      setSessionStarted]      = useState(false)
  const [camReady,            setCamReady]            = useState(false)
  const [isSpeaking,          setIsSpeaking]          = useState(false)
  const [isRecording,         setIsRecording]         = useState(false)

  // Proctoring state
  const [tabWarnings,  setTabWarnings]  = useState(0)
  const [showWarning,  setShowWarning]  = useState(false)
  const [warningMsg,   setWarningMsg]   = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [aiBlocked,    setAiBlocked]    = useState(false)
  const [aiBlockMsg,   setAiBlockMsg]   = useState('')

  // Timer
  const [elapsed, setElapsed] = useState(0)

  // ── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionStarted || interviewDone) return
    const t = setInterval(() => setElapsed(p => p + 1), 1000)
    return () => clearInterval(t)
  }, [sessionStarted, interviewDone])

  const formatTime = (s: number) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  // ── Camera + MediaRecorder ───────────────────────────────────────────────
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: true,
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream

      // Start recording user video
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' })
      recorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.current.push(e.data) }
      recorder.start(1000) // chunk every 1s
      mediaRecRef.current = recorder
      setIsRecording(true)
      setCamReady(true)
    } catch {
      alert('Camera and microphone access are required for this interview session.')
    }
  }

  function stopCamera() {
    mediaRecRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    setIsRecording(false)
  }

  function downloadRecording() {
    if (!recordedChunks.current.length) return
    const blob = new Blob(recordedChunks.current, { type: 'video/webm' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `interview-${role}-${round}-${Date.now()}.webm`
    a.click(); URL.revokeObjectURL(url)
  }

  // ── Fullscreen ────────────────────────────────────────────────────────────
  function enterFullscreen() {
    const el = document.documentElement
    try {
      if (el.requestFullscreen) el.requestFullscreen().catch(() => {})
        else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen()
      } catch (e) {
    // fullscreen not supported, ignore
    }
    setIsFullscreen(true)
  }

  function exitFullscreenViolation() {
    triggerViolation('fullscreen')
  }

  useEffect(() => {
    const handler = () => {
      const inFS = !!(document.fullscreenElement || (document as any).webkitFullscreenElement)
      setIsFullscreen(inFS)
      if (!inFS && sessionStarted && !interviewDone) {
        exitFullscreenViolation()
        // Re-enter after 2s
        setTimeout(enterFullscreen, 2000)
      }
    }
    document.addEventListener('fullscreenchange', handler)
    document.addEventListener('webkitfullscreenchange', handler)
    return () => {
      document.removeEventListener('fullscreenchange', handler)
      document.removeEventListener('webkitfullscreenchange', handler)
    }
  }, [sessionStarted, interviewDone])

  // ── AI Tool detection ────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionStarted || interviewDone) return

    // Clipboard sniff (user copies text — likely to paste into AI)
    const handleCopy = () => {
      setAiBlocked(true)
      setAiBlockMsg('Copying during interview is not allowed. This may indicate AI tool usage.')
      playWarningBeep('warn')
      setTimeout(() => setAiBlocked(false), 4000)
    }
    const handlePaste = () => {
      setAiBlocked(true)
      setAiBlockMsg('Pasting content detected — AI assistance is strictly prohibited.')
      playWarningBeep('critical')
      setTimeout(() => setAiBlocked(false), 4000)
    }

    // Context menu sniff
    const preventContext = (e: MouseEvent) => e.preventDefault()

    // DevTools detection (rough heuristic: window size diff)
    const devToolsCheck = setInterval(() => {
      const threshold = 160
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        setAiBlocked(true)
        setAiBlockMsg('Developer tools detected. AI tools and extensions are strictly blocked.')
        playWarningBeep('critical')
      }
    }, 2000)

    document.addEventListener('copy', handleCopy)
    document.addEventListener('paste', handlePaste)
    document.addEventListener('contextmenu', preventContext)

    return () => {
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('paste', handlePaste)
      document.removeEventListener('contextmenu', preventContext)
      clearInterval(devToolsCheck)
    }
  }, [sessionStarted, interviewDone])

  // ── Proctoring: tab / window switch ─────────────────────────────────────
  function triggerViolation(type: 'tab' | 'fullscreen' = 'tab') {
    if (!sessionStarted || interviewDone) return

    warningCountRef.current += 1
    const count = warningCountRef.current
    setTabWarnings(count)

    if (count >= 3) {
      playWarningBeep('critical')
      setWarningMsg('🚫 Session Terminated — 3 violations detected. Redirecting...')
      setShowWarning(true)
      stopCamera()
      window.speechSynthesis.cancel()
      setTimeout(() => router.push('/dashboard'), 3500)
    } else {
      playWarningBeep(count === 2 ? 'critical' : 'warn')
      const msgs: Record<string, string> = {
        tab: `Warning ${count}/3 — Tab/window switch detected. Third violation will terminate your session.`,
        fullscreen: `Warning ${count}/3 — Fullscreen exited. Stay in fullscreen during the interview.`,
      }
      setWarningMsg(msgs[type])
      setShowWarning(true)
      setTimeout(() => setShowWarning(false), 5000)
    }
  }

  useEffect(() => {
    if (!sessionStarted || interviewDone) return
    const handleVisibility = () => { if (document.hidden) triggerViolation('tab') }
    const handleBlur = () => triggerViolation('tab')
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('blur', handleBlur)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('blur', handleBlur)
    }
  }, [sessionStarted, interviewDone])

  // ── TTS (speak question) ─────────────────────────────────────────────────
  function speakText(text: string) {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-IN'; u.rate = 0.88; u.pitch = 1.05
    u.onstart = () => setIsSpeaking(true)
    u.onend = () => setIsSpeaking(false)
    u.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(u)
  }

  // ── Speech recognition ───────────────────────────────────────────────────
  function startListening() {
    window.speechSynthesis.cancel(); setIsSpeaking(false)
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Use Chrome for speech recognition.'); return }

    const recognition = new SR()
    recognition.lang = 'en-IN'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend   = () => setIsListening(false)

    recognition.onresult = async (event: any) => {
      if (correcting) return
      const text = event.results[0][0].transcript
      setTranscript(text)
      setCorrecting(true)
      try {
        const res = await fetch('/api/interview/correct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: text, role, round }),
        })
        const data = await res.json()
        setCorrectedTranscript(data.corrected)
      } catch { setCorrectedTranscript(text) }
      setCorrecting(false)
    }
    recognition.onerror = () => setIsListening(false)
    recognitionRef.current = recognition
    recognition.start()
  }

  function stopListening() { recognitionRef.current?.stop(); setIsListening(false) }

  // ── AI question fetcher ──────────────────────────────────────────────────
  const fetchAIQuestion = useCallback(async (msgs: Message[]) => {
    setAiLoading(true)
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, round, difficulty, messages: msgs }),
      })
      const data = await res.json()
      const reply = data.reply || ''

      if (reply.includes('INTERVIEW_COMPLETE')) {
        setInterviewDone(true)
        setCurrentQuestion('Interview complete. Generating your performance report…')
        speakText('Great effort. Your performance report is being generated.')
        setTimeout(() => {
          stopCamera()
          downloadRecording()
          const reportData = encodeURIComponent(JSON.stringify(msgs))
          router.push(`/interview/report?data=${reportData}&role=${role}&round=${round}&difficulty=${difficulty}`)
        }, 3500)
      } else {
        setCurrentQuestion(reply)
        speakText(reply)
        setQuestionCount(p => p + 1)
        setMessages(p => [...p, { role: 'assistant', content: reply }])
      }
    } catch { setCurrentQuestion('Connection error. Please check your network.') }
    setAiLoading(false)
  }, [role, round, difficulty, router])

  // ── Start session ─────────────────────────────────────────────────────────
  async function handleStartSession() {
    enterFullscreen()
    await startCamera()
    setSessionStarted(true)
    await fetchAIQuestion([])
  }

  // ── Submit answer ─────────────────────────────────────────────────────────
  async function handleSubmitAnswer() {
    const answer = correctedTranscript.trim() || transcript.trim()
    if (!answer) return
    const userMsg: Message = { role: 'user', content: answer }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setTranscript(''); setCorrectedTranscript('')
    await fetchAIQuestion(updated)
  }

  useEffect(() => {
    return () => { stopCamera(); window.speechSynthesis.cancel() }
  }, [])

  const difficultyLabel = difficulty === 'easy' ? 'Entry Level' : difficulty === 'medium' ? 'Mid Level' : 'Senior Level'
  const roundLabel = round === 'hr' ? 'HR' : round === 'technical' ? 'Technical' : 'Analytical'
  const diffColor = difficulty === 'easy' ? '#10b981' : difficulty === 'medium' ? '#f59e0b' : '#ef4444'

  // ══════════════════════════════════════════════════════════════════════════
  // PRE-SESSION SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  if (!sessionStarted) {
    return (
      <div style={{
        minHeight: '100vh', background: '#050507',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', fontFamily: "'DM Mono', 'Fira Code', monospace",
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background grid */}
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none',
          backgroundImage: `linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
        {/* Glow */}
        <div style={{
          position: 'fixed', top: '-20%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 400, borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(ellipse, rgba(16,185,129,0.08) 0%, transparent 70%)',
        }} />

        <div style={{ width: '100%', maxWidth: 520, position: 'relative', zIndex: 1 }}>
          {/* Header badge */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px',
              borderRadius: 99, border: '1px solid rgba(16,185,129,0.3)',
              background: 'rgba(16,185,129,0.06)', marginBottom: 20,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#10b981', textTransform: 'uppercase' }}>
                CareerSync AI — Interview Engine
              </span>
            </div>

            <h1 style={{
              color: '#f4f4f5', fontSize: 30, fontWeight: 700, margin: '0 0 8px',
              letterSpacing: '-0.03em', lineHeight: 1.2,
            }}>
              Ready for your<br />
              <span style={{ color: '#10b981' }}>{roundLabel} Interview</span>?
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
              {role} &nbsp;·&nbsp; {difficultyLabel}
            </p>
          </div>

          {/* Rules card */}
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 20, padding: '28px 32px', marginBottom: 16,
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 20, margin: '0 0 20px' }}>
              Session Rules
            </p>

            {[
              { icon: '📹', title: 'Camera stays ON', sub: 'Your video and audio are recorded throughout the session.' },
              { icon: '🎤', title: 'Speak your answers', sub: 'Use the mic button to capture your spoken response after each question.' },
              { icon: '⛶', title: 'Fullscreen enforced', sub: 'Session runs in fullscreen. Exiting will trigger a warning.' },
              { icon: '🔒', title: 'Strict AI guard', sub: 'Tab switches, copy-paste, devtools, and AI tools are all monitored.' },
              { icon: '⚠️', title: '3-strike system', sub: 'Three violations terminate the session immediately.' },
            ].map((rule, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: i < 4 ? 18 : 0 }}>
                <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{rule.icon}</span>
                <div>
                  <p style={{ color: '#e4e4e7', fontSize: 13, fontWeight: 600, margin: '0 0 2px' }}>{rule.title}</p>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0, lineHeight: 1.5 }}>{rule.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Consent note */}
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginBottom: 20, lineHeight: 1.6 }}>
            By starting, you consent to video & audio recording for review purposes.<br />
            Recording is saved locally to your device.
          </p>

          <button onClick={handleStartSession} style={{
            width: '100%', padding: '16px', borderRadius: 16, border: 'none',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            letterSpacing: '0.02em',
            boxShadow: '0 0 40px rgba(16,185,129,0.25), 0 4px 16px rgba(0,0,0,0.3)',
            transition: 'all 0.2s', fontFamily: 'inherit',
          }}>
            Enter Session → Go Fullscreen
          </button>
        </div>

        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ACTIVE SESSION
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{
      minHeight: '100vh', height: '100vh', background: '#050507',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: '#f4f4f5',
      position: 'relative',
    }}>
      {/* ── Background grid ── */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `linear-gradient(rgba(16,185,129,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.02) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />

      {/* ── AI Block Overlay ── */}
      {aiBlocked && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 16, textAlign: 'center', padding: 32,
        }}>
          <div style={{ fontSize: 48 }}>🚫</div>
          <h2 style={{ color: '#ef4444', fontSize: 22, fontWeight: 700, margin: 0 }}>Security Violation Detected</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, maxWidth: 360, lineHeight: 1.6, margin: 0 }}>{aiBlockMsg}</p>
          <button onClick={() => setAiBlocked(false)} style={{
            marginTop: 8, padding: '10px 28px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 13, cursor: 'pointer',
            fontFamily: 'inherit',
          }}>Acknowledge & Continue</button>
        </div>
      )}

      {/* ── Warning Banner ── */}
      {showWarning && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: tabWarnings >= 3 ? 'rgba(127,29,29,0.98)' : 'rgba(67,20,7,0.98)',
          borderBottom: `2px solid ${tabWarnings >= 3 ? '#ef4444' : '#f97316'}`,
          backdropFilter: 'blur(12px)',
          color: '#fff', textAlign: 'center', padding: '16px 24px',
          fontSize: 14, fontWeight: 600, letterSpacing: '0.02em',
          boxShadow: `0 4px 40px ${tabWarnings >= 3 ? 'rgba(239,68,68,0.4)' : 'rgba(249,115,22,0.3)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>{tabWarnings >= 3 ? '🚫' : '⚠️'}</span>
          <span>{warningMsg}</span>
          {tabWarnings < 3 && (
            <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
              {[1,2,3].map(n => (
                <div key={n} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: n <= tabWarnings ? '#ef4444' : 'rgba(255,255,255,0.2)',
                }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Top Bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 28px', zIndex: 50, flexShrink: 0,
        background: 'rgba(5,5,7,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* Left: Live dot + round */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', background: '#ef4444',
            boxShadow: '0 0 10px #ef4444', animation: 'pulse 1.5s infinite',
          }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
            LIVE · {roundLabel} Round
          </span>
          {isRecording && (
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              padding: '3px 8px', borderRadius: 99,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              color: '#ef4444', textTransform: 'uppercase',
            }}>⏺ REC</span>
          )}
        </div>

        {/* Center: Role + timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          <span>{role}</span>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
          <span style={{
            fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 600,
            color: elapsed > 1800 ? '#ef4444' : 'rgba(255,255,255,0.6)',
          }}>{formatTime(elapsed)}</span>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
          <span style={{ color: diffColor, fontWeight: 600 }}>{difficultyLabel}</span>
        </div>

        {/* Right: Warning indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 11, fontWeight: 600, padding: '6px 14px', borderRadius: 99,
          background: tabWarnings > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)',
          border: tabWarnings > 0 ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(255,255,255,0.07)',
          color: tabWarnings > 0 ? '#ef4444' : 'rgba(255,255,255,0.35)',
        }}>
          <span>🔒</span>
          <span>Strict Guard</span>
          <div style={{ display: 'flex', gap: 3 }}>
            {[1,2,3].map(n => (
              <div key={n} style={{
                width: 6, height: 6, borderRadius: '50%',
                background: n <= tabWarnings ? '#ef4444' : 'rgba(255,255,255,0.12)',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Body ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '20px', flex: 1, padding: '20px 28px 24px',
        overflow: 'hidden', position: 'relative', zIndex: 1,
        maxWidth: 1600, width: '100%', margin: '0 auto', boxSizing: 'border-box',
      }}>

        {/* ── LEFT: Camera ── */}
        <div style={{
          background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 20, overflow: 'hidden', position: 'relative',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          <video ref={videoRef} autoPlay muted playsInline style={{
            width: '100%', height: '100%', objectFit: 'cover',
            transform: 'scaleX(-1)', display: 'block',
          }} />

          {/* Scanline overlay for "real interview room" feel */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
          }} />

          {/* Corner brackets — professional look */}
          {[
            { top: 16, left: 16,  borderTop: '2px solid #10b981', borderLeft: '2px solid #10b981' },
            { top: 16, right: 16, borderTop: '2px solid #10b981', borderRight: '2px solid #10b981' },
            { bottom: 16, left: 16,  borderBottom: '2px solid #10b981', borderLeft: '2px solid #10b981' },
            { bottom: 16, right: 16, borderBottom: '2px solid #10b981', borderRight: '2px solid #10b981' },
          ].map((style, i) => (
            <div key={i} style={{ position: 'absolute', width: 24, height: 24, ...style }} />
          ))}

          {/* Top-left: Proctoring badge */}
          <div style={{
            position: 'absolute', top: 20, left: 20,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(16,185,129,0.3)',
            padding: '6px 12px', borderRadius: 99,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#10b981', textTransform: 'uppercase' }}>
              Proctoring
            </span>
          </div>

          {/* Top-right: Question counter */}
          <div style={{
            position: 'absolute', top: 20, right: 20,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '6px 12px', borderRadius: 99,
            fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)',
          }}>
            Q {questionCount}
          </div>

          {/* Bottom: Status chips */}
          <div style={{
            position: 'absolute', bottom: 20, left: 20, right: 20,
            display: 'flex', gap: 8, flexWrap: 'wrap',
          }}>
            {isSpeaking && (
              <div style={{
                padding: '7px 14px', borderRadius: 99,
                background: 'rgba(59,130,246,0.88)', backdropFilter: 'blur(6px)',
                border: '1px solid rgba(59,130,246,0.4)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                  {[4,6,8,6,4].map((h, i) => (
                    <div key={i} style={{
                      width: 2, height: h, background: '#fff', borderRadius: 99,
                      animation: `wave 0.7s ease-in-out ${i*0.08}s infinite alternate`,
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>AI Speaking…</span>
              </div>
            )}
            {isListening && (
              <div style={{
                padding: '7px 14px', borderRadius: 99,
                background: 'rgba(239,68,68,0.88)', backdropFilter: 'blur(6px)',
                border: '1px solid rgba(239,68,68,0.4)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', background: '#fff',
                  display: 'inline-block', animation: 'pulse 0.8s infinite',
                }} />
                <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>Recording…</span>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Interview Panel ── */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '16px',
          overflow: 'hidden',
        }}>
          {/* Question card */}
          <div style={{
            flex: 1, borderRadius: 20, padding: '28px 32px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            position: 'relative',
          }}>
            {/* Subtle glow behind question */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: isSpeaking
                ? 'linear-gradient(90deg, transparent, #3b82f6, transparent)'
                : 'linear-gradient(90deg, transparent, rgba(16,185,129,0.4), transparent)',
              transition: 'background 0.5s',
            }} />

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
              color: isSpeaking ? '#3b82f6' : '#10b981', marginBottom: 20,
              padding: '5px 12px', borderRadius: 99,
              background: isSpeaking ? 'rgba(59,130,246,0.08)' : 'rgba(16,185,129,0.08)',
              border: isSpeaking ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(16,185,129,0.2)',
              alignSelf: 'flex-start', transition: 'all 0.3s',
            }}>
              🤖 {isSpeaking ? 'AI Interviewer Speaking' : `Question ${questionCount}`}
              {isSpeaking && (
                <span style={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                  {[3,5,7,5,3].map((h, i) => (
                    <div key={i} style={{
                      width: 2, height: h, background: '#3b82f6', borderRadius: 99,
                      animation: `wave 0.6s ease-in-out ${i*0.1}s infinite alternate`,
                    }} />
                  ))}
                </span>
              )}
            </div>

            {aiLoading ? (
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 12,
                color: 'rgba(255,255,255,0.35)',
              }}>
                <div style={{ display: 'flex', gap: 5 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      width: 8, height: 8, borderRadius: '50%', background: '#10b981',
                      animation: `bounce 0.9s ease-in-out ${i*0.18}s infinite alternate`,
                      opacity: 0.7,
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 15 }}>Formulating next question…</span>
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <p style={{
                  color: '#f4f4f5', fontSize: 20, fontWeight: 500,
                  lineHeight: 1.65, margin: 0, letterSpacing: '-0.01em',
                }}>
                  {currentQuestion || "Your first question is loading…"}
                </p>
              </div>
            )}
          </div>

          {/* Response area */}
          {!interviewDone && (
            <div style={{
              borderRadius: 20, padding: '20px 24px',
              background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)',
              flexShrink: 0,
            }}>
              {/* Transcript preview */}
              {(transcript || correcting) && (
                <div style={{
                  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 14, padding: '16px 18px', marginBottom: 14,
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      ✓ Your Response
                    </span>
                    {correcting ? (
                      <span style={{ fontSize: 11, color: '#eab308', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#eab308', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                        Polishing…
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: '#60a5fa', fontWeight: 500 }}>✨ AI-Corrected</span>
                    )}
                  </div>
                  <textarea
                    value={correcting ? '' : correctedTranscript}
                    onChange={e => setCorrectedTranscript(e.target.value)}
                    disabled={correcting}
                    placeholder={correcting ? 'Processing your speech…' : ''}
                    rows={3}
                    style={{
                      width: '100%', background: 'transparent',
                      border: 'none', borderRadius: 0, padding: 0,
                      color: '#e4e4e7', fontSize: 14, lineHeight: 1.6,
                      outline: 'none', resize: 'none', fontFamily: 'inherit',
                      boxSizing: 'border-box', opacity: correcting ? 0.4 : 1,
                    }}
                  />
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={aiLoading || isSpeaking || correcting}
                  style={{
                    flex: 1, padding: '14px 20px', borderRadius: 14,
                    border: isListening
                      ? '1.5px solid rgba(239,68,68,0.5)'
                      : '1px solid rgba(255,255,255,0.09)',
                    background: isListening ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.03)',
                    color: isListening ? '#ef4444'
                      : (isSpeaking || correcting || aiLoading) ? 'rgba(255,255,255,0.2)' : '#e4e4e7',
                    fontSize: 13, fontWeight: 600,
                    cursor: (aiLoading || isSpeaking || correcting) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    letterSpacing: '0.01em',
                  }}
                >
                  {isListening ? (
                    <>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 0.8s infinite' }} />
                      Stop Recording
                    </>
                  ) : '🎤 Record Answer'}
                </button>

                {correctedTranscript && !isListening && !correcting && (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={aiLoading || isSpeaking}
                    style={{
                      padding: '14px 24px', borderRadius: 14, border: 'none',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff', fontSize: 13, fontWeight: 700,
                      cursor: (aiLoading || isSpeaking) ? 'not-allowed' : 'pointer',
                      opacity: (aiLoading || isSpeaking) ? 0.4 : 1,
                      flexShrink: 0, fontFamily: 'inherit',
                      boxShadow: '0 0 24px rgba(16,185,129,0.2)',
                      letterSpacing: '0.01em',
                    }}
                  >
                    Submit →
                  </button>
                )}
              </div>

              <p style={{
                textAlign: 'center', color: 'rgba(255,255,255,0.18)',
                fontSize: 11, marginTop: 12, margin: '12px 0 0',
                letterSpacing: '0.03em',
              }}>
                {isSpeaking
                  ? 'Wait for AI to finish speaking before recording your answer'
                  : isListening
                  ? 'Listening… speak clearly and at a steady pace'
                  : 'Maintain eye contact with the camera while answering'}
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes bounce { from{transform:translateY(0)} to{transform:translateY(-5px)} }
        @keyframes wave { from{transform:scaleY(0.5)} to{transform:scaleY(1.5)} }
        * { -webkit-user-select: none; user-select: none; }
        textarea { -webkit-user-select: text !important; user-select: text !important; }
      `}</style>
    </div>
  )
}
export default function InterviewSession() {
  return (
    <Suspense fallback={<div style={{background:'#09090b',minHeight:'100vh'}}/>}>
      <InterviewSessionInner />
    </Suspense>
  )
}