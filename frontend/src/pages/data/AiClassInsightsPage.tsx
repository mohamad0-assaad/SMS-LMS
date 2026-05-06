import { BookOpen, Brain, ChevronDown, ChevronUp, Loader2, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { apiFetch, getJson, postJson } from '../../lib/api'

type IdRow = { _id: string; name: string }
type ClassesRes = { classes: IdRow[] }
type SubjectsRes = { subjects?: IdRow[] }

type QuizQuestion = {
  questionText: string
  type: string
  options: string[]
  correctAnswer: string
  points: number
}

type QuizResult = {
  className: string
  subjectName: string
  questions: QuizQuestion[]
  warning?: string
}

type SkillupResult = {
  failure_risk?: number
  recommended_topic?: string
  study_strategy?: string
}

const SKILLUP_SAMPLE: Record<string, number> = {
  exam_score: 72,
  quiz_score: 68,
  assignment_score: 75,
  attendance_rate: 85,
  quiz_attempts: 4,
  study_time_hours: 12,
  login_frequency: 20,
  course_progress: 60,
  topic_variables: 1,
  topic_loops: 0,
  topic_functions: 1,
  topic_oop: 0,
  topic_recursion: 0,
  topic_datastructures: 1,
}

function FormattedText({ text }: { text: string }) {
  const blocks = text.split(/\n\n+/)
  return (
    <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
      {blocks.map((block, i) => {
        const lines = block.split('\n')
        const isList = lines.some((l) => /^[•\-\*]\s|^\d+\.\s/.test(l.trim()))
        if (isList) {
          return (
            <ul key={i} className="space-y-1.5 pl-1">
              {lines
                .filter((l) => l.trim())
                .map((line, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="mt-0.5 shrink-0 text-green-400">›</span>
                    <span>{line.replace(/^[•\-\*\d\.]+\s*/, '').trim()}</span>
                  </li>
                ))}
            </ul>
          )
        }
        return (
          <p key={i} className="whitespace-pre-wrap">
            {block}
          </p>
        )
      })}
    </div>
  )
}

function QuizCard({ q, index }: { q: QuizQuestion; index: number }) {
  const [revealed, setRevealed] = useState(false)
  const letters = ['A', 'B', 'C', 'D', 'E']
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#111111] p-4 shadow-lg">
      <p className="text-sm font-semibold text-white">
        Q{index + 1}. {q.questionText}
      </p>
      <ul className="mt-3 space-y-2">
        {q.options.map((opt, i) => {
          const isCorrect = opt === q.correctAnswer
          return (
            <li
              key={i}
              className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                revealed && isCorrect
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-medium'
                  : 'border-white/[0.06] bg-white/[0.03] text-slate-400'
              }`}
            >
              <span className="shrink-0 font-medium text-slate-500">{letters[i] ?? i + 1}.</span>
              <span>{opt}</span>
            </li>
          )
        })}
      </ul>
      <div className="mt-3 flex items-center gap-3">
        {!revealed ? (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="text-xs font-medium text-green-400 hover:underline"
          >
            Reveal answer
          </button>
        ) : (
          <span className="text-xs text-slate-500">
            ✓ Correct: <span className="font-semibold text-emerald-400">{q.correctAnswer}</span>
            {' '}· {q.points} pt
          </span>
        )}
      </div>
    </div>
  )
}

function SectionError({ msg }: { msg: string }) {
  return (
    <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
      {msg}
    </p>
  )
}

export function AiClassInsightsPage() {
  const [classes, setClasses] = useState<IdRow[]>([])
  const [subjects, setSubjects] = useState<IdRow[]>([])
  const [loadErr, setLoadErr] = useState<string | null>(null)

  const [askPrompt, setAskPrompt] = useState('')
  const [askBusy, setAskBusy] = useState(false)
  const [askResult, setAskResult] = useState<string | null>(null)
  const [askErr, setAskErr] = useState<string | null>(null)

  const [topic, setTopic] = useState('')
  const [strategy, setStrategy] = useState('Practice')
  const [risk, setRisk] = useState(0)
  const [recBusy, setRecBusy] = useState(false)
  const [recResult, setRecResult] = useState<string | null>(null)
  const [recErr, setRecErr] = useState<string | null>(null)

  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [count, setCount] = useState(5)
  const [quizBusy, setQuizBusy] = useState(false)
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null)
  const [quizErr, setQuizErr] = useState<string | null>(null)
  const [quizExpanded, setQuizExpanded] = useState(true)

  const [skillupBusy, setSkillupBusy] = useState(false)
  const [skillupResult, setSkillupResult] = useState<SkillupResult | null>(null)
  const [skillupErr, setSkillupErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getJson<ClassesRes>('/api/classes?page=1&limit=200'),
      getJson<SubjectsRes>('/api/subjects?page=1&limit=200'),
    ])
      .then(([c, s]) => {
        if (cancelled) return
        const cl = c.classes ?? []
        const su = s.subjects ?? []
        setClasses(cl)
        setSubjects(su)
        if (cl[0]) setClassId((v) => v || cl[0]!._id)
        if (su[0]) setSubjectId((v) => v || su[0]!._id)
      })
      .catch((e: Error) => {
        if (!cancelled) setLoadErr(e.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function doAsk() {
    setAskBusy(true)
    setAskErr(null)
    setAskResult(null)
    try {
      const data = await postJson<{ answer?: string }>('/api/ai/ask', { prompt: askPrompt })
      setAskResult(data.answer ?? JSON.stringify(data))
    } catch (e) {
      setAskErr(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setAskBusy(false)
    }
  }

  async function doRecommend() {
    setRecBusy(true)
    setRecErr(null)
    setRecResult(null)
    try {
      const data = await postJson<{ recommendation?: string }>('/api/ai/recommend', { topic, strategy, risk })
      setRecResult(data.recommendation ?? JSON.stringify(data))
    } catch (e) {
      setRecErr(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setRecBusy(false)
    }
  }

  async function doQuiz() {
    setQuizBusy(true)
    setQuizErr(null)
    setQuizResult(null)
    try {
      const res = await apiFetch('/api/ai/generate-class-quiz', {
        method: 'POST',
        body: JSON.stringify({ classId, subjectId, count }),
      })
      const data = (await res.json().catch(() => ({}))) as QuizResult & { message?: string }
      if (!res.ok) throw new Error(data.message ?? `Failed (${res.status})`)
      setQuizResult(data)
      setQuizExpanded(true)
    } catch (e) {
      setQuizErr(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setQuizBusy(false)
    }
  }

  async function doSkillup() {
    setSkillupBusy(true)
    setSkillupErr(null)
    setSkillupResult(null)
    try {
      const data = await postJson<SkillupResult>('/api/skillup/predict', SKILLUP_SAMPLE)
      setSkillupResult(data)
    } catch (e) {
      setSkillupErr(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setSkillupBusy(false)
    }
  }

  const riskPercent =
    skillupResult?.failure_risk != null
      ? Math.round(Number(skillupResult.failure_risk) * 100)
      : null

  const inputCls = 'w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20'
  const labelCls = 'block text-xs font-medium text-slate-400 mb-1'

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">AI Insights</h1>
        <p className="text-sm text-slate-500">
          Gemini-powered tools for teachers — ask questions, get study recommendations, and generate class quizzes.
        </p>
      </div>

      {loadErr && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          {loadErr}
        </div>
      )}

      {/* Ask AI */}
      <section className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#111111] p-5 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-400">
            <Brain className="h-4 w-4" />
          </div>
          <h2 className="font-semibold text-white">Ask AI</h2>
        </div>
        <textarea
          value={askPrompt}
          onChange={(e) => setAskPrompt(e.target.value)}
          className="min-h-24 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-green-500/50 focus:outline-none focus:ring-2 focus:ring-green-500/20"
          placeholder="Ask anything about your students, class, curriculum…"
        />
        <button
          type="button"
          disabled={askBusy || !askPrompt.trim()}
          onClick={() => void doAsk()}
          className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-500 disabled:opacity-60"
        >
          {askBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Ask
        </button>
        {askErr && <SectionError msg={askErr} />}
        {askResult && (
          <div className="rounded-xl border border-green-500/20 bg-green-500/[0.06] p-4">
            <FormattedText text={askResult} />
          </div>
        )}
      </section>

      {/* Smart Recommendation */}
      <section className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#111111] p-5 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <h2 className="font-semibold text-white">Smart Recommendation</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Topic</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className={inputCls}
              placeholder="e.g. Recursion"
            />
          </div>
          <div>
            <label className={labelCls}>Strategy</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className={inputCls}
            >
              {['Practice', 'Visual', 'Reading', 'Mixed', 'Project-based'].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>
              Focus (0 = foundational · 1 = advanced)
            </label>
            <input
              type="number"
              min={0}
              max={1}
              step={0.1}
              value={risk}
              onChange={(e) => setRisk(Number(e.target.value))}
              className={inputCls}
            />
          </div>
        </div>
        <button
          type="button"
          disabled={recBusy || !topic.trim()}
          onClick={() => void doRecommend()}
          className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-500 disabled:opacity-60"
        >
          {recBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate Recommendation
        </button>
        {recErr && <SectionError msg={recErr} />}
        {recResult && (
          <div className="rounded-xl border border-green-500/20 bg-green-500/[0.06] p-4">
            <FormattedText text={recResult} />
          </div>
        )}
      </section>

      {/* Generate Class Quiz */}
      <section className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#111111] p-5 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-400">
            <BookOpen className="h-4 w-4" />
          </div>
          <h2 className="font-semibold text-white">Generate Class Quiz</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Class</label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className={inputCls}
            >
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Subject</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className={inputCls}
            >
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Questions (3–20)</label>
            <input
              type="number"
              min={3}
              max={20}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className={inputCls}
            />
          </div>
        </div>
        <button
          type="button"
          disabled={quizBusy || !classId || !subjectId}
          onClick={() => void doQuiz()}
          className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-500 disabled:opacity-60"
        >
          {quizBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
          Generate Draft Quiz
        </button>
        {quizErr && <SectionError msg={quizErr} />}
        {quizResult && (
          <div className="space-y-3">
            {quizResult.warning && (
              <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                ⚠ {quizResult.warning}
              </p>
            )}
            <button
              type="button"
              onClick={() => setQuizExpanded((o) => !o)}
              className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white"
            >
              {quizExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {quizResult.className} · {quizResult.subjectName} — {quizResult.questions.length} questions
            </button>
            {quizExpanded && (
              <div className="space-y-3">
                {quizResult.questions.map((q, i) => (
                  <QuizCard key={i} q={q} index={i} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* SkillUp ML */}
      <section className="space-y-4 rounded-2xl border border-green-500/20 bg-green-500/[0.06] p-5 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-400">
            <Brain className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold text-white">SkillUp ML · Failure Risk</h2>
            <p className="text-xs text-slate-500">
              Requires the Python service running on port 8000
            </p>
          </div>
        </div>
        <p className="rounded-lg bg-black/40 px-3 py-2 text-xs text-slate-300 font-mono">
          cd skillup-ai &amp;&amp; python -m uvicorn main:app --host 127.0.0.1 --port 8000
        </p>
        <button
          type="button"
          disabled={skillupBusy}
          onClick={() => void doSkillup()}
          className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-500 disabled:opacity-60"
        >
          {skillupBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Run sample prediction
        </button>
        {skillupErr && <SectionError msg={skillupErr} />}
        {skillupResult && (
          <div className="grid gap-3 sm:grid-cols-3">
            {riskPercent != null && (
              <div className={`rounded-xl border p-4 text-center ${
                riskPercent >= 60 ? 'border-rose-500/20 bg-rose-500/10' :
                riskPercent >= 35 ? 'border-amber-500/20 bg-amber-500/10' :
                'border-emerald-500/20 bg-emerald-500/10'
              }`}>
                <p className="text-xs font-medium text-slate-500 mb-1">Failure Risk</p>
                <p className={`text-3xl font-bold ${
                  riskPercent >= 60 ? 'text-rose-400' :
                  riskPercent >= 35 ? 'text-amber-400' :
                  'text-emerald-400'
                }`}>
                  {riskPercent}%
                </p>
              </div>
            )}
            {skillupResult.recommended_topic && (
              <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-center">
                <p className="text-xs font-medium text-slate-500 mb-1">Recommended Topic</p>
                <p className="text-sm font-semibold text-green-300">{skillupResult.recommended_topic}</p>
              </div>
            )}
            {skillupResult.study_strategy && (
              <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-center">
                <p className="text-xs font-medium text-slate-500 mb-1">Study Strategy</p>
                <p className="text-sm font-semibold text-green-300">{skillupResult.study_strategy}</p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
