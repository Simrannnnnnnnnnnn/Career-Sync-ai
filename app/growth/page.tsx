'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTheme } from '@/components/ThemeProvider'

type ProfileKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H'

interface L1Option {
  text: string
  profile: ProfileKey
}

interface L1Question {
  id: string
  q: string
  options: L1Option[]
}

interface L1Section {
  id: string
  label: string
  emoji: string
  subtitle: string
  color: string
  glow: string
  border: string
  accent: string
  questions: L1Question[]
}

const layer1Sections: L1Section[] = [
  {
    id: 'passion',
    label: 'Passion',
    emoji: '🔥',
    subtitle: 'What you love',
    color: 'var(--coral)',
    glow: 'color-mix(in srgb, var(--coral) 15%, transparent)',
    border: 'color-mix(in srgb, var(--coral) 25%, transparent)',
    accent: 'var(--coral-bg)',
    questions: [
      {
        id: 'p1',
        q: 'Which activity makes you completely lose track of time?',
        options: [
          { text: 'Digging into data, research, or patterns to find answers', profile: 'A' },
          { text: 'Building, coding, or engineering something from scratch', profile: 'B' },
          { text: 'Planning, organising and making sure a team hits its goals', profile: 'E' },
          { text: 'Designing, writing, or making something creative and beautiful', profile: 'D' },
          { text: 'Talking to people, listening, and helping them figure things out', profile: 'C' },
          { text: 'Running processes, logistics, or making systems more efficient', profile: 'F' },
        ],
      },
      {
        id: 'p2',
        q: 'If money was no concern, how would you spend your days?',
        options: [
          { text: 'Researching, writing, and uncovering new insights', profile: 'A' },
          { text: 'Building products or tinkering with technology', profile: 'B' },
          { text: 'Leading a team toward a big, meaningful mission', profile: 'E' },
          { text: 'Creating art, content, films, or design that moves people', profile: 'D' },
          { text: 'Teaching, coaching, or mentoring others to grow', profile: 'C' },
          { text: 'Starting and running my own business or venture', profile: 'G' },
        ],
      },
      {
        id: 'p3',
        q: 'Which conversation could you have for hours without getting tired?',
        options: [
          { text: 'How the economy, markets, or data trends shape decisions', profile: 'A' },
          { text: 'New tech, AI, or how to build something nobody has built yet', profile: 'B' },
          { text: 'Team dynamics, leadership styles, and organisational culture', profile: 'E' },
          { text: 'Art, storytelling, aesthetics, and creative expression', profile: 'D' },
          { text: 'People\'s psychology, wellbeing, and how to help them thrive', profile: 'C' },
          { text: 'Business models, growth strategy, and finding new opportunities', profile: 'G' },
        ],
      },
    ],
  },
  {
    id: 'proficiency',
    label: 'Proficiency',
    emoji: '⚡',
    subtitle: 'What you\'re good at',
    color: 'var(--purple)',
    glow: 'color-mix(in srgb, var(--purple) 15%, transparent)',
    border: 'color-mix(in srgb, var(--purple) 25%, transparent)',
    accent: 'var(--purple-bg)',
    questions: [
      {
        id: 'pr1',
        q: 'What do people consistently come to you for help with?',
        options: [
          { text: 'Making sense of complex information or data', profile: 'A' },
          { text: 'Fixing technical issues or building something digital', profile: 'B' },
          { text: 'Keeping a team on track or resolving team conflicts', profile: 'E' },
          { text: 'Making things look great or generating creative ideas', profile: 'D' },
          { text: 'Listening, giving advice, or navigating relationships', profile: 'C' },
          { text: 'Spotting inefficiencies and making processes work better', profile: 'F' },
        ],
      },
      {
        id: 'pr2',
        q: 'Which of these feels effortless to you — almost no real effort needed?',
        options: [
          { text: 'Spotting patterns and drawing solid conclusions from data', profile: 'A' },
          { text: 'Understanding how systems, software, or hardware works', profile: 'B' },
          { text: 'Reading people, building trust, and managing relationships', profile: 'C' },
          { text: 'Imagining entirely new concepts and original approaches', profile: 'D' },
          { text: 'Prioritising, delegating, and keeping multiple things moving', profile: 'E' },
          { text: 'Tracking details, following through, and keeping things consistent', profile: 'F' },
        ],
      },
      {
        id: 'pr3',
        q: 'Which compliment rings truest when people describe you?',
        options: [
          { text: '"You always think things through — very methodical and sharp"', profile: 'A' },
          { text: '"You can build or fix almost anything — super technical"', profile: 'B' },
          { text: '"You make people feel genuinely heard and understood"', profile: 'C' },
          { text: '"You see possibilities others completely miss — very imaginative"', profile: 'D' },
          { text: '"You know how to get the best out of a team — natural leader"', profile: 'E' },
          { text: '"You never drop the ball — incredibly reliable and organised"', profile: 'F' },
        ],
      },
    ],
  },
  {
    id: 'pay',
    label: 'Pay',
    emoji: '💰',
    subtitle: 'What the world pays for',
    color: 'var(--accent)',
    glow: 'color-mix(in srgb, var(--accent) 15%, transparent)',
    border: 'color-mix(in srgb, var(--accent) 25%, transparent)',
    accent: 'var(--accent-bg)',
    questions: [
      {
        id: 'pay1',
        q: 'Which area do you most want to grow your expertise in?',
        options: [
          { text: 'Data, analytics, finance, or research', profile: 'A' },
          { text: 'Software engineering, AI, or product development', profile: 'B' },
          { text: 'People, HR, culture, or organisational strategy', profile: 'C' },
          { text: 'Design, media, content, or brand building', profile: 'D' },
          { text: 'Leadership, strategy, and general management', profile: 'E' },
          { text: 'Operations, supply chain, or project management', profile: 'F' },
        ],
      },
      {
        id: 'pay2',
        q: 'What kind of career impact matters most to you?',
        options: [
          { text: 'Help organisations make smarter, data-driven decisions', profile: 'A' },
          { text: 'Build products that millions of people actually use', profile: 'B' },
          { text: 'Directly improve lives — health, education, wellbeing', profile: 'C' },
          { text: 'Inspire, entertain, or move people through your work', profile: 'D' },
          { text: 'Build great teams and drive an organisation to win', profile: 'E' },
          { text: 'Make businesses run more efficiently and profitably', profile: 'F' },
        ],
      },
      {
        id: 'pay3',
        q: 'Which industry excites you most for your future?',
        options: [
          { text: 'Finance, consulting, or market research', profile: 'A' },
          { text: 'Tech, SaaS, or AI companies', profile: 'B' },
          { text: 'Healthcare, education, or NGOs / social sector', profile: 'C' },
          { text: 'Media, gaming, fashion, or entertainment', profile: 'D' },
          { text: 'Corporates, conglomerates, or large institutions', profile: 'E' },
          { text: 'Manufacturing, logistics, retail, or infrastructure', profile: 'F' },
        ],
      },
    ],
  },
  {
    id: 'priorities',
    label: 'Priorities',
    emoji: '🎯',
    subtitle: 'What the world needs',
    color: 'var(--blue)',
    glow: 'color-mix(in srgb, var(--blue) 15%, transparent)',
    border: 'color-mix(in srgb, var(--blue) 25%, transparent)',
    accent: 'var(--blue-bg)',
    questions: [
      {
        id: 'pri1',
        q: 'Which work environment sounds most like where you\'d thrive?',
        options: [
          { text: 'Quiet, focused, and analytical — deep solo work with data', profile: 'A' },
          { text: 'Fast-paced technical team that ships products constantly', profile: 'B' },
          { text: 'People-first environment — coaching, advising, supporting others', profile: 'C' },
          { text: 'Creative studio with freedom and open experimentation', profile: 'D' },
          { text: 'Corporate or institutional setting with real decision-making authority', profile: 'E' },
          { text: 'Structured, execution-heavy environment focused on results', profile: 'F' },
        ],
      },
      {
        id: 'pri2',
        q: 'When your team is stuck, what role do you naturally step into?',
        options: [
          { text: 'I research the data and surface insights to make a decision', profile: 'A' },
          { text: 'I dive into the technical problem and find the solution', profile: 'B' },
          { text: 'I listen carefully and help the team reconnect and communicate', profile: 'C' },
          { text: 'I come up with a completely fresh, creative angle nobody thought of', profile: 'D' },
          { text: 'I take charge, set the direction, and get everyone aligned', profile: 'E' },
          { text: 'I map out the steps, assign tasks, and keep execution on track', profile: 'F' },
        ],
      },
      {
        id: 'pri3',
        q: 'What does your ideal career feel like day-to-day?',
        options: [
          { text: 'Solving meaningful analytical or strategic puzzles', profile: 'A' },
          { text: 'Shipping products that reach and delight real users', profile: 'B' },
          { text: 'Knowing each day I genuinely helped at least one person', profile: 'C' },
          { text: 'Expressing ideas and vision that move or inspire people', profile: 'D' },
          { text: 'Making important decisions and steering teams toward success', profile: 'E' },
          { text: 'Running tight operations and seeing results from great execution', profile: 'F' },
        ],
      },
    ],
  },
]

