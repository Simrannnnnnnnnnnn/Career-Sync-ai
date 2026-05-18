'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const COLS = [
  { id: 'applied',   label: 'Applied',   dot: 'bg-emerald-500',   text: 'text-emerald-400',   border: 'border-emerald-500/20',   glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]' },
  { id: 'interview', label: 'Interview', dot: 'bg-purple-500',  text: 'text-purple-400',  border: 'border-purple-500/20',  glow: 'shadow-[0_0_15px_rgba(168,85,247,0.15)]' },
  { id: 'offer',     label: 'Offer',     dot: 'bg-blue-500',    text: 'text-blue-400',    border: 'border-blue-500/20',    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]' },
  { id: 'rejected',  label: 'Rejected',  dot: 'bg-zinc-500',    text: 'text-zinc-400',    border: 'border-zinc-500/20',    glow: 'shadow-none' },
]

const TYPE_COLORS: Record<string, string> = {
  'Full-time':  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  'Remote':     'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
  'Internship': 'bg-pink-500/10 text-pink-400 border border-pink-500/20',
  'Contract':   'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  'Hybrid':     'bg-purple-500/10 text-purple-400 border border-purple-500/20',
}

type Job = {
  id: string
  title: string
  company: string
  location: string
  type: string
  status: string
  date: string
  note: string
}

const emptyForm = {
  title: '', company: '', location: '',
  type: 'Full-time', status: 'applied',
  date: new Date().toISOString().slice(0, 10), note: ''
}

