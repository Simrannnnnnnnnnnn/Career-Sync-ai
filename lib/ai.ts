/**
 
 * Task Division:
 *  Cerebras   → Interview questions (fastest, real-time)
 *  Gemini     → Report generation (best JSON output)
 *  Mistral    → Speech correction (light + fast)
 *  SambaNova  → Cover letter, job descriptions (long-form)
 *  Cohere     → Suggestions, resume tips, text tasks
 *  Groq       → Fallback for everything
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIOptions {
  messages: AIMessage[]
  maxTokens?: number
  temperature?: number
}

// ── Provider API configs ───────────────────────────────────────────────────────

const PROVIDERS = {
  cerebras: {
    url: 'https://api.cerebras.ai/v1/chat/completions',
    key: process.env.CEREBRAS_API_KEY || '',
    model: 'llama-3.3-70b',
  },
  gemini: {
    url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY || ''}`,
    key: process.env.GEMINI_API_KEY || '',
    model: 'gemini-1.5-flash',
  },
  mistral: {
    url: 'https://api.mistral.ai/v1/chat/completions',
    key: process.env.MISTRAL_API_KEY || '',
    model: 'mistral-small-latest',
  },
  sambanova: {
    url: 'https://api.sambanova.ai/v1/chat/completions',
    key: process.env.SAMBANOVA_API_KEY || '',
    model: 'Meta-Llama-3.3-70B-Instruct',
  },
  cohere: {
    url: 'https://api.cohere.com/v2/chat',
    key: process.env.COHERE_API_KEY || '',
    model: 'command-r-plus',
  },
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    key: process.env.GROQ_API_KEY || '',
    model: 'llama-3.3-70b-versatile',
  },
}

// ── Core caller functions ──────────────────────────────────────────────────────

/** OpenAI-compatible providers: Cerebras, Mistral, SambaNova, Groq */
async function callOpenAICompat(
  provider: keyof Omit<typeof PROVIDERS, 'gemini' | 'cohere'>,
  opts: AIOptions
): Promise<string> {
  const p = PROVIDERS[provider]
  const res = await fetch(p.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${p.key}`,
    },
    body: JSON.stringify({
      model: p.model,
      messages: opts.messages,
      max_tokens: opts.maxTokens ?? 1000,
      temperature: opts.temperature ?? 0.7,
    }),
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`${provider} error: ${res.status}`)
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error(`${provider} returned empty response`)
  return text
}

/** Gemini has a different API format */
async function callGemini(opts: AIOptions): Promise<string> {
  const p = PROVIDERS.gemini
  // Extract system prompt and merge with first user message for Gemini
  const systemMsg = opts.messages.find(m => m.role === 'system')?.content || ''
  const convoMsgs = opts.messages.filter(m => m.role !== 'system')

  const contents = convoMsgs.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  // Prepend system prompt to first user message
  if (systemMsg && contents.length > 0 && contents[0].role === 'user') {
    contents[0].parts[0].text = `${systemMsg}\n\n${contents[0].parts[0].text}`
  }

  const res = await fetch(p.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: opts.temperature ?? 0.3,
        maxOutputTokens: opts.maxTokens ?? 1000,
      },
    }),
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`)
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  if (!text) throw new Error('Gemini returned empty response')
  return text
}

