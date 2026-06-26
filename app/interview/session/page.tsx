'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function playWarningBeep(type: 'warn' | 'critical' = 'warn') {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const o = ctx.createOscillator(); const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination); o.type = 'sine'
    o.frequency.setValueAtTime(type === 'critical' ? 220 : 440, ctx.currentTime)
    o.frequency.exponentialRampToValueAtTime(type === 'critical' ? 110 : 880, ctx.currentTime + 0.3)
    g.gain.setValueAtTime(0.6, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.6)
    if (type === 'critical') {
      const o2 = ctx.createOscillator(); const g2 = ctx.createGain()
      o2.connect(g2); g2.connect(ctx.destination); o2.type = 'sine'
      o2.frequency.setValueAtTime(180, ctx.currentTime + 0.7)
      o2.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 1)
      g2.gain.setValueAtTime(0.7, ctx.currentTime + 0.7)
      g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2)
      o2.start(ctx.currentTime + 0.7); o2.stop(ctx.currentTime + 1.2)
    }
  } catch { }
}

// ─────────────────────────────────────────────────────────────────────────────
function InterviewSessionInner() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const role       = searchParams.get('role')       || ''
  const round      = searchParams.get('round')      || ''
  const difficulty = searchParams.get('difficulty') || ''

  // ── Refs ──────────────────────────────────────────────────────────────────
  const correctionInProgressRef = useRef(false)
  // FIX 3a: guard against double-submit
  const submittingRef           = useRef(false)
  const videoRef                = useRef<HTMLVideoElement>(null)
  const streamRef               = useRef<MediaStream | null>(null)
  const recognitionRef          = useRef<any>(null)
  const mediaRecRef             = useRef<MediaRecorder | null>(null)
  const recordedChunks          = useRef<Blob[]>([])
  const warningRef              = useRef(0)
  // Keep messages in a ref so async functions always read latest value (no stale closure)
  const messagesRef             = useRef<Message[]>([])

  // ── State ─────────────────────────────────────────────────────────────────
  const [messages,            setMessages]            = useState<Message[]>([])
  const [currentQuestion,     setCurrentQuestion]     = useState('')
  const [transcript,          setTranscript]          = useState('')
  const [correctedTranscript, setCorrectedTranscript] = useState('')
  const [isListening,         setIsListening]         = useState(false)
  const [correcting,          setCorrecting]          = useState(false)
  const [aiLoading,           setAiLoading]           = useState(false)
  const [isSpeaking,          setIsSpeaking]          = useState(false)
  const [isRecording,         setIsRecording]         = useState(false)
  const [sessionStarted,      setSessionStarted]      = useState(false)
  const [interviewDone,       setInterviewDone]       = useState(false)
  const [questionCount,       setQuestionCount]       = useState(0)
  const [elapsed,             setElapsed]             = useState(0)
  const [tabWarnings,         setTabWarnings]         = useState(0)
  const [showWarning,         setShowWarning]         = useState(false)
  const [warningMsg,          setWarningMsg]          = useState('')
  const [aiBlocked,           setAiBlocked]           = useState(false)
  const [aiBlockMsg,          setAiBlockMsg]          = useState('')

  // ── Sync messages state → ref ─────────────────────────────────────────────
  useEffect(() => { messagesRef.current = messages }, [messages])

  // ── FIX 2c: Pre-load voices on mount so they're ready for first question ──
  useEffect(() => {
    window.speechSynthesis.getVoices()
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
  }, [])

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionStarted || interviewDone) return
    const t = setInterval(() => setElapsed(p => p + 1), 1000)
    return () => clearInterval(t)
  }, [sessionStarted, interviewDone])

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  // ── Camera ────────────────────────────────────────────────────────────────
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: true,
      })
      streamRef.current = stream
      // FIX 4a: Do NOT set srcObject here — the session-screen video element
      // hasn't mounted yet at this point. The useEffect below handles it once
      // sessionStarted flips to true and the video element is in the DOM.

      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus' : 'video/webm'
      const rec = new MediaRecorder(stream, { mimeType: mime })
      rec.ondataavailable = e => { if (e.data.size > 0) recordedChunks.current.push(e.data) }
      rec.start(1000)
      mediaRecRef.current = rec
      setIsRecording(true)
    } catch {
      alert('Camera and microphone access are required for this interview session.')
    }
  }

  // FIX 4a: Attach stream to video element only after session screen mounts
  useEffect(() => {
    if (sessionStarted && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {})
    }
  }, [sessionStarted])

  function stopCamera() {
    mediaRecRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    setIsRecording(false)
  }

  function downloadRecording() {
    if (!recordedChunks.current.length) return
    const blob = new Blob(recordedChunks.current, { type: 'video/webm' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `interview-${role}-${round}-${Date.now()}.webm`
    a.click(); URL.revokeObjectURL(url)
  }

  // ── Fullscreen ────────────────────────────────────────────────────────────
  function enterFullscreen() {
    try {
      const el = document.documentElement
      if (el.requestFullscreen) el.requestFullscreen().catch(() => {})
      else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen()
    } catch { }
  }

  useEffect(() => {
    const handler = () => {
      const inFS = !!(document.fullscreenElement || (document as any).webkitFullscreenElement)
      if (!inFS && sessionStarted && !interviewDone) {
        triggerViolation('fullscreen')
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

  // ── Proctoring ────────────────────────────────────────────────────────────
  function triggerViolation(type: 'tab' | 'fullscreen' = 'tab') {
    if (!sessionStarted || interviewDone) return
    warningRef.current += 1
    const count = warningRef.current
    setTabWarnings(count)
    if (count >= 3) {
      playWarningBeep('critical')
      setWarningMsg('🚫 Session Terminated — 3 violations detected. Redirecting...')
      setShowWarning(true)
      stopCamera(); window.speechSynthesis.cancel()
      setTimeout(() => router.push('/dashboard'), 3500)
    } else {
      playWarningBeep(count === 2 ? 'critical' : 'warn')
      setWarningMsg(
        type === 'tab'
          ? `Warning ${count}/3 — Tab/window switch detected. Third violation terminates session.`
          : `Warning ${count}/3 — Fullscreen exited. Stay in fullscreen during the interview.`
      )
      setShowWarning(true)
      setTimeout(() => setShowWarning(false), 5000)
    }
  }

  useEffect(() => {
    if (!sessionStarted || interviewDone) return
    const onVis  = () => { if (document.hidden) triggerViolation('tab') }
    const onBlur = () => triggerViolation('tab')
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('blur', onBlur)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('blur', onBlur)
    }
  }, [sessionStarted, interviewDone])

  // ── AI tool detection ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionStarted || interviewDone) return
    const onCopy = () => {
      setAiBlocked(true)
      setAiBlockMsg('Copying during interview is not allowed. This may indicate AI tool usage.')
      playWarningBeep('warn')
      setTimeout(() => setAiBlocked(false), 4000)
    }
    const onPaste = () => {
      setAiBlocked(true)
      setAiBlockMsg('Pasting detected — AI assistance is strictly prohibited.')
      playWarningBeep('critical')
      setTimeout(() => setAiBlocked(false), 4000)
    }
    const noCtx = (e: MouseEvent) => e.preventDefault()
    const devCheck = setInterval(() => {
      if (window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160) {
        setAiBlocked(true)
        setAiBlockMsg('Developer tools detected. AI tools and extensions are strictly blocked.')
        playWarningBeep('critical')
      }
    }, 2000)
    document.addEventListener('copy', onCopy)
    document.addEventListener('paste', onPaste)
    document.addEventListener('contextmenu', noCtx)
    return () => {
      document.removeEventListener('copy', onCopy)
      document.removeEventListener('paste', onPaste)
      document.removeEventListener('contextmenu', noCtx)
      clearInterval(devCheck)
    }
  }, [sessionStarted, interviewDone])

  // ── FIX 2c: TTS with best-available voice selection ───────────────────────
  function speakText(text: string) {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)

    // Pick the best available English voice — prefer en-IN, then any local English voice
    const voices = window.speechSynthesis.getVoices()
    const preferred =
      voices.find(v => v.lang === 'en-IN') ||
      voices.find(v => v.lang.startsWith('en') && v.localService) ||
      voices.find(v => v.lang.startsWith('en'))
    if (preferred) u.voice = preferred

    u.lang = 'en-IN'; u.rate = 0.88; u.pitch = 1.05
    u.onstart = () => setIsSpeaking(true)
    u.onend   = () => setIsSpeaking(false)
    u.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(u)
  }

  // ── Speech recognition ────────────────────────────────────────────────────
  function startListening() {
    window.speechSynthesis.cancel(); setIsSpeaking(false)
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Please use Chrome for speech recognition.'); return }
    const rec = new SR()
    rec.lang = 'en-IN'; rec.continuous = false; rec.interimResults = false

    rec.onstart = () => setIsListening(true)
    rec.onend   = () => setIsListening(false)

    rec.onresult = async (event: any) => {
      // FIX 2a: Stop recognizer immediately to prevent it firing twice
      rec.stop()

      if (correctionInProgressRef.current) return
      correctionInProgressRef.current = true

      const text = event.results[0][0].transcript
      setTranscript(text); setCorrecting(true)
      try {
        const res = await fetch('/api/interview/correct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: text, role, round }),
        })
        const data = await res.json()
        setCorrectedTranscript(data.corrected || text)
      } catch {
        // FIX 4b: On correction failure, fall back to raw transcript so Submit still appears
        setCorrectedTranscript(text)
      }
      setCorrecting(false)
      correctionInProgressRef.current = false
    }

    rec.onerror = () => {
      setIsListening(false)
      correctionInProgressRef.current = false
    }

    recognitionRef.current = rec
    rec.start()
  }

  function stopListening() { recognitionRef.current?.stop(); setIsListening(false) }

  // ── fetchAIQuestion ───────────────────────────────────────────────────────
  // Receives msgs as argument — no stale closure possible
  async function fetchAIQuestion(msgs: Message[]) {
    setAiLoading(true)
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, round, difficulty, messages: msgs }),
      })
      const data = await res.json()
      const reply = (data.reply || '').trim()

      // FIX 3b: Use exact string match instead of .includes() to avoid false positives
      if (reply === '__INTERVIEW_COMPLETE__' || reply === 'INTERVIEW_COMPLETE') {
        setInterviewDone(true)
        setCurrentQuestion('Interview complete. Generating your performance report…')
        // FIX 2b: Small delay before speaking so UI renders first
        setTimeout(() => speakText('Great effort. Your performance report is being generated.'), 150)

        setTimeout(() => {
          stopCamera()
          downloadRecording()
          // FIX 3c: Store messages in sessionStorage instead of URL param
          // URL params overflow at ~2000 chars — 8 questions easily exceeds that
          localStorage.setItem('interviewMessages',JSON.stringify(msgs))
          router.push(
            `/interview/report?role=${encodeURIComponent(role)}&round=${encodeURIComponent(round)}&difficulty=${encodeURIComponent(difficulty)}`
          )
        }, 3500)
      } else {
        setCurrentQuestion(reply)
        // FIX 2b: 150ms delay before speaking — lets React flush state update first
        setTimeout(() => speakText(reply), 150)
        setQuestionCount(p => p + 1)
        // Update BOTH ref and state together
        const next: Message[] = [...msgs, { role: 'assistant', content: reply }]
        messagesRef.current = next
        setMessages(next)
      }
    } catch {
      setCurrentQuestion('Connection error. Please check your network.')
    }
    setAiLoading(false)
  }

  // ── Start session ─────────────────────────────────────────────────────────
  async function handleStartSession() {
    enterFullscreen()
    await startCamera()
    setSessionStarted(true)
    await fetchAIQuestion([])
  }

  // ── Submit answer ─────────────────────────────────────────────────────────
  async function handleSubmitAnswer() {
    // FIX 3a: Prevent double-submit race condition
    if (submittingRef.current) return
    submittingRef.current = true

    // FIX 4b: Use whichever is available — corrected or raw transcript
    const answer = correctedTranscript.trim() || transcript.trim()
    if (!answer) { submittingRef.current = false; return }

    const userMsg: Message = { role: 'user', content: answer }
    // Build updated list from REF, not state — guarantees latest value
    const updated: Message[] = [...messagesRef.current, userMsg]
    messagesRef.current = updated
    setMessages(updated)
    setTranscript(''); setCorrectedTranscript('')
    await fetchAIQuestion(updated)

    submittingRef.current = false
  }

  useEffect(() => {
    return () => { stopCamera(); window.speechSynthesis.cancel() }
  }, [])

  const difficultyLabel = difficulty === 'easy' ? 'Entry Level' : difficulty === 'medium' ? 'Mid Level' : 'Senior Level'
  const roundLabel      = round === 'hr' ? 'HR' : round === 'technical' ? 'Technical' : 'Analytical'
  const diffColor       = difficulty === 'easy' ? '#10b981' : difficulty === 'medium' ? '#f59e0b' : '#ef4444'

  // ══════════════════════════════════════════════════════════════════════════
  // PRE-SESSION SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  if (!sessionStarted) {
    return (
      <div style={{
        minHeight: '100vh', background: '#050507',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', fontFamily: "'DM Sans', sans-serif",
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none',
          backgroundImage: `linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
        <div style={{
          position: 'fixed', top: '-20%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 400, borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(ellipse, rgba(16,185,129,0.08) 0%, transparent 70%)',
        }} />

        <div style={{ width: '100%', maxWidth: 520, position: 'relative', zIndex: 1 }}>
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
            <h1 style={{ color: '#f4f4f5', fontSize: 30, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
              Ready for your<br />
              <span style={{ color: '#10b981' }}>{roundLabel} Interview</span>?
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
              {role} &nbsp;·&nbsp; {difficultyLabel}
            </p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 20, padding: '28px 32px', marginBottom: 16,
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', margin: '0 0 20px' }}>
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

          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginBottom: 20, lineHeight: 1.6 }}>
            By starting, you consent to video & audio recording for review purposes.<br />
            Recording is saved locally to your device.
          </p>

          <button onClick={handleStartSession} style={{
            width: '100%', padding: '16px', borderRadius: 16, border: 'none',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            letterSpacing: '0.02em', fontFamily: 'inherit',
            boxShadow: '0 0 40px rgba(16,185,129,0.25), 0 4px 16px rgba(0,0,0,0.3)',
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
      {/* Background grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `linear-gradient(rgba(16,185,129,0.02) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(16,185,129,0.02) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />

      {/* AI Block Overlay */}
      {aiBlocked && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.93)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 16, textAlign: 'center', padding: 32,
        }}>
          <div style={{ fontSize: 48 }}>🚫</div>
          <h2 style={{ color: '#ef4444', fontSize: 22, fontWeight: 700, margin: 0 }}>Security Violation Detected</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, maxWidth: 360, lineHeight: 1.6, margin: 0 }}>{aiBlockMsg}</p>
          <button onClick={() => setAiBlocked(false)} style={{
            marginTop: 8, padding: '10px 28px', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
            color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}>Acknowledge & Continue</button>
        </div>
      )}

      {/* Warning Banner */}
      {showWarning && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: tabWarnings >= 3 ? 'rgba(127,29,29,0.98)' : 'rgba(67,20,7,0.98)',
          borderBottom: `2px solid ${tabWarnings >= 3 ? '#ef4444' : '#f97316'}`,
          backdropFilter: 'blur(12px)', color: '#fff', textAlign: 'center',
          padding: '16px 24px', fontSize: 14, fontWeight: 600,
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

      {/* Top Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 28px', zIndex: 50, flexShrink: 0,
        background: 'rgba(5,5,7,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px #ef4444', animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
            LIVE · {roundLabel} Round
          </span>
          {isRecording && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>⏺ REC</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          <span>{role}</span>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
          <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: elapsed > 1800 ? '#ef4444' : 'rgba(255,255,255,0.6)' }}>
            {fmt(elapsed)}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
          <span style={{ color: diffColor, fontWeight: 600 }}>{difficultyLabel}</span>
        </div>

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

      {/* Main Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '20px', flex: 1, padding: '20px 28px 24px',
        overflow: 'hidden', position: 'relative', zIndex: 1,
        maxWidth: 1600, width: '100%', margin: '0 auto', boxSizing: 'border-box',
      }}>

        {/* LEFT: Camera */}
        <div style={{
          background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 20, overflow: 'hidden', position: 'relative',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          minHeight: 0,
        }}>
          {/* FIX 4a: video is always in DOM — ref is always ready when srcObject is set via useEffect */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: 'block' }}
          />

          {/* Scanlines */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
          }} />

          {/* Corner brackets */}
          {[
            { top: 16,    left: 16,  borderTop:    '2px solid #10b981', borderLeft:   '2px solid #10b981' },
            { top: 16,    right: 16, borderTop:    '2px solid #10b981', borderRight:  '2px solid #10b981' },
            { bottom: 16, left: 16,  borderBottom: '2px solid #10b981', borderLeft:   '2px solid #10b981' },
            { bottom: 16, right: 16, borderBottom: '2px solid #10b981', borderRight:  '2px solid #10b981' },
          ].map((s, i) => <div key={i} style={{ position: 'absolute', width: 24, height: 24, ...s }} />)}

          {/* Proctoring badge */}
          <div style={{
            position: 'absolute', top: 20, left: 20,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(16,185,129,0.3)', padding: '6px 12px', borderRadius: 99,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#10b981', textTransform: 'uppercase' }}>
              Proctoring
            </span>
          </div>

          {/* Question counter */}
          <div style={{
            position: 'absolute', top: 20, right: 20,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 99,
            fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)',
          }}>
            Q {questionCount}
          </div>

          {/* Status chips */}
          <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {isSpeaking && (
              <div style={{
                padding: '7px 14px', borderRadius: 99,
                background: 'rgba(59,130,246,0.88)', backdropFilter: 'blur(6px)',
                border: '1px solid rgba(59,130,246,0.4)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                  {[4,6,8,6,4].map((h, i) => (
                    <div key={i} style={{ width: 2, height: h, background: '#fff', borderRadius: 99, animation: `wave 0.7s ease-in-out ${i*0.08}s infinite alternate` }} />
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
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'pulse 0.8s infinite' }} />
                <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>Recording…</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Interview Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden', minHeight: 0 }}>

          {/* Question card */}
          <div style={{
            flex: 1, borderRadius: 20, padding: '28px 32px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative',
            minHeight: 0,
          }}>
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
              padding: '5px 12px', borderRadius: 99, alignSelf: 'flex-start',
              background: isSpeaking ? 'rgba(59,130,246,0.08)' : 'rgba(16,185,129,0.08)',
              border: isSpeaking ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(16,185,129,0.2)',
              transition: 'all 0.3s',
            }}>
              🤖 {isSpeaking ? 'AI Interviewer Speaking' : `Question ${questionCount}`}
              {isSpeaking && (
                <span style={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                  {[3,5,7,5,3].map((h, i) => (
                    <div key={i} style={{ width: 2, height: h, background: '#3b82f6', borderRadius: 99, animation: `wave 0.6s ease-in-out ${i*0.1}s infinite alternate` }} />
                  ))}
                </span>
              )}
            </div>

            {aiLoading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.35)' }}>
                <div style={{ display: 'flex', gap: 5 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: `bounce 0.9s ease-in-out ${i*0.18}s infinite alternate`, opacity: 0.7 }} />
                  ))}
                </div>
                <span style={{ fontSize: 15 }}>Formulating next question…</span>
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <p style={{ color: '#f4f4f5', fontSize: 20, fontWeight: 500, lineHeight: 1.65, margin: 0, letterSpacing: '-0.01em' }}>
                  {currentQuestion || 'Your first question is loading…'}
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
              {/* FIX 4b: Show transcript box if either transcript or correctedTranscript has content */}
              {(transcript || correcting) && (
                <div style={{
                  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 14, padding: '16px 18px', marginBottom: 14,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
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
                    value={correcting ? '' : (correctedTranscript || transcript)}
                    onChange={e => setCorrectedTranscript(e.target.value)}
                    disabled={correcting}
                    placeholder={correcting ? 'Processing your speech…' : ''}
                    rows={3}
                    style={{
                      width: '100%', background: 'transparent', border: 'none',
                      padding: 0, color: '#e4e4e7', fontSize: 14, lineHeight: 1.6,
                      outline: 'none', resize: 'none', fontFamily: 'inherit',
                      boxSizing: 'border-box', opacity: correcting ? 0.4 : 1,
                    }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={aiLoading || isSpeaking || correcting}
                  style={{
                    flex: 1, padding: '14px 20px', borderRadius: 14,
                    border: isListening ? '1.5px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.09)',
                    background: isListening ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.03)',
                    color: isListening ? '#ef4444' : (isSpeaking || correcting || aiLoading) ? 'rgba(255,255,255,0.2)' : '#e4e4e7',
                    fontSize: 13, fontWeight: 600,
                    cursor: (aiLoading || isSpeaking || correcting) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {isListening
                    ? <><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 0.8s infinite' }} /> Stop Recording</>
                    : '🎤 Record Answer'}
                </button>

                {/* FIX 4b: Show Submit if EITHER correctedTranscript OR transcript has content */}
                {(correctedTranscript || transcript) && !isListening && !correcting && (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={aiLoading || isSpeaking}
                    style={{
                      padding: '14px 24px', borderRadius: 14, border: 'none',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0,
                      cursor: (aiLoading || isSpeaking) ? 'not-allowed' : 'pointer',
                      opacity: (aiLoading || isSpeaking) ? 0.4 : 1,
                      fontFamily: 'inherit', boxShadow: '0 0 24px rgba(16,185,129,0.2)',
                    }}
                  >
                    Submit →
                  </button>
                )}
              </div>

              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.18)', fontSize: 11, margin: '12px 0 0', letterSpacing: '0.03em' }}>
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
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes bounce { from{transform:translateY(0)} to{transform:translateY(-5px)} }
        @keyframes wave   { from{transform:scaleY(0.5)} to{transform:scaleY(1.5)} }
        * { -webkit-user-select:none; user-select:none; }
        textarea { -webkit-user-select:text !important; user-select:text !important; }
      `}</style>
    </div>
  )
}

export default function InterviewSession() {
  return (
    <Suspense fallback={<div style={{ background: '#09090b', minHeight: '100vh' }} />}>
      <InterviewSessionInner />
    </Suspense>
  )
}