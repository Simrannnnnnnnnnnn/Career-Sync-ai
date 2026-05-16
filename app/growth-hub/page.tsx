"use client";
import { useState } from "react";
import Link from "next/link";
const questions = [
  { id: 1,  q: "Which activity makes you lose track of time completely?", options: ["Solving a complex puzzle or problem", "Building or creating something from scratch", "Helping someone figure something out", "Designing or making something look beautiful"] },
  { id: 2,  q: "After which type of task do you feel most drained, even if it was easy?", options: ["Repetitive data entry or analysis", "Writing long documents or reports", "Talking to many people all day", "Doing the same routine with no creativity"] },
  { id: 3,  q: "What do you naturally do when you have completely free time?", options: ["Explore how things work or research topics", "Build, code, or make something", "Talk to people or help someone", "Draw, write, design, or create art"] },
  { id: 4,  q: "Which school project did you actually enjoy doing?", options: ["Science experiments or math problems", "Coding projects or technical assignments", "Group presentations or debates", "Art, writing, or creative projects"] },
  { id: 5,  q: "What do friends or classmates come to you for help with?", options: ["Understanding complex topics or data", "Fixing technical issues or building things", "Advice, support, or listening", "Making things look good or creative ideas"] },
  { id: 6,  q: "Which of these feels most natural to you — no effort needed?", options: ["Spotting patterns and analyzing information", "Breaking down how a system works", "Reading people and understanding emotions", "Imagining new ideas and concepts"] },
  { id: 7,  q: "When your team is stuck, what role do you naturally take?", options: ["Research and find the data to decide", "Figure out the technical solution", "Bring the team together and communicate", "Come up with a creative new approach"] },
  { id: 8,  q: "Which compliment feels most true about you?", options: ["You always think before you act", "You can build or fix anything", "You make people feel understood", "You see things others don't"] },
  { id: 9,  q: "If money was not a concern, what would you spend your days doing?", options: ["Researching and discovering new insights", "Building products or systems", "Teaching, coaching, or supporting others", "Creating art, content, or experiences"] },
  { id: 10, q: "How do you want your work to impact the world?", options: ["Help organizations make smarter decisions", "Build tools that make life easier", "Directly improve people's lives", "Inspire or entertain people"] },
  { id: 11, q: "What kind of problem excites you the most?", options: ["Why is this data showing this pattern?", "How can I build this feature better?", "How can I help this person succeed?", "How can I make this look and feel amazing?"] },
  { id: 12, q: "Which work environment sounds most like you?", options: ["Quiet, focused, analytical work", "Fast-paced technical team", "People-first, collaborative setting", "Creative studio with freedom"] },
  { id: 13, q: "Which of these is your biggest strength right now?", options: ["I notice details others miss", "I learn technical skills fast", "I communicate and connect well", "I think outside the box"] },
  { id: 14, q: "Which area do you most want to grow in?", options: ["Data, AI, and analytical thinking", "Software, systems, and engineering", "Leadership, strategy, and people skills", "Design, storytelling, and creativity"] },
  { id: 15, q: "What would your ideal career feel like every day?", options: ["Solving meaningful analytical challenges", "Shipping products that millions use", "Changing someone's life directly", "Expressing ideas that move people"] },
];