interface IkigaiQuestion {
  id: string
  q: string
  options: string[]
}

function getIkigaiQuestions(topProfiles: ProfileKey[]): IkigaiQuestion[] {
  const primary = topProfiles[0]
  const secondary = topProfiles[1]

  const profileLabels: Record<ProfileKey, string> = {
    A: 'Analytical',
    B: 'Builder / Engineer',
    C: 'People / Advisor',
    D: 'Creative',
    E: 'Manager / Leader',
    F: 'Operator / Executor',
    G: 'Entrepreneur',
    H: 'Advisor',
  }

  const missionOptions: Record<ProfileKey, string> = {
    A: 'Help organisations navigate complexity with sharp data and insights',
    B: 'Build the tools, products, and systems the world will rely on',
    C: 'Support, guide, and uplift people through meaningful human work',
    D: 'Shape culture, aesthetics, and meaning through creative output',
    E: 'Lead teams and institutions toward ambitious, lasting outcomes',
    F: 'Keep critical systems, operations, and supply chains running well',
    G: 'Create new ventures that solve real-world problems at scale',
    H: 'Provide strategic wisdom and counsel to those who need guidance',
  }

  const vocationOptions: Record<ProfileKey, string> = {
    A: 'Finance, strategy, consulting, or data science roles',
    B: 'Software engineering, product management, or deep tech roles',
    C: 'HR, L&D, social work, counselling, or community roles',
    D: 'Design, content, UX, brand, or entertainment roles',
    E: 'Senior management, business leadership, or corporate strategy',
    F: 'Operations, project management, supply chain, or logistics',
    G: 'Startups, venture, business development, or sales leadership',
    H: 'Advisory, policy, research, or specialist consulting roles',
  }

  const professionOptions: Record<ProfileKey, string> = {
    A: 'Synthesise complex information into clear, actionable decisions',
    B: 'Design and build scalable technical systems or products',
    C: 'Build deep trust, empathy, and lasting human relationships',
    D: 'Generate original ideas and bring them to beautiful life',
    E: 'Set vision, build culture, and execute through people',
    F: 'Manage detail, execution, and the systems that keep things running',
    G: 'Spot gaps in the market and hustle to build something new',
    H: 'Provide expert, trusted guidance on complex strategic questions',
  }

  const q1Options = [primary, secondary, ...(['A','B','C','D','E','F'] as ProfileKey[]).filter(p => p !== primary && p !== secondary).slice(0,2)]
    .map(p => missionOptions[p])

  const q2Options = [primary, secondary, ...(['A','B','C','D','E','F'] as ProfileKey[]).filter(p => p !== primary && p !== secondary).slice(0,2)]
    .map(p => vocationOptions[p])

  const q3Options = [primary, secondary, ...(['A','B','C','D','E','F'] as ProfileKey[]).filter(p => p !== primary && p !== secondary).slice(0,2)]
    .map(p => professionOptions[p])

  return [
    {
      id: 'ik1',
      q: '☯ Ikigai — Mission: What does the world most need from someone like you?',
      options: q1Options,
    },
    {
      id: 'ik2',
      q: '☯ Ikigai — Vocation: Which type of role would you be paid well for AND feel good about?',
      options: q2Options,
    },
    {
      id: 'ik3',
      q: '☯ Ikigai — Profession: At your best, what do you do that others can\'t easily replicate?',
      options: q3Options,
    },
    {
      id: 'ik4',
      q: '☯ Ikigai — Passion depth: If you could only do ONE type of work for the next 10 years, which feels truest to who you are?',
      options: [
        professionOptions[primary],
        professionOptions[secondary],
        `A blend — I want a role that mixes ${profileLabels[primary].split('/')[0].trim()} and ${profileLabels[secondary].split('/')[0].trim()} work`,
        'I am still exploring — I want to try multiple paths before committing',
      ],
    },
  ]
}

const layer1Questions = layer1Sections.flatMap(s => s.questions.map(q => ({ ...q, section: s })))
const LAYER1_TOTAL = layer1Questions.length

function computeTopProfiles(answers: { profile: ProfileKey }[]): ProfileKey[] {
  const counts: Record<string, number> = {}
  answers.forEach(a => { counts[a.profile] = (counts[a.profile] || 0) + 1 })
  return (Object.entries(counts).sort((a,b) => b[1]-a[1]).map(e => e[0]) as ProfileKey[])
}

