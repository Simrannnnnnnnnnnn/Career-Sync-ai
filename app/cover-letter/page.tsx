"use client";
import { useState, useRef } from "react";
import Link from "next/link";

export default function CoverLetter() {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resume, setResume] = useState("");
  const [tone, setTone] = useState("professional");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [parseLoading, setParseLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Resume Upload + Parse
  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParseLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/resume", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.text) {
        setResume(data.text);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setParseLoading(false);
    }
  }

  async function generateLetter() {
    if (!jobTitle || !company) return;
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, company, jobDescription, resume, tone }),
      });
      const data = await res.json();
      setResult(data.letter);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-4 transition">
            ← Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Cover Letter Generator ✍️</h1>
          <p className="text-gray-400 mt-1">Generate a tailored cover letter for any job in seconds</p>
        </div>

        <div className="space-y-5">

          {/* Job Title + Company */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Job Title</label>
              <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Frontend Developer"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Company Name</label>
              <input type="text" value={company} onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Google"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          {/* Tone */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Tone</label>
            <div className="flex gap-2">
              {["professional", "friendly", "confident"].map((t) => (
                <button key={t} onClick={() => setTone(t)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize ${
                    tone === t
                      ? "bg-blue-600 text-white"
                      : "bg-gray-900 border border-gray-700 text-gray-400 hover:text-white"
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Job Description */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Job Description <span className="text-gray-600">(optional but recommended)</span>
            </label>
            <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={4}
              placeholder="Paste the job description here..."
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none" />
          </div>

          {/* Resume Upload */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">
              Your Resume <span className="text-gray-600">(optional — upload or paste)</span>
            </label>

            {/* Upload Button */}
            <div
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-xl px-4 py-4 text-center cursor-pointer transition mb-3">
              <input ref={fileRef} type="file" accept=".pdf,.docx" onChange={handleResumeUpload} className="hidden" />
              {parseLoading ? (
                <p className="text-gray-400 text-sm">⏳ Parsing resume...</p>
              ) : fileName ? (
                <p className="text-green-400 text-sm">✅ {fileName} — parsed successfully!</p>
              ) : (
                <p className="text-gray-500 text-sm">📎 Upload PDF or DOCX — AI will parse it automatically</p>
              )}
            </div>

            {/* Manual textarea */}
            <textarea value={resume} onChange={(e) => setResume(e.target.value)} rows={4}
              placeholder="Or paste your skills and experience here..."
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none" />
          </div>

          {/* Generate Button */}
          <button onClick={generateLetter} disabled={loading || !jobTitle || !company}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition">
            {loading ? "Generating..." : "✍️ Generate Cover Letter"}
          </button>

          {/* Result */}
          {result && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-gray-400 text-sm">Your Cover Letter</p>
                <button onClick={copyToClipboard}
                  className="text-xs text-blue-400 border border-blue-500/30 hover:border-blue-400 px-3 py-1.5 rounded-lg transition">
                  {copied ? "✅ Copied!" : "📋 Copy"}
                </button>
              </div>
              <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{result}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}