export default function GrowthHub() {
  const [activeTab, setActiveTab] = useState("linkedin");

  // LinkedIn States
  const [headline, setHeadline] = useState("");
  const [about, setAbout] = useState("");
  const [skills, setSkills] = useState("");
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const [linkedinResult, setLinkedinResult] = useState<any>(null);

  // Career Test States
  const [testStarted, setTestStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Roadmap States
  const [roadmapCareer, setRoadmapCareer] = useState("");
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [roadmapResult, setRoadmapResult] = useState<any>(null);

  // LinkedIn Analyze
  async function analyzeLinkedIn() {
    if (!headline && !about && !skills) return;
    setLinkedinLoading(true);
    setLinkedinResult(null);
    try {
      const res = await fetch("/api/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headline, about, skills }),
      });
      const data = await res.json();
      setLinkedinResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLinkedinLoading(false);
    }
  }

  // Career Test
  function handleAnswer(answer: string) {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);
    if (currentQ + 1 < questions.length) {
      setCurrentQ(currentQ + 1);
    } else {
      submitTest(newAnswers);
    }
  }

  async function submitTest(finalAnswers: string[]) {
    setTestLoading(true);
    try {
      const res = await fetch("/api/career-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: finalAnswers, questions: questions.map(q => q.q) }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setTestLoading(false);
    }
  }

  function resetTest() {
    setCurrentQ(0);
    setAnswers([]);
    setTestResult(null);
    setTestStarted(false);
  }

  // Roadmap Generate
  async function generateRoadmap() {
    if (!roadmapCareer) return;
    setRoadmapLoading(true);
    setRoadmapResult(null);
    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ career: roadmapCareer }),
      });
      const data = await res.json();
      setRoadmapResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setRoadmapLoading(false);
    }
  }

  // Auto-fill roadmap from career test result
  function useCareerForRoadmap(careerTitle: string) {
    setRoadmapCareer(careerTitle);
    setActiveTab("roadmap");
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-4 transition">
         ← Dashboard
        </Link>
        <h1 className="text-3xl font-bold">Growth Hub 🚀</h1>
        <p className="text-gray-400 mt-1">Apna career next level le jao</p>
    </div>
      

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-gray-800">
        {[
          { id: "linkedin", label: "🔗 LinkedIn Optimizer" },
          { id: "career-test", label: "🧪 Career Path Test" },
          { id: "roadmap", label: "🗺️ Learning Roadmap" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-4 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── LinkedIn Tab ── */}
      {activeTab === "linkedin" && (
        <div className="max-w-2xl mx-auto space-y-5">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">LinkedIn Headline</label>
            <input type="text" value={headline} onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Frontend Developer | React | Open to Work"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">About Section</label>
            <textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={5}
              placeholder="Apna LinkedIn About section yahan paste karo..."
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Skills (comma separated)</label>
            <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. React, TypeScript, Node.js, SQL"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
          </div>
          <button onClick={analyzeLinkedIn} disabled={linkedinLoading || (!headline && !about && !skills)}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition">
            {linkedinLoading ? "Analyzing..." : "🔍 Analyze Karo"}
          </button>

          {linkedinResult && (
            <div className="space-y-4 mt-6">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <p className="text-gray-400 text-sm mb-1">Overall Score</p>
                <p className="text-4xl font-bold text-blue-400">
                  {linkedinResult.score}<span className="text-xl text-gray-500">/100</span>
                </p>
                <p className="text-gray-300 mt-2 text-sm">{linkedinResult.verdict}</p>
              </div>
              {linkedinResult.improvedHeadline && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <p className="text-gray-400 text-sm mb-2">✨ Improved Headline</p>
                  <p className="text-white font-medium">{linkedinResult.improvedHeadline}</p>
                </div>
              )}
              {linkedinResult.improvedAbout && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <p className="text-gray-400 text-sm mb-2">✨ Improved About</p>
                  <p className="text-white text-sm leading-relaxed">{linkedinResult.improvedAbout}</p>
                </div>
              )}
              {linkedinResult.missingKeywords?.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <p className="text-gray-400 text-sm mb-3">🔑 Missing Keywords</p>
                  <div className="flex flex-wrap gap-2">
                    {linkedinResult.missingKeywords.map((kw: string, i: number) => (
                      <span key={i} className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-xs">{kw}</span>
                    ))}
                  </div>
                </div>
              )}
              {linkedinResult.improvements?.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <p className="text-gray-400 text-sm mb-3">📈 Kya Improve Karo</p>
                  <ul className="space-y-2">
                    {linkedinResult.improvements.map((tip: string, i: number) => (
                      <li key={i} className="text-gray-300 text-sm flex gap-2">
                        <span className="text-yellow-400">→</span> {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Career Test Tab ── */}
      {activeTab === "career-test" && (
        <div className="max-w-xl mx-auto">
          {!testStarted && !testResult && (
            <div className="text-center space-y-6 mt-10">
              <div className="text-6xl">🧪</div>
              <h2 className="text-2xl font-bold">Career Path Test</h2>
              <p className="text-gray-400">15 questions — AI will find your best career matches!</p>
              <button onClick={() => setTestStarted(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-xl transition">
                Start Test 🚀
              </button>
            </div>
          )}

          {testStarted && !testResult && !testLoading && (
            <div className="space-y-6 mt-6">
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-800 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${(currentQ / questions.length) * 100}%` }} />
                </div>
                <span className="text-gray-400 text-sm">{currentQ + 1}/{questions.length}</span>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <p className="text-lg font-medium mb-6">{questions[currentQ].q}</p>
                <div className="space-y-3">
                  {questions[currentQ].options.map((opt, i) => (
                    <button key={i} onClick={() => handleAnswer(opt)}
                      className="w-full text-left bg-gray-800 hover:bg-purple-600/20 hover:border-purple-500 border border-gray-700 px-4 py-3 rounded-xl text-sm transition">
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {testLoading && (
            <div className="text-center mt-20 space-y-4">
              <div className="text-4xl animate-spin">⚙️</div>
              <p className="text-gray-400">AI is analyzing your career profile...</p>
            </div>
          )}

          {testResult && (
            <div className="space-y-4 mt-6">
              <h2 className="text-xl font-bold">🎯 Your Career Matches</h2>
              {testResult.careers?.map((career: any, i: number) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-white">{career.title}</p>
                    <span className="text-purple-400 font-bold">{career.match}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2 mb-3">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${career.match}%` }} />
                  </div>
                  <p className="text-gray-400 text-sm mb-3">{career.reason}</p>
                  {/* 🔥 Auto-fill roadmap button */}
                  <button onClick={() => useCareerForRoadmap(career.title)}
                    className="text-xs text-green-400 border border-green-500/30 hover:border-green-400 px-3 py-1.5 rounded-lg transition">
                    🗺️ Get Roadmap for this career
                  </button>
                </div>
              ))}
              <button onClick={resetTest}
                className="w-full border border-gray-700 hover:border-purple-500 text-gray-400 hover:text-white py-3 rounded-xl transition text-sm">
                🔄 Retake Test
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Roadmap Tab ── */}
      {activeTab === "roadmap" && (
        <div className="max-w-2xl mx-auto space-y-5">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Which career do you want a roadmap for?</label>
            <input type="text" value={roadmapCareer} onChange={(e) => setRoadmapCareer(e.target.value)}
              placeholder="e.g. UX Designer, Data Analyst, Software Engineer"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500" />
          </div>
          <button onClick={generateRoadmap} disabled={roadmapLoading || !roadmapCareer}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition">
            {roadmapLoading ? "Generating..." : "🗺️ Generate Roadmap"}
          </button>

          {roadmapLoading && (
            <div className="text-center mt-10 space-y-3">
              <div className="text-4xl animate-spin">⚙️</div>
              <p className="text-gray-400">Building your personalized roadmap...</p>
            </div>
          )}

          {roadmapResult && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{roadmapResult.title}</h2>
                <span className="text-gray-400 text-sm">⏱ {roadmapResult.totalMonths} months total</span>
              </div>

              {roadmapResult.phases?.map((phase: any, i: number) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
                  {/* Phase Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-sm">
                      {phase.phase}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{phase.title}</p>
                      <p className="text-gray-500 text-xs">{phase.duration}</p>
                    </div>
                  </div>

                  {/* Goal */}
                  <p className="text-gray-400 text-sm">🎯 {phase.goal}</p>

                  {/* Topics */}
                  <div>
                    <p className="text-gray-500 text-xs mb-2">TOPICS</p>
                    <div className="flex flex-wrap gap-2">
                      {phase.topics?.map((topic: string, j: number) => (
                        <span key={j} className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full text-xs">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Resources */}
                  <div>
                    <p className="text-gray-500 text-xs mb-2">RESOURCES</p>
                    <ul className="space-y-2">
                      {phase.resources?.map((res: any, j: number) => (
                        <li key={j} className="flex items-center gap-2 text-sm">
                          <span className={res.free ? "text-green-400" : "text-yellow-400"}>
                            {res.free ? "🆓" : "💰"}
                          </span>
                          <span className="text-gray-300">{res.name}</span>
                          <span className="text-gray-600 text-xs">— {res.type}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}

              <button onClick={() => { setRoadmapResult(null); setRoadmapCareer(""); }}
                className="w-full border border-gray-700 hover:border-green-500 text-gray-400 hover:text-white py-3 rounded-xl transition text-sm">
                🔄 Generate Another Roadmap
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}