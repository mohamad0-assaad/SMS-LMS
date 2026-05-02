import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { getJson, postJson } from '../../lib/api'

const DEFAULT_FEATURES: Record<string, number> = {
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

type PredictResult = {
  failure_risk?: number
  recommended_topic?: string
  study_strategy?: string
}

const BASIC_KEYS = [
  'exam_score',
  'quiz_score',
  'assignment_score',
  'attendance_rate',
  'quiz_attempts',
  'study_time_hours',
  'login_frequency',
  'course_progress',
] as const

const TOPIC_KEYS = [
  'topic_variables',
  'topic_loops',
  'topic_functions',
  'topic_oop',
  'topic_recursion',
  'topic_datastructures',
] as const

export function StudentSkillInsightPage() {
  const { role } = useParams()
  const { pathname } = useLocation()
  const base = `/app/${role ?? 'teacher'}`
  const sid = pathname.match(/\/students\/([^/]+)\/skill/)?.[1] ?? ''

  const [name, setName] = useState<string>('Student')
  const [features, setFeatures] = useState<Record<string, number>>({ ...DEFAULT_FEATURES })
  const [result, setResult] = useState<PredictResult | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!sid) return
    let cancelled = false
    getJson<{ users: { _id: string; name: string }[] }>(`/api/users?role=student&limit=200`)
      .then((d) => {
        const u = d.users?.find((x) => x._id === sid)
        if (!cancelled && u?.name) setName(u.name)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [sid])

  async function runPredict() {
    setLoading(true)
    setErr(null)
    setResult(null)
    try {
      const data = await postJson<PredictResult>('/api/skillup/predict', features)
      setResult(data)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Prediction failed')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-teal-500/50'

  function numField(key: string, lbl: string) {
    return (
      <label key={key} className="block text-sm">
        <span className="text-slate-400">{lbl}</span>
        <input
          type="number"
          step="any"
          className={inputCls}
          value={features[key] ?? 0}
          onChange={(e) => {
            const v = e.target.value === '' ? 0 : Number(e.target.value)
            setFeatures((f) => ({ ...f, [key]: Number.isNaN(v) ? 0 : v }))
          }}
        />
      </label>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-white">SkillUp · {name}</h1>
          <p className="text-sm text-slate-500">
            Adjust learning signals for this learner (your class context), then run the SkillUp model.
          </p>
        </div>
        <Link
          to={`${base}/students`}
          className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-white/[0.08]"
        >
          ← Students
        </Link>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#111827] p-5 shadow-lg">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Core signals</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {BASIC_KEYS.map((k) => numField(k, k.replace(/_/g, ' ')))}
        </div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Topic mastery (0–1)
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {TOPIC_KEYS.map((k) => numField(k, k.replace(/^topic_/, '').replace(/_/g, ' ')))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => void runPredict()}
        disabled={loading || !sid}
        className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
      >
        {loading ? 'Running…' : 'Run prediction'}
      </button>

      {err ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          {err}
        </div>
      ) : null}

      {result ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.08] p-5 shadow-lg">
          <h2 className="text-sm font-semibold text-emerald-400">Prediction</h2>
          <dl className="mt-3 space-y-2 text-sm">
            {result.failure_risk != null ? (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Failure risk (model output)</dt>
                <dd className="font-medium text-white">{String(result.failure_risk)}</dd>
              </div>
            ) : null}
            {result.recommended_topic != null ? (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Recommended topic</dt>
                <dd className="font-medium text-white">{String(result.recommended_topic)}</dd>
              </div>
            ) : null}
            {result.study_strategy != null ? (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Study strategy</dt>
                <dd className="font-medium text-white">{String(result.study_strategy)}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}
    </div>
  )
}
