<div align="center">

<br />

# CareerSync AI

### Everything you need to land your dream job — in one place.

**AI Mock Interviews · ATS Resume Scoring · LinkedIn Optimizer · Career Path Test · Cover Letter Generator**

<br />

[![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Groq](https://img.shields.io/badge/Groq_LLaMA_3.3-F55036?style=for-the-badge&logo=meta&logoColor=white)](https://groq.com/)
[![Vercel](https://img.shields.io/badge/Deployed_on_Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://career-sync-ai-gamma.vercel.app/)

<br />

**[🚀 Live Demo](https://career-sync-ai-gamma.vercel.app/) · [📁 Report Bug](https://github.com/Simrannnnnnnnnnnn/Career-Sync-ai/issues) · [✨ Request Feature](https://github.com/Simrannnnnnnnnnnn/Career-Sync-ai/issues)**

<br />

</div>

---

## About

**CareerSync AI** is a full-stack AI-powered career platform built for job seekers who want an unfair advantage. It combines everything you need — from AI mock interviews and ATS resume scoring to LinkedIn profile optimization and a personalised career path test — all inside a polished dark glassmorphism interface.

Built with **Next.js 14 App Router**, **Supabase** for authentication and database, and **Groq's Llama 3.3-70B** powering all AI features in real time.

---

## Features

<table>
<tr>
<td width="50%">

### 🎙️ AI Interview Simulator
Select your role, round type, and difficulty. Get 8–10 tailored questions with real-time AI feedback on every answer. Supports 25+ job roles with live search.

**Rounds:** HR · Technical · Analytical  
**Levels:** Entry · Mid · Senior

</td>
<td width="50%">

### 📄 ATS Resume Scorer
Upload your resume (PDF or DOCX). Get category-wise scores across Contact Info, Experience, Skills, Education, and Formatting — plus actionable improvement suggestions.

**Modes:** Standard ATS Matrix · Direct JD Match

</td>
</tr>
<tr>
<td width="50%">

### 🚀 Growth Hub
Three tools in one: a LinkedIn profile optimizer that rewrites your headline and about section with recruiter keywords, a Career Path Test based on the 4 P's framework, and an AI-generated learning roadmap.

</td>
<td width="50%">

### ✍️ Cover Letter Generator
Paste a job description and get a tailored cover letter in under 30 seconds, powered by Groq's Llama 3.3-70B. Role and JD-aware generation.

</td>
</tr>
<tr>
<td width="50%">

### 📋 Job Tracker
Track every application and interview stage in one place. Never lose track of where you applied and what's next.

</td>
<td width="50%">

### 🔐 Auth & Onboarding
Secure authentication via Supabase — supports Google OAuth and email/password. Smooth onboarding flow to personalise your experience from day one.

</td>
</tr>
</table>

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| **UI Design** | Custom dark glassmorphism design system |
| **Backend** | Next.js API Routes (serverless) |
| **Auth & Database** | Supabase — PostgreSQL + Auth |
| **AI Engine** | Groq SDK — Llama 3.3-70B |
| **Resume Parsing** | Mammoth (DOCX), PDF.js (PDF) |
| **Deployment** | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Groq](https://console.groq.com) API key

### Installation

```bash
git clone https://github.com/Simrannnnnnnnnnnn/Career-Sync-ai.git
cd Career-Sync-ai
npm install
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GROQ_API_KEY=your_groq_api_key
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
career-sync-ai/
├── app/
│   ├── dashboard/           # Main dashboard
│   ├── interview/
│   │   ├── setup/           # Role, round & difficulty selection
│   │   └── session/         # Live AI interview session
│   ├── resume/              # ATS Resume Scorer
│   ├── growth/              # Growth Hub — LinkedIn, Career Test, Roadmap
│   ├── cover/               # Cover Letter Generator
│   ├── jobs/                # Job Tracker
│   ├── onboarding/          # User onboarding flow
│   ├── login/               # Authentication page
│   └── api/                 # Serverless API routes
│       ├── interview/        # Interview question generation & scoring
│       ├── resume/           # Resume parsing & ATS scoring
│       ├── linkedin/         # LinkedIn profile optimization
│       ├── career-test/      # Career path test logic
│       ├── roadmap/          # Learning roadmap generation
│       └── cover-letter/     # Cover letter generation
├── components/              # Reusable UI components
├── lib/                     # Supabase client & utilities
├── middleware.ts             # Auth middleware
└── .env.local               # Environment variables (not committed)
```

---

## Deployment

This project is deployed on **Vercel**. To deploy your own instance:

1. Fork this repository
2. Import the project on [Vercel](https://vercel.com/new)
3. Add all environment variables from `.env.local` in Vercel project settings
4. In your Supabase dashboard under **Authentication → URL Configuration**, set:
   - **Site URL:** `https://your-app.vercel.app`
   - **Redirect URLs:** `https://your-app.vercel.app/**`
5. Deploy!

---

## Roadmap

- [x] AI Mock Interview Simulator (HR, Technical, Analytical rounds)
- [x] ATS Resume Scorer with category-wise metrics
- [x] LinkedIn Profile Optimizer
- [x] Career Path Test (4 P's + Ikigai framework)
- [x] Cover Letter Generator
- [x] Job Tracker
- [x] Google OAuth + Email authentication
- [ ] Voice-based interview mode
- [ ] Job board integration
- [ ] Interview history & performance analytics
- [ ] Mobile app

---

## Author

**Simran Kaur**  
MCA Data Science · Lovely Professional University  
Building at the intersection of AI and career tech.

[![GitHub](https://img.shields.io/badge/GitHub-Simrannnnnnnnnnnn-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/Simrannnnnnnnnnnn)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://linkedin.com/in/simran-kaur)

---

<div align="center">

If this project helped you, consider giving it a ⭐

</div>