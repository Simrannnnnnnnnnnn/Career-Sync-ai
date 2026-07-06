'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'

const COLS = [
  { id: 'applied',   label: 'Applied',   color: 'var(--accent)', bg: 'var(--accent-bg)', border: 'var(--accent-border)' },
  { id: 'interview', label: 'Interview', color: 'var(--purple)', bg: 'var(--purple-bg)', border: 'var(--purple-bg)' },
  { id: 'offer',     label: 'Offer',     color: 'var(--blue)',   bg: 'var(--blue-bg)',   border: 'var(--blue-bg)' },
  { id: 'rejected',  label: 'Rejected',  color: 'var(--text-faint)', bg: 'var(--bg-subtle)', border: 'var(--border)' },
]

const TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  'Full-time':  { color: 'var(--accent)', bg: 'var(--accent-bg)' },
  'Remote':     { color: 'var(--blue)', bg: 'var(--blue-bg)' },
  'Internship': { color: 'var(--coral)', bg: 'var(--coral-bg)' },
  'Contract':   { color: 'var(--amber)', bg: 'var(--amber-bg)' },
  'Hybrid':     { color: 'var(--purple)', bg: 'var(--purple-bg)' },
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
  const { theme } = useTheme()

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
    if (!form.title || !form.company) return alert('Title and Company are required!')
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
    if (!confirm('Are you sure you want to delete this?')) return
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
    <div
      className={`min-h-screen p-4 md:p-8 antialiased relative transition-colors duration-200 ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}
      data-theme={theme}
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      <div className="max-w-6xl mx-auto space-y-8 relative z-10">

        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none -z-10"
          style={{ background: 'var(--accent-bg)', filter: 'blur(120px)' }}
        />
        <div
          className="absolute top-20 right-1/4 w-96 h-96 rounded-full pointer-events-none -z-10"
          style={{ background: 'var(--purple-bg)', filter: 'blur(120px)' }}
        />

        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Job Tracker
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Optimize your application pipeline
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm px-4 py-2.5 rounded-xl transition-all duration-200"
              style={{ color: 'var(--text-secondary)', background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              ← Dashboard
            </button>
            <button
              onClick={openAdd}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 4px 14px var(--accent-bg)' }}
            >
              + Add Application
            </button>
          </div>
        </div>

        <div
          className="relative overflow-hidden rounded-2xl p-6"
          style={{ border: '1px solid var(--accent-border)', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
        >
          <div
            className="absolute -right-16 -top-16 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: 'var(--accent-bg)', filter: 'blur(60px)' }}
          />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full"
                style={{ color: 'var(--accent)', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} /> Growth Analytics
              </span>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Your Career Momentum</h2>
              <p className="text-sm max-w-xl" style={{ color: 'var(--text-secondary)' }}>
                You're tracking a total of <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{jobs.length} jobs</span>. Keep applying consistently and monitor your metrics.
              </p>
            </div>

            <button
              onClick={() => router.push('/roadmap')}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all duration-300 hover:scale-[1.02]"
              style={{ background: `linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 80%, black))`, color: '#fff', boxShadow: '0 4px 14px var(--accent-bg)' }}
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
                <div
                  key={col.id}
                  className="group rounded-2xl p-4 transition-all duration-300"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
                >
                  <div className="text-3xl font-extrabold tracking-tight" style={{ color: col.color }}>
                    {count}
                  </div>
                  <div className="text-xs font-medium mt-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: col.color }} />
                    {col.label}
                  </div>
                </div>
              )
            })}
          </div>

          <div
            className="rounded-2xl p-5 flex flex-col justify-between"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--purple-bg)' }}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold tracking-wide uppercase" style={{ color: 'var(--purple)' }}>Evaluate Skills</h3>
                <span
                  className="text-[10px] rounded-full px-2 py-0.5 font-medium"
                  style={{ background: 'var(--purple-bg)', color: 'var(--purple)', border: '1px solid var(--purple-bg)' }}
                >
                  Quick Test
                </span>
              </div>
              <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Take a career test to check your technical competence and industry alignment.
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
                <div
                  className="h-full rounded-full w-[65%] transition-all duration-500"
                  style={{ background: 'var(--purple)', boxShadow: '0 0 8px var(--purple-bg)' }}
                />
              </div>
              <button
                onClick={() => router.push('/career-test')}
                className="w-full text-center py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                style={{ background: 'var(--purple-bg)', color: 'var(--purple)', border: '1px solid var(--purple-bg)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--purple)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--purple-bg)'; e.currentTarget.style.color = 'var(--purple)' }}
              >
                Start Career Test →
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div
            className="flex flex-wrap gap-1.5 p-1 rounded-xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <button
              onClick={() => setActiveTab('all')}
              className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
              style={
                activeTab === 'all'
                  ? { background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }
                  : { color: 'var(--text-secondary)', border: '1px solid transparent' }
              }
            >
              All Columns
            </button>
            {COLS.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveTab(c.id)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                style={
                  activeTab === c.id
                    ? { background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }
                    : { color: 'var(--text-secondary)', border: '1px solid transparent' }
                }
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
            <div className="text-sm tracking-wide" style={{ color: 'var(--text-muted)' }}>Syncing your pipeline...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
            {COLS.filter(col => activeTab === 'all' || activeTab === col.id).map(col => {
              const colJobs = jobs.filter(j => j.status === col.id)
              return (
                <div
                  key={col.id}
                  className="flex flex-col gap-3 w-full p-3 rounded-2xl"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between px-1 py-0.5">
                    <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase" style={{ color: col.color }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                      {col.label}
                    </div>
                    <span
                      className="text-[11px] font-mono font-bold rounded-full px-2 py-0.5"
                      style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                    >
                      {colJobs.length}
                    </span>
                  </div>

                  <div className="space-y-3 min-h-[150px]">
                    {colJobs.length === 0 ? (
                      <div
                        className="rounded-xl p-6 text-center text-xs"
                        style={{ border: `1px dashed ${col.border}`, color: 'var(--text-faint)', background: 'var(--bg-card)' }}
                      >
                        No jobs yet
                      </div>
                    ) : (
                      colJobs.map(job => (
                        <div
                          key={job.id}
                          className="group rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5"
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)' }}
                              >
                                {initials(job.company)}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{job.title}</div>
                                <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{job.company}</div>
                              </div>
                            </div>
                            <div className="flex gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <button
                                onClick={() => openEdit(job)}
                                className="text-xs p-1 rounded transition"
                                style={{ color: 'var(--text-secondary)' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-subtle)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => deleteJob(job.id)}
                                className="text-xs p-1 rounded transition"
                                style={{ color: 'var(--text-secondary)' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-subtle)'; e.currentTarget.style.color = '#f43f5e' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {job.location && (
                              <span
                                className="text-[11px] font-medium rounded-md px-2 py-0.5"
                                style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                              >
                                📍 {job.location}
                              </span>
                            )}
                            {job.type && (
                              <span
                                className="text-[11px] font-medium rounded-md px-2 py-0.5"
                                style={
                                  TYPE_COLORS[job.type]
                                    ? { background: TYPE_COLORS[job.type].bg, color: TYPE_COLORS[job.type].color, border: `1px solid ${TYPE_COLORS[job.type].bg}` }
                                    : { background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }
                                }
                              >
                                {job.type}
                              </span>
                            )}
                          </div>

                          {job.note && (
                            <div
                              className="text-xs rounded-lg p-2.5 mb-3 break-words line-clamp-2 hover:line-clamp-none transition-all duration-300"
                              style={{ color: 'var(--text-secondary)', background: 'var(--bg-base)', borderLeft: '2px solid var(--border-strong)' }}
                            >
                              {job.note}
                            </div>
                          )}

                          {job.date && (
                            <div className="text-[10px] font-medium flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
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
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fadeIn"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setModal(false)}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-md relative"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {editJob ? 'Edit Application Details' : 'Track New Application'}
              </h2>
              <button
                onClick={() => setModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
                style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-subtle)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Job Title *</label>
                  <input
                    className="w-full rounded-xl px-3 py-2 text-sm transition-all focus:outline-none"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    placeholder="e.g. Frontend Dev"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Company *</label>
                  <input
                    className="w-full rounded-xl px-3 py-2 text-sm transition-all focus:outline-none"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    placeholder="e.g. Google"
                    value={form.company}
                    onChange={e => setForm({ ...form, company: e.target.value })}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Location</label>
                  <input
                    className="w-full rounded-xl px-3 py-2 text-sm transition-all focus:outline-none"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    placeholder="Bangalore / Remote"
                    value={form.location}
                    onChange={e => setForm({ ...form, location: e.target.value })}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Job Type</label>
                  <select
                    className="w-full rounded-xl px-3 py-2 text-sm transition-all focus:outline-none appearance-none"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                  >
                    {['Full-time', 'Remote', 'Hybrid', 'Internship', 'Contract'].map(t => (
                      <option key={t} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Status</label>
                  <select
                    className="w-full rounded-xl px-3 py-2 text-sm transition-all focus:outline-none"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                  >
                    {COLS.map(c => (
                      <option key={c.id} value={c.id} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Applied On</label>
                  <input
                    type="date"
                    className="w-full rounded-xl px-3 py-2 text-sm transition-all focus:outline-none"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Notes</label>
                <textarea
                  className="w-full rounded-xl px-3 py-2 text-sm transition-all resize-none focus:outline-none"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  rows={3}
                  placeholder="Interview round updates, packages, referrals..."
                  value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => setModal(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl transition-all"
                style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-subtle)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={saveJob}
                disabled={saving}
                className="px-5 py-2 text-sm font-medium rounded-xl disabled:opacity-50 transition-all"
                style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 4px 14px var(--accent-bg)' }}
              >
                {saving ? 'Saving...' : editJob ? 'Save Changes' : 'Add Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}