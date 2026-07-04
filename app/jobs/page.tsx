'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const COLS = [
  { id: 'applied',   label: 'Applied',   dot: 'bg-emerald-500',   text: 'text-emerald-400',   border: 'border-emerald-500/20',   glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]' },
  { id: 'interview', label: 'Interview', dot: 'bg-purple-500',  text: 'text-purple-400',  border: 'border-purple-500/20',  glow: 'shadow-[0_0_15px_rgba(168,85,247,0.15)]' },
  { id: 'offer',     label: 'Offer',     dot: 'bg-blue-500',    text: 'text-blue-400',    border: 'border-blue-500/20',    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]' },
  { id: 'rejected',  label: 'Rejected',  dot: 'bg-[color:var(--text-faint)]',    text: 'text-[color:var(--text-secondary)]',    border: 'border-[color:var(--text-faint)]',    glow: 'shadow-none' },
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
    <div className="min-h-screen bg-[color:var(--bg-base)] text-[color:var(--text-primary)] p-4 md:p-8 selection:bg-emerald-500/30 selection:text-emerald-200 antialiased">
      <div className="max-w-6xl mx-auto space-y-8">

        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[color:var(--border)] pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[color:var(--text-primary)] via-[color:var(--text-primary)] to-[color:var(--text-secondary)] bg-clip-text text-transparent">
              Job Tracker
            </h1>
            <p className="text-[color:var(--text-secondary)] text-sm mt-1">Apni application pipeline optimize karein</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-[color:var(--text-secondary)] hover:text-white text-sm border border-[color:var(--border)] bg-[color:var(--bg-card)] backdrop-blur-md px-4 py-2.5 rounded-xl transition-all duration-200"
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

        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-zinc-900/90 to-emerald-950/20 p-6 shadow-xl backdrop-blur-md">
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Growth Analytics
              </span>
              <h2 className="text-xl font-bold text-white">Aapki Career Raftaar</h2>
              <p className="text-sm text-[color:var(--text-secondary)] max-w-xl">
                Total <span className="text-emerald-400 font-semibold">{jobs.length} jobs</span> track ho rahe hain. Lagatar apply karte rahein aur metrics monitor karein.
              </p>
            </div>
            
            <button 
              onClick={() => router.push('/roadmap')}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-medium text-sm transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02]"
            >
              <span>View Career Roadmap</span>
              <span className="text-xs">⚡</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {COLS.map(col => {
              const count = jobs.filter(j => j.status === col.id).length
              return (
                <div key={col.id} className="group bg-[color:var(--bg-card)] backdrop-blur-md rounded-2xl border border-[color:var(--border)] p-4 transition-all duration-300 hover:border-[color:var(--border-strong)]">
                  <div className={`text-3xl font-extrabold tracking-tight ${col.text}`}>
                    {count}
                  </div>
                  <div className="text-[color:var(--text-muted)] text-xs font-medium mt-2 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                    {col.label}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="bg-gradient-to-br from-zinc-900/90 to-purple-950/20 border border-purple-500/20 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-purple-300 tracking-wide uppercase">Evaluate Skills</h3>
                <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full px-2 py-0.5 font-medium">Quick Test</span>
              </div>
              <p className="text-xs text-[color:var(--text-secondary)] mb-4 leading-relaxed">
                Apni technical competence aur industry alignment check karne ke liye career test dein.
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-full bg-[color:var(--bg-subtle)] rounded-full h-1.5 overflow-hidden">
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

        <div className="flex items-center justify-between border-b border-[color:var(--border)] pb-3">
          <div className="flex flex-wrap gap-1.5 bg-[color:var(--bg-card)] p-1 rounded-xl border border-[color:var(--border)] backdrop-blur-md">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                activeTab === 'all' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm' 
                  : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'
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
                    : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-[color:var(--text-muted)] text-sm tracking-wide">Syncing your pipeline...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
            {COLS.filter(col => activeTab === 'all' || activeTab === col.id).map(col => {
              const colJobs = jobs.filter(j => j.status === col.id)
              return (
                <div key={col.id} className="flex flex-col gap-3 w-full bg-[color:var(--bg-card)] p-3 rounded-2xl border border-[color:var(--border)] backdrop-blur-sm">

                  <div className="flex items-center justify-between px-1 py-0.5">
                    <div className={`flex items-center gap-2 text-xs font-bold tracking-wider uppercase ${col.text}`}>
                      <span className={`w-2 h-2 rounded-full ${col.dot} ${col.glow}`} />
                      {col.label}
                    </div>
                    <span className="text-[11px] font-mono font-bold bg-[color:var(--bg-card)] text-[color:var(--text-secondary)] border border-[color:var(--border)] rounded-full px-2 py-0.5">
                      {colJobs.length}
                    </span>
                  </div>

                  <div className="space-y-3 min-h-[150px]">
                    {colJobs.length === 0 ? (
                      <div className={`border border-dashed ${col.border} rounded-xl p-6 text-center text-[color:var(--text-faint)] text-xs bg-[color:var(--bg-card)] transition-colors`}>
                        Koi job nahi
                      </div>
                    ) : (
                      colJobs.map(job => (
                        <div 
                          key={job.id} 
                          className="group bg-[color:var(--bg-card)] backdrop-blur-md rounded-xl border border-[color:var(--border)] hover:border-[color:var(--border-strong)] p-4 transition-all duration-200 shadow-md hover:shadow-xl hover:-translate-y-0.5"
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-[color:var(--bg-subtle)] text-[color:var(--text-secondary)] flex items-center justify-center text-xs font-bold flex-shrink-0 border border-[color:var(--border-strong)] group-hover:border-[color:var(--border-strong)]">
                                {initials(job.company)}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-[color:var(--text-primary)] truncate group-hover:text-white transition-colors">{job.title}</div>
                                <div className="text-xs text-[color:var(--text-muted)] truncate">{job.company}</div>
                              </div>
                            </div>
                            <div className="flex gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <button onClick={() => openEdit(job)} className="text-[color:var(--text-secondary)] hover:text-white text-xs p-1 rounded hover:bg-[color:var(--bg-subtle)] transition">✏️</button>
                              <button onClick={() => deleteJob(job.id)} className="text-[color:var(--text-secondary)] hover:text-rose-400 text-xs p-1 rounded hover:bg-[color:var(--bg-subtle)] transition">🗑️</button>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {job.location && (
                              <span className="text-[11px] font-medium bg-[color:var(--bg-subtle)] text-[color:var(--text-secondary)] rounded-md px-2 py-0.5 border border-[color:var(--border)]">
                                📍 {job.location}
                              </span>
                            )}
                            {job.type && (
                              <span className={`text-[11px] font-medium rounded-md px-2 py-0.5 ${TYPE_COLORS[job.type] || 'bg-[color:var(--bg-subtle)] text-[color:var(--text-secondary)]'}`}>
                                {job.type}
                              </span>
                            )}
                          </div>

                          {job.note && (
                            <div className="text-xs text-[color:var(--text-secondary)] bg-[color:var(--bg-base)] rounded-lg p-2.5 border-l-2 border-[color:var(--border-strong)] mb-3 break-words line-clamp-2 hover:line-clamp-none transition-all duration-300">
                              {job.note}
                            </div>
                          )}

                          {job.date && (
                            <div className="text-[10px] font-medium text-[color:var(--text-muted)] flex items-center gap-1">
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

      {modal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setModal(false)}>
          <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-black/80 backdrop-blur-xl transition-all relative transform scale-100" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white tracking-tight">{editJob ? 'Edit Application Details' : 'Track New Application'}</h2>
              <button onClick={() => setModal(false)} className="w-7 h-7 bg-[color:var(--bg-card)] hover:bg-[color:var(--bg-subtle)] text-[color:var(--text-secondary)] hover:text-white rounded-lg flex items-center justify-center text-xs border border-[color:var(--border)] transition-colors">✕</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[color:var(--text-secondary)] mb-1.5 block">Job Title *</label>
                  <input className="w-full bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-xl px-3 py-2 text-sm text-white placeholder-[color:var(--text-faint)] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" placeholder="e.g. Frontend Dev" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[color:var(--text-secondary)] mb-1.5 block">Company *</label>
                  <input className="w-full bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-xl px-3 py-2 text-sm text-white placeholder-[color:var(--text-faint)] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" placeholder="e.g. Google" value={form.company} onChange={e => setForm({...form, company: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[color:var(--text-secondary)] mb-1.5 block">Location</label>
                  <input className="w-full bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-xl px-3 py-2 text-sm text-white placeholder-[color:var(--text-faint)] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" placeholder="Bangalore / Remote" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[color:var(--text-secondary)] mb-1.5 block">Job Type</label>
                  <select className="w-full bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all appearance-none" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    {['Full-time','Remote','Hybrid','Internship','Contract'].map(t => <option key={t} className="bg-[color:var(--bg-card)] text-white">{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[color:var(--text-secondary)] mb-1.5 block">Status</label>
                  <select className="w-full bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    {COLS.map(c => <option key={c.id} value={c.id} className="bg-[color:var(--bg-card)] text-white">{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[color:var(--text-secondary)] mb-1.5 block">Applied On</label>
                  <input type="date" className="w-full bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all custom-calendar" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[color:var(--text-secondary)] mb-1.5 block">Notes</label>
                <textarea className="w-full bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-xl px-3 py-2 text-sm text-white placeholder-[color:var(--text-faint)] focus:outline-none focus:border-emerald-500 transition-all resize-none" rows={3} placeholder="Interview round updates, packages, referrals..." value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <button onClick={() => setModal(false)} className="px-4 py-2 text-sm font-medium text-[color:var(--text-secondary)] border border-[color:var(--border)] rounded-xl hover:bg-[color:var(--bg-card)] hover:text-white transition-all">
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