/** Cohere has its own chat format */
async function callCohere(opts: AIOptions): Promise<string> {
  const p = PROVIDERS.cohere
  const systemMsg = opts.messages.find(m => m.role === 'system')?.content || ''
  const userMsgs = opts.messages.filter(m => m.role !== 'system')

  const messages = userMsgs.map(m => ({
    role: m.role === 'assistant' ? 'CHATBOT' : 'USER',
    message: m.content,
  }))

  const res = await fetch(p.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${p.key}`,
    },
    body: JSON.stringify({
      model: p.model,
      messages,
      preamble: systemMsg || undefined,
      max_tokens: opts.maxTokens ?? 1000,
      temperature: opts.temperature ?? 0.7,
    }),
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`Cohere error: ${res.status}`)
  const data = await res.json()
  const text = data.message?.content?.[0]?.text?.trim() || data.text?.trim()
  if (!text) throw new Error('Cohere returned empty response')
  return text
}

// ── HF Space fallback (last resort) ───────────────────────────────────────────

async function callHFSpace(opts: AIOptions): Promise<string> {
  const HF_URL = `${process.env.HF_SPACE_URL}/chat`
  const systemMsg = opts.messages.find(m => m.role === 'system')?.content || ''
  const convoMsgs = opts.messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role, content: m.content }))

  const res = await fetch(HF_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        ...(systemMsg ? [{ role: 'system', content: systemMsg }] : []),
        ...convoMsgs,
      ],
      max_tokens: opts.maxTokens ?? 1000,
    }),
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new Error(`HF Space error: ${res.status}`)
  const data = await res.json()
  const text = data.reply?.trim()
  if (!text) throw new Error('HF Space returned empty response')
  return text
}

// ── 🎯 TASK-SPECIFIC FUNCTIONS (use these in your routes) ─────────────────────

/**
 * Interview questions — Cerebras primary (fastest)
 * Chain: Cerebras → Groq → HF Space
 */
export async function generateInterviewQuestion(opts: AIOptions): Promise<string> {
  const chain = [
    () => callOpenAICompat('cerebras', { ...opts, maxTokens: opts.maxTokens ?? 200 }),
    () => callOpenAICompat('groq', { ...opts, maxTokens: opts.maxTokens ?? 200 }),
    () => callHFSpace({ ...opts, maxTokens: opts.maxTokens ?? 200 }),
  ]
  return runChain(chain, 'InterviewQuestion')
}

/**
 * Report generation — Gemini primary (best JSON)
 * Chain: Gemini → SambaNova → Groq → HF Space
 */
export async function generateReport(opts: AIOptions): Promise<string> {
  const chain = [
    () => callGemini({ ...opts, maxTokens: opts.maxTokens ?? 2000, temperature: 0.3 }),
    () => callOpenAICompat('sambanova', { ...opts, maxTokens: opts.maxTokens ?? 2000, temperature: 0.3 }),
    () => callOpenAICompat('groq', { ...opts, maxTokens: opts.maxTokens ?? 2000, temperature: 0.3 }),
    () => callHFSpace({ ...opts, maxTokens: opts.maxTokens ?? 2000 }),
  ]
  return runChain(chain, 'Report')
}

/**
 * Speech correction — Mistral primary (light + fast)
 * Chain: Mistral → Cerebras → Groq
 */
export async function correctSpeech(opts: AIOptions): Promise<string> {
  const chain = [
    () => callOpenAICompat('mistral', { ...opts, maxTokens: opts.maxTokens ?? 300 }),
    () => callOpenAICompat('cerebras', { ...opts, maxTokens: opts.maxTokens ?? 300 }),
    () => callOpenAICompat('groq', { ...opts, maxTokens: opts.maxTokens ?? 300 }),
  ]
  return runChain(chain, 'SpeechCorrection')
}

/**
 * Cover letter / job description — SambaNova primary (long-form)
 * Chain: SambaNova → Gemini → Groq
 */
export async function generateLongForm(opts: AIOptions): Promise<string> {
  const chain = [
    () => callOpenAICompat('sambanova', { ...opts, maxTokens: opts.maxTokens ?? 1500 }),
    () => callGemini({ ...opts, maxTokens: opts.maxTokens ?? 1500 }),
    () => callOpenAICompat('groq', { ...opts, maxTokens: opts.maxTokens ?? 1500 }),
  ]
  return runChain(chain, 'LongForm')
}

/**
 * Suggestions / resume tips / text analysis — Cohere primary
 * Chain: Cohere → Mistral → Gemini → Groq
 */
export async function generateSuggestion(opts: AIOptions): Promise<string> {
  const chain = [
    () => callCohere({ ...opts, maxTokens: opts.maxTokens ?? 800 }),
    () => callOpenAICompat('mistral', { ...opts, maxTokens: opts.maxTokens ?? 800 }),
    () => callGemini({ ...opts, maxTokens: opts.maxTokens ?? 800 }),
    () => callOpenAICompat('groq', { ...opts, maxTokens: opts.maxTokens ?? 800 }),
  ]
  return runChain(chain, 'Suggestion')
}

/**
 * General purpose — full chain
 * Chain: Cerebras → Gemini → Mistral → SambaNova → Cohere → Groq → HF Space
 */
export async function generateAI(opts: AIOptions): Promise<string> {
  const chain = [
    () => callOpenAICompat('cerebras', opts),
    () => callGemini(opts),
    () => callOpenAICompat('mistral', opts),
    () => callOpenAICompat('sambanova', opts),
    () => callCohere(opts),
    () => callOpenAICompat('groq', opts),
    () => callHFSpace(opts),
  ]
  return runChain(chain, 'General')
}

// ── Chain runner ───────────────────────────────────────────────────────────────

async function runChain(
  chain: Array<() => Promise<string>>,
  taskName: string
): Promise<string> {
  for (let i = 0; i < chain.length; i++) {
    try {
      const result = await chain[i]()
      if (i > 0) console.log(`[AI Chain] ${taskName}: provider ${i + 1} succeeded`)
      return result
    } catch (err: any) {
      console.warn(`[AI Chain] ${taskName}: provider ${i + 1} failed — ${err.message}`)
      if (i === chain.length - 1) {
        throw new Error(`All providers failed for ${taskName}`)
      }
    }
  }
  throw new Error(`Chain empty for ${taskName}`)
}