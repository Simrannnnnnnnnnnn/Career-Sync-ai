'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const COLS = [
  { id: 'applied',   label: 'Applied',   dot: 'bg-blue-500',   text: 'text-blue-400',   border: 'border-blue-500/30' },
  { id: 'interview', label: 'Interview', dot: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  { id: 'offer',     label: 'Offer',     dot: 'bg-green-500',  text: 'text-green-400',  border: 'border-green-500/30' },
  { id: 'rejected',  label: 'Rejected',  dot: 'bg-red-500',    text: 'text-red-400',    border: 'border-red-500/30' },
]

const TYPE_COLORS: Record<string, string> = {
  'Full-time':  'bg-blue-500/10 text-blue-400',
  'Remote':     'bg-green-500/10 text-green-400',
  'Internship': 'bg-pink-500/10 text-pink-400',
  'Contract':   'bg-orange-500/10 text-orange-400',
  'Hybrid':     'bg-purple-500/10 text-purple-400',
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
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold">Job Tracker</h1>
            <p className="text-gray-400 text-sm mt-1">{jobs.length} jobs track ho rahe hain</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-400 hover:text-white text-sm border border-gray-700 px-4 py-2 rounded-xl transition"
            >
              ← Dashboard
            </button>
            <button
              onClick={openAdd}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
            >
              + Add Job
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {COLS.map(col => (
            <div key={col.id} className="bg-gray-900 rounded-2xl border border-gray-800 p-4 text-center">
              <div className={`text-3xl font-bold ${col.text}`}>
                {jobs.filter(j => j.status === col.id).length}
              </div>
              <div className="text-gray-500 text-xs mt-1">{col.label}</div>
            </div>
          ))}
        </div>

        {/* Board */}
        {loading ? (
          <div className="text-center text-gray-500 py-20">Loading...</div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {COLS.map(col => {
              const colJobs = jobs.filter(j => j.status === col.id)
              return (
                <div key={col.id} className="flex flex-col gap-3">

                  {/* Column Header */}
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-2 text-sm font-semibold ${col.text}`}>
                      <span className={`w-2 h-2 rounded-full ${col.dot}`}></span>
                      {col.label}
                    </div>
                    <span className="text-xs bg-gray-800 text-gray-400 rounded-full px-2 py-0.5">
                      {colJobs.length}
                    </span>
                  </div>

                  {/* Cards */}
                  {colJobs.length === 0 ? (
                    <div className={`border-2 border-dashed ${col.border} rounded-2xl p-4 text-center text-gray-600 text-xs`}>
                      Koi job nahi
                    </div>
                  ) : (
                    colJobs.map(job => (
                      <div key={job.id} className="bg-gray-900 rounded-2xl border border-gray-800 hover:border-gray-600 p-4 transition">

                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {initials(job.company)}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-white leading-tight">{job.title}</div>
                              <div className="text-xs text-gray-500">{job.company}</div>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => openEdit(job)} className="text-gray-600 hover:text-gray-300 text-xs p-1 transition">✏️</button>
                            <button onClick={() => deleteJob(job.id)} className="text-gray-600 hover:text-red-400 text-xs p-1 transition">🗑️</button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-2">
                          {job.location && (
                            <span className="text-xs bg-gray-800 text-gray-400 rounded-full px-2 py-0.5">
                              📍 {job.location}
                            </span>
                          )}
                          {job.type && (
                            <span className={`text-xs rounded-full px-2 py-0.5 ${TYPE_COLORS[job.type] || 'bg-gray-800 text-gray-400'}`}>
                              {job.type}
                            </span>
                          )}
                        </div>

                        {job.note && (
                          <div className="text-xs text-gray-500 bg-gray-800 rounded-lg p-2 border-l-2 border-gray-600 mb-2">
                            {job.note}
                          </div>
                        )}

                        {job.date && (
                          <div className="text-xs text-gray-600">📅 {formatDate(job.date)}</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setModal(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{editJob ? 'Edit Job' : 'Add New Job'}</h2>
              <button onClick={() => setModal(false)} className="text-gray-500 hover:text-white transition">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Job Title *</label>
                <input className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition" placeholder="e.g. Frontend Dev" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Company *</label>
                <input className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition" placeholder="e.g. Google" value={form.company} onChange={e => setForm({...form, company: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Location</label>
                <input className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition" placeholder="Bangalore / Remote" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Job Type</label>
                <select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  {['Full-time','Remote','Hybrid','Internship','Contract'].map(t => <option key={t} className="bg-gray-800">{t}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Status</label>
                <select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  {COLS.map(c => <option key={c.id} value={c.id} className="bg-gray-800">{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Applied On</label>
                <input type="date" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
              </div>
            </div>

            <div className="mb-5">
              <label className="text-xs text-gray-500 mb-1 block">Notes</label>
              <textarea className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition resize-none" rows={3} placeholder="Interview round, salary, referral..." value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-400 border border-gray-700 rounded-xl hover:border-gray-500 transition">
                Cancel
              </button>
              <button onClick={saveJob} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 transition">
                {saving ? 'Saving...' : editJob ? 'Save Changes' : 'Add Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}