export default function JobTracker() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editJob, setEditJob] = useState<Job | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('all')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    fetchJobs()
  }

  async function fetchJobs() {
    setLoading(true)
    const res = await fetch('/api/job-tracker')
    const data = await res.json()
    setJobs(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  function openAdd() {
    setEditJob(null)
    setForm(emptyForm)
    setModal(true)
  }

  function openEdit(job: Job) {
    setEditJob(job)
    setForm({
      title: job.title, company: job.company,
      location: job.location, type: job.type,
      status: job.status, date: job.date, note: job.note
    })
    setModal(true)
  }

  async function saveJob() {
    if (!form.title || !form.company) return alert('Title aur Company zaroori hai!')
    setSaving(true)
    if (editJob) {
      await fetch('/api/job-tracker', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editJob.id, ...form })
      })
    } else {
      await fetch('/api/job-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
    }
    setSaving(false)
    setModal(false)
    fetchJobs()
  }

  async function deleteJob(id: string) {
    if (!confirm('Delete karna chahte ho?')) return
    await fetch('/api/job-tracker', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    fetchJobs()
  }

  function initials(name: string) {
    return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  }

  function formatDate(d: string) {
    if (!d) return ''
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-4 md:p-8 selection:bg-emerald-500/30 selection:text-emerald-200 antialiased">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Ambient Top Glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

        {/* Dynamic Nav Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/60 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Job Tracker
            </h1>
            <p className="text-zinc-400 text-sm mt-1">Apni application pipeline optimize karein</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-zinc-400 hover:text-white text-sm border border-zinc-800 bg-zinc-900/40 backdrop-blur-md px-4 py-2.5 rounded-xl transition-all duration-200"
            >
              ← Dashboard
            </button>
            <button
              onClick={openAdd}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0"
            >
              + Add Application
            </button>
          </div>
        </div>

        {/* ✅ Ambient Green Hero Card (Growth Hub Accent) */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-zinc-900/90 to-emerald-950/20 p-6 shadow-xl backdrop-blur-md">
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Growth Analytics
              </span>
              <h2 className="text-xl font-bold text-white">Aapki Career Raftaar</h2>
              <p className="text-sm text-zinc-400 max-w-xl">
                Total <span className="text-emerald-400 font-semibold">{jobs.length} jobs</span> track ho rahe hain. Lagatar apply karte rahein aur metrics monitor karein.
              </p>
            </div>
            
            {/* ✅ Roadmap Button with Subtle Glow */}
            <button 
              onClick={() => router.push('/roadmap')}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-medium text-sm transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02]"
            >
              <span>View Career Roadmap</span>
              <span className="text-xs">⚡</span>
            </button>
          </div>
        </div>

        {/* Quick Insights Cards & Career Mini Test */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Stats Box Container */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {COLS.map(col => {
              const count = jobs.filter(j => j.status === col.id).length
              return (
                <div key={col.id} className="group bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-zinc-800/80 p-4 transition-all duration-300 hover:border-zinc-700">
                  <div className={`text-3xl font-extrabold tracking-tight ${col.text}`}>
                    {count}
                  </div>
                  <div className="text-zinc-500 text-xs font-medium mt-2 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                    {col.label}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ✅ Career Mini Test Widget — Purple Theme */}
          <div className="bg-gradient-to-br from-zinc-900/90 to-purple-950/20 border border-purple-500/20 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-purple-300 tracking-wide uppercase">Evaluate Skills</h3>
                <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full px-2 py-0.5 font-medium">Quick Test</span>
              </div>
              <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                Apni technical competence aur industry alignment check karne ke liye career test dein.
              </p>
            </div>
            <div className="space-y-3">
              {/* ✅ Smooth Purple Progress Bar */}
              <div className="w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full w-[65%] transition-all duration-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
              </div>
              <button 
                onClick={() => router.push('/career-test')}
                className="w-full text-center py-2 bg-purple-600/20 hover:bg-purple-600 border border-purple-500/30 hover:border-purple-500 text-purple-300 hover:text-white rounded-xl text-xs font-semibold transition-all duration-200"
              >
                Start Career Test →
              </button>
            </div>
          </div>
        </div>

        {/* ✅ Pill-Style Responsive Tabs Filter */}
        <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
          <div className="flex flex-wrap gap-1.5 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/80 backdrop-blur-md">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                activeTab === 'all' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Columns
            </button>
            {COLS.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveTab(c.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  activeTab === c.id 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Kanban Board / Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-zinc-500 text-sm tracking-wide">Syncing your pipeline...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
            {COLS.filter(col => activeTab === 'all' || activeTab === col.id).map(col => {
              const colJobs = jobs.filter(j => j.status === col.id)
              return (
                <div key={col.id} className="flex flex-col gap-3 w-full bg-zinc-900/20 p-3 rounded-2xl border border-zinc-900 backdrop-blur-sm">

                  {/* Column Header */}
                  <div className="flex items-center justify-between px-1 py-0.5">
                    <div className={`flex items-center gap-2 text-xs font-bold tracking-wider uppercase ${col.text}`}>
                      <span className={`w-2 h-2 rounded-full ${col.dot} ${col.glow}`} />
                      {col.label}
                    </div>
                    <span className="text-[11px] font-mono font-bold bg-zinc-900 text-zinc-400 border border-zinc-800 rounded-full px-2 py-0.5">
                      {colJobs.length}
                    </span>
                  </div>

                  {/* Cards Pool */}
                  <div className="space-y-3 min-h-[150px]">
                    {colJobs.length === 0 ? (
                      <div className={`border border-dashed ${col.border} rounded-xl p-6 text-center text-zinc-600 text-xs bg-zinc-900/10 transition-colors`}>
                        Koi job nahi
                      </div>
                    ) : (
                      colJobs.map(job => (
                        <div 
                          key={job.id} 
                          className="group bg-zinc-900/50 backdrop-blur-md rounded-xl border border-zinc-800/80 hover:border-zinc-700 p-4 transition-all duration-200 shadow-md hover:shadow-xl hover:-translate-y-0.5"
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs font-bold flex-shrink-0 border border-zinc-700/50 group-hover:border-zinc-600">
                                {initials(job.company)}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-zinc-100 truncate group-hover:text-white transition-colors">{job.title}</div>
                                <div className="text-xs text-zinc-500 truncate">{job.company}</div>
                              </div>
                            </div>
                            <div className="flex gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <button onClick={() => openEdit(job)} className="text-zinc-400 hover:text-white text-xs p-1 rounded hover:bg-zinc-800 transition">✏️</button>
                              <button onClick={() => deleteJob(job.id)} className="text-zinc-400 hover:text-rose-400 text-xs p-1 rounded hover:bg-zinc-800 transition">🗑️</button>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {job.location && (
                              <span className="text-[11px] font-medium bg-zinc-800/50 text-zinc-400 rounded-md px-2 py-0.5 border border-zinc-800">
                                📍 {job.location}
                              </span>
                            )}
                            {job.type && (
                              <span className={`text-[11px] font-medium rounded-md px-2 py-0.5 ${TYPE_COLORS[job.type] || 'bg-zinc-800 text-zinc-400'}`}>
                                {job.type}
                              </span>
                            )}
                          </div>

                          {job.note && (
                            <div className="text-xs text-zinc-400 bg-zinc-950/60 rounded-lg p-2.5 border-l-2 border-zinc-700 mb-3 break-words line-clamp-2 hover:line-clamp-none transition-all duration-300">
                              {job.note}
                            </div>
                          )}

                          {job.date && (
                            <div className="text-[10px] font-medium text-zinc-500 flex items-center gap-1">
                              📅 {formatDate(job.date)}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ✅ Premium Glassmorphism Modal Framework */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setModal(false)}>
          <div className="bg-[#09090b]/90 border border-zinc-800/80 rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-black/80 backdrop-blur-xl transition-all relative transform scale-100" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white tracking-tight">{editJob ? 'Edit Application Details' : 'Track New Application'}</h2>
              <button onClick={() => setModal(false)} className="w-7 h-7 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg flex items-center justify-center text-xs border border-zinc-800 transition-colors">✕</button>
            </div>

            {/* Form Fields with ✅ Slick Glass Styles */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Job Title *</label>
                  <input className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" placeholder="e.g. Frontend Dev" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Company *</label>
                  <input className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" placeholder="e.g. Google" value={form.company} onChange={e => setForm({...form, company: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Location</label>
                  <input className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" placeholder="Bangalore / Remote" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Job Type</label>
                  <select className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all appearance-none" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    {['Full-time','Remote','Hybrid','Internship','Contract'].map(t => <option key={t} className="bg-zinc-900 text-white">{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Status</label>
                  <select className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    {COLS.map(c => <option key={c.id} value={c.id} className="bg-zinc-900 text-white">{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Applied On</label>
                  <input type="date" className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all custom-calendar" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Notes</label>
                <textarea className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-all resize-none" rows={3} placeholder="Interview round updates, packages, referrals..." value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <button onClick={() => setModal(false)} className="px-4 py-2 text-sm font-medium text-zinc-400 border border-zinc-800 rounded-xl hover:bg-zinc-900/60 hover:text-white transition-all">
                Cancel
              </button>
              <button onClick={saveJob} disabled={saving} className="px-5 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl disabled:opacity-50 transition-all shadow-lg shadow-emerald-600/10">
                {saving ? 'Saving...' : editJob ? 'Save Changes' : 'Add Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}