const TABS = [
  { id: 'linkedin',     label: '🔗 LinkedIn',   fullLabel: '🔗 LinkedIn Optimizer' },
  { id: 'github',       label: '💻 GitHub',     fullLabel: '💻 GitHub Optimizer' },
  { id: 'portfolio',    label: '🌐 Portfolio',  fullLabel: '🌐 Portfolio Optimizer' },
  { id: 'career-test', label: '🧪 Career Test', fullLabel: '🧪 Career Path Test'  },
  { id: 'roadmap',     label: '🗺️ Roadmap',     fullLabel: '🗺️ Learning Roadmap'  },
]

const glass = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  backdropFilter: 'blur(12px)',
}

const inputClass =
  'w-full rounded-2xl px-4 py-3 text-[color:var(--text-primary)] text-sm placeholder-[color:var(--text-faint)] focus:outline-none focus:ring-1 transition resize-none'
function GrowthHubInner() {
  const [activeTab, setActiveTab] = useState('linkedin')
  const searchParams = useSearchParams()
  const { theme } = useTheme()

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) setActiveTab(tab)
  }, [searchParams])

  const [headline, setHeadline] = useState('')
  const [about, setAbout]       = useState('')
  const [skills, setSkills]     = useState('')
  const [linkedinLoading, setLinkedinLoading] = useState(false)
  const [linkedinResult,  setLinkedinResult]  = useState<any>(null)

  const [githubUrl, setGithubUrl] = useState('')
  const [githubLoading, setGithubLoading] = useState(false)
  const [githubResult, setGithubResult] = useState<any>(null)

  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [portfolioResult, setPortfolioResult] = useState<any>(null)

  const [testStarted,    setTestStarted]    = useState(false)
  const [layer,          setLayer]          = useState<1|2>(1)
  const [currentQ,       setCurrentQ]       = useState(0)
  const [l1Answers,      setL1Answers]      = useState<{ profile: ProfileKey; text: string }[]>([])
  const [l2Answers,      setL2Answers]      = useState<string[]>([])
  const [ikigaiQuestions,setIkigaiQuestions]= useState<IkigaiQuestion[]>([])
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [testLoading,    setTestLoading]    = useState(false)
  const [testResult,     setTestResult]     = useState<any>(null)

  const [roadmapCareer,  setRoadmapCareer]  = useState('')
  const [roadmapLoading, setRoadmapLoading] = useState(false)
  const [roadmapResult,  setRoadmapResult]  = useState<any>(null)

  async function analyzeLinkedIn() {
    if (!headline && !about && !skills) return
    setLinkedinLoading(true); setLinkedinResult(null)
    try {
      const res = await fetch('/api/linkedin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline, about, skills }),
      })
      setLinkedinResult(await res.json())
    } catch (err) { console.error(err) }
    finally { setLinkedinLoading(false) }
  }

  async function analyzeGitHub() {
    if (!githubUrl.trim()) return
    setGithubLoading(true); setGithubResult(null)
    try {
      const res = await fetch('/api/profile_analyzer/github', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubUrl }),
      })
      const data = await res.json()
      setGithubResult(data.result || null)
    } catch (err) { console.error(err) }
    finally { setGithubLoading(false) }
  }

  async function analyzePortfolio() {
    if (!portfolioUrl.trim()) return
    setPortfolioLoading(true); setPortfolioResult(null)
    try {
      const res = await fetch('/api/profile_analyzer/portfolio', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioUrl }),
      })
      const data = await res.json()
      setPortfolioResult(data.result || null)
    } catch (err) { console.error(err) }
    finally { setPortfolioLoading(false) }
  }

  function handleOptionClick(idx: number) {
    setSelectedOption(idx)

    setTimeout(() => {
      setSelectedOption(null)

      if (layer === 1) {
        const q = layer1Questions[currentQ]
        const chosen = q.options[idx]
        const newAnswers = [...l1Answers, chosen]
        setL1Answers(newAnswers)

        if (currentQ + 1 < LAYER1_TOTAL) {
          setCurrentQ(currentQ + 1)
        } else {
          const topProfiles = computeTopProfiles(newAnswers)
          const ikQs = getIkigaiQuestions(topProfiles)
          setIkigaiQuestions(ikQs)
          setCurrentQ(0)
          setLayer(2)
        }
      } else {
        const chosen = ikigaiQuestions[currentQ].options[idx]
        const newAnswers = [...l2Answers, chosen]
        setL2Answers(newAnswers)

        if (currentQ + 1 < ikigaiQuestions.length) {
          setCurrentQ(currentQ + 1)
        } else {
          submitTest(l1Answers, newAnswers)
        }
      }
    }, 320)
  }

  async function submitTest(
    finalL1: { profile: ProfileKey; text: string }[],
    finalL2: string[],
  ) {
    setTestLoading(true)
    try {
      const topProfiles = computeTopProfiles(finalL1)
      const res = await fetch('/api/career-test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          layer1Answers: finalL1.map(a => a.text),
          layer2Answers: finalL2,
          layer1Questions: layer1Questions.map(q => q.q),
          layer2Questions: ikigaiQuestions.map(q => q.q),
          topProfiles,
          framework: '4Ps-two-layer-Ikigai',
          sections: layer1Sections.map(s => s.label),
        }),
      })
      setTestResult(await res.json())
    } catch (err) { console.error(err) }
    finally { setTestLoading(false) }
  }

  function resetTest() {
    setCurrentQ(0); setL1Answers([]); setL2Answers([])
    setTestResult(null); setTestStarted(false)
    setSelectedOption(null); setLayer(1); setIkigaiQuestions([])
  }

  async function generateRoadmap() {
    if (!roadmapCareer) return
    setRoadmapLoading(true); setRoadmapResult(null)
    try {
      const res = await fetch('/api/roadmap', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ career: roadmapCareer }),
      })
      setRoadmapResult(await res.json())
    } catch (err) { console.error(err) }
    finally { setRoadmapLoading(false) }
  }

  function handleBuildRoadmap(careerTitle: string) {
    setRoadmapCareer(careerTitle); setActiveTab('roadmap')
  }

  const isLayer1     = layer === 1
  const currentSection = isLayer1 ? layer1Questions[currentQ]?.section : null
  const totalForLayer  = isLayer1 ? LAYER1_TOTAL : ikigaiQuestions.length
  const overallDone    = isLayer1 ? currentQ : LAYER1_TOTAL + currentQ
  const overallTotal   = LAYER1_TOTAL + (ikigaiQuestions.length || 4)

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}
      data-theme={theme}
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 6%, transparent) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[10%] right-[-5%] w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--purple) 5%, transparent) 0%, transparent 70%)' }} />
        <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full"
          style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--blue) 4%, transparent) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto px-5 md:px-10 pt-10 md:pt-16 pb-28">

        <div className="mb-8 md:mb-10">
          <Link href="/dashboard"
            className="inline-flex items-center gap-2 text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)] text-xs font-medium mb-5 transition tracking-wide">
            ← Back to Dashboard
          </Link>

          <div className="relative rounded-3xl p-6 md:p-8 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, transparent) 0%, transparent 60%)',
              border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)',
            }}>
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
              style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', filter: 'blur(40px)' }} />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full pointer-events-none"
              style={{ background: 'color-mix(in srgb, var(--blue) 8%, transparent)', filter: 'blur(30px)' }} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: 'color-mix(in srgb, var(--accent) 60%, transparent)' }}>Career Sync AI</span>
                <span className="text-[color:var(--border-strong)]">·</span>
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[color:var(--text-muted)]">Growth Hub</span>
              </div>
              <h1 className="text-2xl md:text-[2.5rem] font-black tracking-tight leading-none mb-3">
                Level Up <span style={{ color: 'var(--accent)' }}>Your Career</span> 🚀
              </h1>
              <p className="text-[color:var(--text-muted)] text-sm md:text-base">
                LinkedIn, GitHub, and portfolio optimizers · 4 P's career test · AI learning roadmap
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {[
                  { label: '🔥 Passion', bg: 'var(--coral-bg)', color: 'var(--coral)' },
                  { label: '⚡ Proficiency', bg: 'var(--purple-bg)', color: 'var(--purple)' },
                  { label: '💰 Pay', bg: 'var(--accent-bg)', color: 'var(--accent)' },
                  { label: '🎯 Priorities', bg: 'var(--blue-bg)', color: 'var(--blue)' },
                ].map((p, i) => (
                  <span key={i} className="text-[10px] px-2.5 py-1 rounded-full font-semibold"
                    style={{
                      background: p.bg,
                      border: `1px solid color-mix(in srgb, ${p.color} 20%, transparent)`,
                      color: p.color,
                    }}>{p.label}</span>
                ))}
                <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-strong)', color: 'var(--text-muted)' }}>
                  ☯ Ikigai
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-1 mb-8 p-1 rounded-2xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200"
              style={activeTab === tab.id ? {
                background: 'var(--accent-bg)',
                border: '1px solid var(--accent-border)',
                color: 'var(--accent)',
                boxShadow: '0 0 20px var(--accent-bg) inset',
              } : { color: 'var(--text-muted)', border: '1px solid transparent' }}>
              <span className="hidden md:inline">{tab.fullLabel}</span>
              <span className="md:hidden">{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'linkedin' && (
          <div className="space-y-4">
            <div className="rounded-2xl px-4 py-3 flex items-start gap-3"
              style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}>
              <span style={{ color: 'var(--accent)' }} className="mt-0.5 text-base">💡</span>
              <p className="text-[color:var(--text-secondary)] text-xs leading-relaxed">
                Paste your LinkedIn sections below. AI will score your profile, rewrite your headline & about, and identify missing keywords recruiters search for.
              </p>
            </div>

            <div>
              <label className="text-[color:var(--text-muted)] text-[10px] font-bold tracking-[0.15em] uppercase mb-2 block">LinkedIn Headline</label>
              <input type="text" value={headline} onChange={e => setHeadline(e.target.value)}
                placeholder="e.g. ML Engineer | Python | Open to Work"
                className={inputClass} style={glass} />
            </div>
            <div>
              <label className="text-[color:var(--text-muted)] text-[10px] font-bold tracking-[0.15em] uppercase mb-2 block">About Section</label>
              <textarea value={about} onChange={e => setAbout(e.target.value)} rows={5}
                placeholder="Paste your LinkedIn About section here..."
                className={inputClass} style={glass} />
            </div>
            <div>
              <label className="text-[color:var(--text-muted)] text-[10px] font-bold tracking-[0.15em] uppercase mb-2 block">Skills (comma separated)</label>
              <input type="text" value={skills} onChange={e => setSkills(e.target.value)}
                placeholder="e.g. Python, Machine Learning, Flask, MongoDB"
                className={inputClass} style={glass} />
            </div>

            <button onClick={analyzeLinkedIn}
              disabled={linkedinLoading || (!headline && !about && !skills)}
              className="w-full font-bold py-3.5 rounded-2xl transition-all text-sm disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: linkedinLoading ? 'var(--accent-bg)' : `linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 80%, black) 100%)`,
                color: '#fff',
                boxShadow: linkedinLoading ? 'none' : '0 0 40px var(--accent-bg)',
              }}>
              {linkedinLoading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full animate-spin" style={{ border: '2px solid color-mix(in srgb, var(--accent) 30%, transparent)', borderTopColor: 'var(--accent)' }} />
                    Analyzing your profile...
                  </span>
                : '🔍 Analyze LinkedIn Profile'}
            </button>

            {linkedinResult && (
              <div className="space-y-3 mt-2">
                <div className="rounded-2xl p-5" style={glass}>
                  <p className="text-[color:var(--text-muted)] text-[10px] font-bold tracking-[0.15em] uppercase mb-3">Profile Score</p>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-5xl font-black"
                      style={{ color: linkedinResult.score>=70 ? 'var(--accent)' : linkedinResult.score>=50 ? 'var(--amber)' : '#ef4444' }}>
                      {linkedinResult.score}
                    </span>
                    <span className="text-[color:var(--text-faint)] text-xl mb-1.5">/100</span>
                  </div>
                  <div className="h-1 rounded-full mb-3" style={{ background: 'var(--border)' }}>
                    <div className="h-1 rounded-full transition-all duration-700"
                      style={{
                        width: `${linkedinResult.score}%`,
                        background: linkedinResult.score>=70
                          ? 'linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 60%, white))'
                          : linkedinResult.score>=50
                          ? 'linear-gradient(90deg, var(--amber), color-mix(in srgb, var(--amber) 60%, white))'
                          : 'linear-gradient(90deg,#ef4444,#f87171)',
                      }} />
                  </div>
                  <p className="text-[color:var(--text-secondary)] text-sm">{linkedinResult.verdict}</p>
                </div>
                {linkedinResult.improvedHeadline && (
                  <div className="rounded-2xl p-5" style={glass}>
                    <p className="text-[color:var(--text-muted)] text-[10px] font-bold tracking-[0.15em] uppercase mb-2">✨ Improved Headline</p>
                    <p className="text-[color:var(--text-primary)] font-semibold text-sm leading-relaxed">{linkedinResult.improvedHeadline}</p>
                  </div>
                )}
                {linkedinResult.improvedAbout && (
                  <div className="rounded-2xl p-5" style={glass}>
                    <p className="text-[color:var(--text-muted)] text-[10px] font-bold tracking-[0.15em] uppercase mb-2">✨ Improved About</p>
                    <p className="text-[color:var(--text-secondary)] text-sm leading-relaxed">{linkedinResult.improvedAbout}</p>
                  </div>
                )}
                {linkedinResult.missingKeywords?.length > 0 && (
                  <div className="rounded-2xl p-5" style={glass}>
                    <p className="text-[color:var(--text-muted)] text-[10px] font-bold tracking-[0.15em] uppercase mb-3">🔑 Missing Keywords</p>
                    <div className="flex flex-wrap gap-2">
                      {linkedinResult.missingKeywords.map((kw: string, i: number) => (
                        <span key={i} className="text-xs px-3 py-1.5 rounded-full font-medium"
                          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#f87171' }}>
                          + {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {linkedinResult.improvements?.length > 0 && (
                  <div className="rounded-2xl p-5" style={glass}>
                    <p className="text-[color:var(--text-muted)] text-[10px] font-bold tracking-[0.15em] uppercase mb-3">📈 Action Items</p>
                    <ul className="space-y-2.5">
                      {linkedinResult.improvements.map((tip: string, i: number) => (
                        <li key={i} className="flex gap-3 text-sm">
                          <span style={{ color: 'var(--accent)' }} className="font-bold mt-0.5 flex-shrink-0">→</span>
                          <span className="text-[color:var(--text-secondary)] leading-relaxed">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'github' && (
          <div className="space-y-4">
            <div className="rounded-2xl px-4 py-3 flex items-start gap-3"
              style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}>
              <span style={{ color: 'var(--accent)' }} className="mt-0.5 text-base">💻</span>
              <p className="text-[color:var(--text-secondary)] text-xs leading-relaxed">
                Paste your GitHub profile URL. We will review your repositories, highlight your strongest work, and suggest which projects should appear on your resume and portfolio.
              </p>
            </div>

            <div>
              <label className="text-[color:var(--text-muted)] text-[10px] font-bold tracking-[0.15em] uppercase mb-2 block">GitHub Profile URL</label>
              <input type="text" value={githubUrl} onChange={e => setGithubUrl(e.target.value)}
                placeholder="https://github.com/yourusername"
                className={inputClass} style={glass} />
            </div>

            <button onClick={analyzeGitHub}
              disabled={githubLoading || !githubUrl.trim()}
              className="w-full font-bold py-3.5 rounded-2xl transition-all text-sm disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: githubLoading ? 'var(--accent-bg)' : `linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 80%, black) 100%)`,
                color: '#fff',
                boxShadow: githubLoading ? 'none' : '0 0 40px var(--accent-bg)',
              }}>
              {githubLoading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full animate-spin" style={{ border: '2px solid color-mix(in srgb, var(--accent) 30%, transparent)', borderTopColor: 'var(--accent)' }} />
                    Analyzing your GitHub profile...
                  </span>
                : '🔍 Analyze GitHub Profile'}
            </button>

            {githubResult && (
              <div className="space-y-3 mt-2">
                <div className="rounded-2xl p-5" style={glass}>
                  <p className="text-[color:var(--text-muted)] text-[10px] font-bold tracking-[0.15em] uppercase mb-3">Profile Score</p>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-5xl font-black" style={{ color: githubResult.score >= 70 ? 'var(--accent)' : githubResult.score >= 50 ? 'var(--amber)' : '#ef4444' }}>{githubResult.score}</span>
                    <span className="text-[color:var(--text-faint)] text-xl mb-1.5">/100</span>
                  </div>
                  <p className="text-[color:var(--text-secondary)] text-sm mb-2">{githubResult.verdict}</p>
                  <p className="text-[color:var(--text-muted)] text-xs leading-relaxed">Use the strongest repositories as resume bullet points and portfolio case studies.</p>
                </div>
                {githubResult.profileSummary && (
                  <div className="rounded-2xl p-5" style={glass}>
                    <p className="text-[color:var(--text-muted)] text-[10px] font-bold tracking-[0.15em] uppercase mb-3">Quick Profile Snapshot</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-[color:var(--text-faint)] text-[10px] uppercase tracking-wider">Repositories</p>
                        <p className="text-[color:var(--text-primary)] font-semibold">{githubResult.profileSummary.totalRepos}</p>
                      </div>
                      <div>
                        <p className="text-[color:var(--text-faint)] text-[10px] uppercase tracking-wider">Languages</p>
                        <p className="text-[color:var(--text-primary)] font-semibold">{(githubResult.profileSummary.activeLanguages || []).join(', ') || '—'}</p>
                      </div>
                    </div>
                  </div>
                )}
                {githubResult.strengths?.length > 0 && (
                  <div className="rounded-2xl p-5" style={glass}>
                    <p className="text-[color:var(--text-muted)] text-[10px] font-bold tracking-[0.15em] uppercase mb-3">✅ Strengths</p>
                    <ul className="space-y-2">
                      {githubResult.strengths.map((item: string, i: number) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span style={{ color: 'var(--accent)' }} className="font-bold">•</span>
                          <span className="text-[color:var(--text-secondary)]">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {githubResult.improvements?.length > 0 && (
                  <div className="rounded-2xl p-5" style={glass}>
                    <p className="text-[color:var(--text-muted)] text-[10px] font-bold tracking-[0.15em] uppercase mb-3">📈 What to Improve</p>
                    <ul className="space-y-2">
                      {githubResult.improvements.map((item: string, i: number) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span style={{ color: 'var(--amber)' }} className="font-bold">→</span>
                          <span className="text-[color:var(--text-secondary)]">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {githubResult.quickWins?.length > 0 && (
                  <div className="rounded-2xl p-5" style={glass}>
                    <p className="text-[color:var(--text-muted)] text-[10px] font-bold tracking-[0.15em] uppercase mb-3">⚡ Quick Wins</p>
                    <ul className="space-y-2">
                      {githubResult.quickWins.map((item: string, i: number) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span style={{ color: 'var(--purple)' }} className="font-bold">•</span>
                          <span className="text-[color:var(--text-secondary)]">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="space-y-4">
            <div className="rounded-2xl px-4 py-3 flex items-start gap-3"
              style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}>
              <span style={{ color: 'var(--accent)' }} className="mt-0.5 text-base">🌐</span>
              <p className="text-[color:var(--text-secondary)] text-xs leading-relaxed">
                Share your portfolio website URL. We will review the content structure, clarity, and recruiter-friendliness, then suggest what to fix to make it stronger.
              </p>
            </div>

            <div>
              <label className="text-[color:var(--text-muted)] text-[10px] font-bold tracking-[0.15em] uppercase mb-2 block">Portfolio Website URL</label>
              <input type="text" value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)}
                placeholder="https://yourportfolio.com"
                className={inputClass} style={glass} />
            </div>

            <button onClick={analyzePortfolio}
              disabled={portfolioLoading || !portfolioUrl.trim()}
              className="w-full font-bold py-3.5 rounded-2xl transition-all text-sm disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: portfolioLoading ? 'var(--accent-bg)' : `linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 80%, black) 100%)`,
                color: '#fff',
                boxShadow: portfolioLoading ? 'none' : '0 0 40px var(--accent-bg)',
              }}>
              {portfolioLoading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full animate-spin" style={{ border: '2px solid color-mix(in srgb, var(--accent) 30%, transparent)', borderTopColor: 'var(--accent)' }} />
                    Reviewing your portfolio...
                  </span>
                : '🔍 Analyze Portfolio'}
            </button>

            {portfolioResult && (
              <div className="space-y-3 mt-2">
                <div className="rounded-2xl p-5" style={glass}>
                  <p className="text-[color:var(--text-muted)] text-[10px] font-bold tracking-[0.15em] uppercase mb-3">Portfolio Score</p>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-5xl font-black" style={{ color: portfolioResult.score >= 70 ? 'var(--accent)' : portfolioResult.score >= 50 ? 'var(--amber)' : '#ef4444' }}>{portfolioResult.score}</span>
                    <span className="text-[color:var(--text-faint)] text-xl mb-1.5">/100</span>
                  </div>
                  <p className="text-[color:var(--text-secondary)] text-sm mb-2">{portfolioResult.verdict}</p>
                  <p className="text-[color:var(--text-muted)] text-xs leading-relaxed">Your portfolio should clearly show what you built, the impact, and why recruiters should care.</p>
                </div>
                {portfolioResult.detected && (
                  <div className="rounded-2xl p-5" style={glass}>
                    <p className="text-[color:var(--text-muted)] text-[10px] font-bold tracking-[0.15em] uppercase mb-3">What We Detected</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-[color:var(--text-faint)] text-[10px] uppercase tracking-wider">About Section</p>
                        <p className="text-[color:var(--text-primary)] font-semibold">{portfolioResult.detected.hasAboutSection ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <p className="text-[color:var(--text-faint)] text-[10px] uppercase tracking-wider">Projects</p>
                        <p className="text-[color:var(--text-primary)] font-semibold">{portfolioResult.detected.hasProjects ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <p className="text-[color:var(--text-faint)] text-[10px] uppercase tracking-wider">Contact Info</p>
                        <p className="text-[color:var(--text-primary)] font-semibold">{portfolioResult.detected.hasContactInfo ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <p className="text-[color:var(--text-faint)] text-[10px] uppercase tracking-wider">Resume Link</p>
                        <p className="text-[color:var(--text-primary)] font-semibold">{portfolioResult.detected.hasResumeLink ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>
                )}
                {portfolioResult.strengths?.length > 0 && (
                  <div className="rounded-2xl p-5" style={glass}>
                    <p className="text-[color:var(--text-muted)] text-[10px] font-bold tracking-[0.15em] uppercase mb-3">✅ Strengths</p>
                    <ul className="space-y-2">
                      {portfolioResult.strengths.map((item: string, i: number) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span style={{ color: 'var(--accent)' }} className="font-bold">•</span>
                          <span className="text-[color:var(--text-secondary)]">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {portfolioResult.improvements?.length > 0 && (
                  <div className="rounded-2xl p-5" style={glass}>
                    <p className="text-[color:var(--text-muted)] text-[10px] font-bold tracking-[0.15em] uppercase mb-3">📈 What to Improve</p>
                    <ul className="space-y-2">
                      {portfolioResult.improvements.map((item: string, i: number) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span style={{ color: 'var(--amber)' }} className="font-bold">→</span>
                          <span className="text-[color:var(--text-secondary)]">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {portfolioResult.quickWins?.length > 0 && (
                  <div className="rounded-2xl p-5" style={glass}>
                    <p className="text-[color:var(--text-muted)] text-[10px] font-bold tracking-[0.15em] uppercase mb-3">⚡ Quick Wins</p>
                    <ul className="space-y-2">
                      {portfolioResult.quickWins.map((item: string, i: number) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span style={{ color: 'var(--purple)' }} className="font-bold">•</span>
                          <span className="text-[color:var(--text-secondary)]">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'career-test' && (
          <div className="max-w-2xl mx-auto">

            {!testStarted && !testResult && (
              <div className="space-y-5">
                <div className="relative rounded-3xl p-7 md:p-8 overflow-hidden text-center"
                  style={{
                    background: 'linear-gradient(135deg, color-mix(in srgb, var(--purple) 10%, transparent) 0%, color-mix(in srgb, var(--blue) 6%, transparent) 100%)',
                    border: '1px solid color-mix(in srgb, var(--purple) 20%, transparent)',
                  }}>
                  <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full pointer-events-none"
                    style={{ background: 'color-mix(in srgb, var(--purple) 15%, transparent)', filter: 'blur(35px)' }} />
                  <div className="relative">
                    <div className="text-4xl mb-3">🧪</div>
                    <h2 className="text-xl md:text-2xl font-black mb-1">Career Path Test</h2>
                    <p className="text-[color:var(--text-muted)] text-sm mb-1">
                      2-layer system · {LAYER1_TOTAL} + 4 adaptive questions
                    </p>
                    <p className="text-[color:var(--text-muted)] text-xs mb-2">
                      Layer 1 covers all career types across 4 P's — analytical, creative, management, operations, social, and more.
                    </p>
                    <p className="text-[color:var(--text-muted)] text-xs mb-6">
                      Layer 2 unlocks personalised Ikigai questions based on YOUR specific profile pattern.
                    </p>
                    <button onClick={() => setTestStarted(true)}
                      className="font-bold px-8 py-3 rounded-2xl transition-all text-sm"
                      style={{ background: 'linear-gradient(135deg, var(--purple), var(--indigo))', color: '#fff', boxShadow: '0 0 30px color-mix(in srgb, var(--purple) 25%, transparent)' }}>
                      Start the Test →
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl p-5 space-y-4"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <p className="text-[color:var(--text-muted)] text-[10px] font-bold tracking-[0.15em] uppercase">How It Works</p>
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black"
                      style={{ background: 'var(--coral-bg)', border: '1px solid color-mix(in srgb, var(--coral) 25%, transparent)', color: 'var(--coral)' }}>
                      1
                    </div>
                    <div>
                      <p className="text-[color:var(--text-primary)] text-sm font-bold mb-0.5">Layer 1 — 4 P's Profiling ({LAYER1_TOTAL} questions)</p>
                      <p className="text-[color:var(--text-muted)] text-xs leading-relaxed">
                        Broad questions across Passion, Proficiency, Pay, and Priorities. Options cover ALL career types — analytical, creative, management, operations, social, entrepreneurial, and more. No bias toward tech.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black"
                      style={{ background: 'var(--purple-bg)', border: '1px solid color-mix(in srgb, var(--purple) 25%, transparent)', color: 'var(--purple)' }}>
                      2
                    </div>
                    <div>
                      <p className="text-[color:var(--text-primary)] text-sm font-bold mb-0.5">Layer 2 — Personalised Ikigai (4 adaptive questions)</p>
                      <p className="text-[color:var(--text-muted)] text-xs leading-relaxed">
                        Based on your Layer 1 profile, the system generates Ikigai questions with options tailored to YOUR specific profile mix — not generic options. This finds your true career sweet spot.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {layer1Sections.map(s => (
                    <div key={s.id} className="rounded-2xl p-4"
                      style={{ background: s.accent, border: `1px solid ${s.border}` }}>
                      <div className="text-xl mb-2">{s.emoji}</div>
                      <p className="font-bold text-sm text-[color:var(--text-primary)]">{s.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: s.color }}>{s.subtitle}</p>
                      <p className="text-[color:var(--text-muted)] text-xs mt-1">{s.questions.length} questions</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {testStarted && !testResult && !testLoading && (
              <div className="space-y-5">

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isLayer1 ? (
                        <>
                          <span className="text-sm font-black" style={{ color: currentSection?.color }}>
                            {currentSection?.emoji} {currentSection?.label}
                          </span>
                          <span className="text-[color:var(--text-faint)] text-xs">— {currentSection?.subtitle}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-black" style={{ color: 'var(--purple)' }}>☯ Ikigai</span>
                          <span className="text-[color:var(--text-faint)] text-xs">— Depth questions</span>
                        </>
                      )}
                    </div>
                    <span className="text-[color:var(--text-muted)] text-xs font-semibold">
                      {overallDone + 1} / {overallTotal}
                    </span>
                  </div>

                  <div className="flex gap-1">
                    <div className="relative flex-none rounded-full overflow-hidden h-1"
                      style={{ width: `${(LAYER1_TOTAL / overallTotal) * 100}%`, background: 'var(--border)' }}>
                      <div className="h-1 rounded-full transition-all duration-500 absolute top-0 left-0"
                        style={{
                          width: isLayer1
                            ? `${(currentQ / LAYER1_TOTAL) * 100}%`
                            : '100%',
                          background: 'linear-gradient(90deg, var(--coral), var(--accent))',
                        }} />
                    </div>
                    <div className="relative flex-1 rounded-full overflow-hidden h-1"
                      style={{ background: 'var(--border)' }}>
                      <div className="h-1 rounded-full transition-all duration-500 absolute top-0 left-0"
                        style={{
                          width: isLayer1
                            ? '0%'
                            : `${(currentQ / (ikigaiQuestions.length || 4)) * 100}%`,
                          background: 'linear-gradient(90deg, var(--purple), var(--indigo))',
                        }} />
                    </div>
                  </div>

                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-[color:var(--text-faint)] font-semibold">4 P's Layer</span>
                    <span className="text-[9px] font-semibold" style={{ color: isLayer1 ? 'var(--text-faint)' : 'var(--purple)' }}>
                      ☯ Ikigai Layer
                    </span>
                  </div>
                </div>

                {isLayer1 && (
                  <div className="flex gap-2">
                    {layer1Sections.map((s, si) => {
                      const sStart = layer1Sections.slice(0, si).reduce((a, sec) => a + sec.questions.length, 0)
                      const sEnd   = sStart + s.questions.length
                      const isAct  = currentQ >= sStart && currentQ < sEnd
                      const isDone = currentQ >= sEnd
                      return (
                        <div key={s.id} className="flex-1">
                          <div className="flex items-center gap-1 mb-1">
                            <span style={{ opacity: isAct || isDone ? 1 : 0.3 }} className="text-xs">{s.emoji}</span>
                            <span className="text-[9px] font-bold tracking-wider uppercase"
                              style={{ color: isAct ? s.color : 'var(--text-faint)' }}>
                              {s.label}
                            </span>
                          </div>
                          <div className="h-0.5 rounded-full" style={{ background: 'var(--border)' }}>
                            <div className="h-0.5 rounded-full transition-all duration-500"
                              style={{
                                width: isDone ? '100%' : isAct
                                  ? `${((currentQ - sStart) / s.questions.length) * 100}%`
                                  : '0%',
                                background: s.color,
                              }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {!isLayer1 && (
                  <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
                    style={{ background: 'color-mix(in srgb, var(--purple) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--purple) 20%, transparent)' }}>
                    <span className="text-lg">☯</span>
                    <div>
                      <p className="text-xs font-bold" style={{ color: 'var(--purple)' }}>Layer 2 — Personalised Ikigai Questions</p>
                      <p className="text-[10px] text-[color:var(--text-muted)] mt-0.5">
                        These 4 questions are tailored to your profile from Layer 1.
                      </p>
                    </div>
                  </div>
                )}

                <div className="rounded-2xl p-5 md:p-6"
                  style={{
                    background: isLayer1
                      ? `linear-gradient(135deg, ${currentSection?.accent} 0%, transparent 100%)`
                      : 'linear-gradient(135deg, color-mix(in srgb, var(--purple) 8%, transparent) 0%, transparent 100%)',
                    border: isLayer1
                      ? `1px solid ${currentSection?.border}`
                      : '1px solid color-mix(in srgb, var(--purple) 20%, transparent)',
                  }}>
                  <p className="text-base md:text-lg font-bold mb-5 leading-relaxed">
                    {isLayer1
                      ? layer1Questions[currentQ].q
                      : ikigaiQuestions[currentQ]?.q}
                  </p>
                  <div className="space-y-2.5">
                    {(isLayer1
                      ? layer1Questions[currentQ].options.map(o => o.text)
                      : ikigaiQuestions[currentQ]?.options ?? []
                    ).map((opt, i) => (
                      <button key={i} onClick={() => handleOptionClick(i)}
                        className="w-full text-left px-4 py-3.5 rounded-xl text-sm transition-all duration-200 font-medium"
                        style={{
                          background: selectedOption === i
                            ? isLayer1 ? currentSection?.accent : 'color-mix(in srgb, var(--purple) 10%, transparent)'
                            : 'var(--bg-muted)',
                          border: selectedOption === i
                            ? `1px solid ${isLayer1 ? currentSection?.color : 'var(--purple)'}`
                            : '1px solid var(--border)',
                          color: selectedOption === i ? '#fff' : 'var(--text-muted)',
                          transform: selectedOption === i ? 'scale(1.01)' : 'scale(1)',
                        }}>
                        <span className="text-xs font-black mr-3"
                          style={{ color: selectedOption === i ? (isLayer1 ? currentSection?.color : 'var(--purple)') : 'var(--text-faint)' }}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {testLoading && (
              <div className="text-center mt-20 space-y-5">
                <div className="relative w-14 h-14 mx-auto">
                  <div className="absolute inset-0 rounded-full animate-spin"
                    style={{ border: '2px solid color-mix(in srgb, var(--purple) 30%, transparent)', borderTopColor: 'var(--purple)' }} />
                  <div className="absolute inset-2 rounded-full animate-spin"
                    style={{ border: '2px solid color-mix(in srgb, var(--blue) 30%, transparent)', borderTopColor: 'var(--blue)', animationDirection: 'reverse', animationDuration: '0.8s' }} />
                </div>
                <div>
                  <p className="text-[color:var(--text-secondary)] text-sm font-semibold mb-1">AI is mapping your career DNA</p>
                  <p className="text-[color:var(--text-muted)] text-xs">Combining 4 P's profile + Ikigai depth analysis</p>
                </div>
              </div>
            )}

            {testResult && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <p className="text-[color:var(--text-muted)] text-xs tracking-widest uppercase mb-1">Your Ikigai × 4 P's Analysis</p>
                  <h2 className="text-xl md:text-2xl font-black">🎯 Career Matches</h2>
                </div>

                {testResult.ikigaiSummary && (
                  <div className="rounded-2xl p-5"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <p className="text-[color:var(--text-muted)] text-[10px] font-bold tracking-[0.15em] uppercase mb-2">☯ Your Ikigai Profile</p>
                    <p className="text-[color:var(--text-secondary)] text-sm leading-relaxed">{testResult.ikigaiSummary}</p>
                  </div>
                )}

                {testResult.profileBreakdown && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {layer1Sections.map(s => (
                      <div key={s.id} className="rounded-xl p-3 text-center"
                        style={{ background: s.accent, border: `1px solid ${s.border}` }}>
                        <div className="text-lg mb-1">{s.emoji}</div>
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: s.color }}>{s.label}</p>
                        <p className="text-[color:var(--text-primary)] text-xs mt-1 font-semibold">{testResult.profileBreakdown[s.id] || '—'}</p>
                      </div>
                    ))}
                  </div>
                )}

                {testResult.careers?.map((career: any, i: number) => (
                  <div key={i} className="rounded-2xl p-5"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="font-black text-[color:var(--text-primary)] text-base">{career.title}</p>
                        {career.ikigaiFit && (
                          <p className="text-xs mt-0.5" style={{ color: 'var(--purple)' }}>☯ {career.ikigaiFit}</p>
                        )}
                      </div>
                      <span className="font-black text-lg flex-shrink-0"
                        style={{ color: career.match>=80 ? 'var(--accent)' : career.match>=60 ? 'var(--purple)' : 'var(--amber)' }}>
                        {career.match}%
                      </span>
                    </div>
                    <div className="h-1 rounded-full mb-3" style={{ background: 'var(--border)' }}>
                      <div className="h-1 rounded-full transition-all"
                        style={{
                          width: `${career.match}%`,
                          background: career.match>=80
                            ? 'linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 60%, white))'
                            : career.match>=60
                            ? 'linear-gradient(90deg, var(--purple), color-mix(in srgb, var(--purple) 60%, white))'
                            : 'linear-gradient(90deg, var(--amber), color-mix(in srgb, var(--amber) 60%, white))',
                        }} />
                    </div>
                    <p className="text-[color:var(--text-muted)] text-xs leading-relaxed mb-3">{career.reason}</p>
                    {career.strengths && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {career.strengths.map((s: string, j: number) => (
                          <span key={j} className="text-[10px] px-2 py-1 rounded-full"
                            style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                    <button onClick={() => handleBuildRoadmap(career.title)}
                      className="text-xs px-3.5 py-1.5 rounded-xl font-semibold transition-all"
                      style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }}>
                      🗺️ Build Roadmap →
                    </button>
                  </div>
                ))}

                <button onClick={resetTest}
                  className="w-full py-3 rounded-2xl text-sm text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)] transition font-medium"
                  style={{ border: '1px solid var(--border)' }}>
                  🔄 Retake Test
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'roadmap' && (
          <div className="space-y-4">
            <div className="rounded-2xl px-4 py-3 flex items-start gap-3"
              style={{ background: 'color-mix(in srgb, var(--accent) 5%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 10%, transparent)' }}>
              <span style={{ color: 'var(--accent)' }} className="mt-0.5">🗺️</span>
              <p className="text-[color:var(--text-muted)] text-xs leading-relaxed">
                Enter your target career and AI will generate a phased, resource-backed learning roadmap.
              </p>
            </div>
            <div>
              <label className="text-[color:var(--text-muted)] text-[10px] font-bold tracking-[0.15em] uppercase mb-2 block">Target Career</label>
              <input type="text" value={roadmapCareer} onChange={e => setRoadmapCareer(e.target.value)}
                placeholder="e.g. HR Manager, Operations Lead, Data Analyst, UX Designer"
                className={inputClass} style={glass} />
            </div>
            <button onClick={generateRoadmap}
              disabled={roadmapLoading || !roadmapCareer}
              className="w-full font-bold py-3.5 rounded-2xl transition-all text-sm disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: roadmapLoading ? 'var(--accent-bg)' : `linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 80%, black) 100%)`,
                color: '#fff',
                boxShadow: roadmapLoading ? 'none' : '0 0 40px var(--accent-bg)',
              }}>
              {roadmapLoading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full animate-spin" style={{ border: '2px solid color-mix(in srgb, var(--accent) 30%, transparent)', borderTopColor: 'var(--accent)' }} />
                    Building your roadmap...
                  </span>
                : '🗺️ Generate Learning Roadmap'}
            </button>

            {roadmapResult && (
              <div className="space-y-3 mt-2">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-lg md:text-xl font-black">{roadmapResult.title}</h2>
                  <span className="text-[color:var(--text-muted)] text-xs font-semibold">⏱ {roadmapResult.totalMonths} months</span>
                </div>
                <div className="relative">
                  {roadmapResult.phases?.map((phase: any, i: number) => (
                    <div key={i} className="flex gap-4 mb-3">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                          style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }}>
                          {phase.phase}
                        </div>
                        {i < roadmapResult.phases.length - 1 && (
                          <div className="w-px flex-1 mt-2" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', minHeight: '24px' }} />
                        )}
                      </div>
                      <div className="flex-1 rounded-2xl p-4 space-y-3 mb-1"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="font-bold text-[color:var(--text-primary)] text-sm">{phase.title}</p>
                            <span className="text-[color:var(--text-muted)] text-xs">{phase.duration}</span>
                          </div>
                          <p className="text-xs" style={{ color: 'var(--accent)' }}>🎯 {phase.goal}</p>
                        </div>
                        <div>
                          <p className="text-[color:var(--text-faint)] text-[9px] font-bold tracking-[0.15em] uppercase mb-2">Topics</p>
                          <div className="flex flex-wrap gap-1.5">
                            {phase.topics?.map((topic: string, j: number) => (
                              <span key={j} className="text-[10px] px-2.5 py-1 rounded-full font-medium"
                                style={{ background: 'var(--accent-bg)', border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}>
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[color:var(--text-faint)] text-[9px] font-bold tracking-[0.15em] uppercase mb-2">Resources</p>
                          <ul className="space-y-1.5">
                            {phase.resources?.map((res: any, j: number) => (
                              <li key={j} className="flex items-center gap-2 text-xs">
                                <span className="flex-shrink-0">{res.free ? '🆓' : '💰'}</span>
                                <span className="text-[color:var(--text-secondary)] font-medium">{res.name}</span>
                                <span className="text-[color:var(--text-faint)]">— {res.type}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => { setRoadmapResult(null); setRoadmapCareer('') }}
                  className="w-full py-3 rounded-2xl text-sm text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)] transition font-medium"
                  style={{ border: '1px solid var(--border)' }}>
                  🔄 Generate Another Roadmap
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

export default function GrowthHub() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    }>
      <GrowthHubInner />
    </Suspense>
  )
}