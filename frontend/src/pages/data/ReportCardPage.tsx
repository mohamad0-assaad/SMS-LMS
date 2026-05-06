import { useEffect, useState } from 'react'
import { getJson, getProfile, postJson } from '../../lib/api'
import { FileText, Sparkles } from 'lucide-react'

type SubjectResult = { subjectName: string; score: number; grade: string; remarks: string }
type ReportCard = { _id: string; term: string; averageScore: number; attendance: number; teacherComment: string; results: SubjectResult[]; generatedAt: string; student?: { name: string } }
type ClassOption = { _id: string; name: string }

function gradeBadge(grade: string) {
  if (grade === 'A+' || grade === 'A') return 'text-emerald-400'
  if (grade === 'B') return 'text-green-400'
  if (grade === 'C') return 'text-amber-400'
  return 'text-rose-400'
}

export function ReportCardPage() {
  const [role, setRole] = useState<string | null>(null)
  const [reports, setReports] = useState<ReportCard[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [term, setTerm] = useState(`${new Date().getFullYear()}-Term 1`)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    getProfile().then((p) => {
      setRole(p?.role ?? null)
      if (p && p.role !== 'student') {
        getJson<any>('/api/classes').then((d) => {
          const cls = d.classes ?? []
          setClasses(cls)
          if (cls[0]) setSelectedClass(cls[0]._id)
        })
      }
    })
    getJson<ReportCard[]>('/api/report-cards')
      .then(setReports)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedClass || role === 'student') return
    setLoading(true)
    getJson<ReportCard[]>(`/api/report-cards/class/${selectedClass}?term=${encodeURIComponent(term)}`)
      .then(setReports)
      .catch(() => setReports([]))
      .finally(() => setLoading(false))
  }, [selectedClass, role])

  async function generate() {
    if (!selectedClass || !term) return
    setGenerating(true); setErr(null); setMsg(null)
    try {
      const d = await postJson<{ message: string }>('/api/report-cards/generate', { classId: selectedClass, term })
      setMsg(d.message)
      getJson<ReportCard[]>(`/api/report-cards/class/${selectedClass}?term=${encodeURIComponent(term)}`).then(setReports).catch(() => {})
    } catch (ex: any) { setErr(ex.message) }
    finally { setGenerating(false) }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-white">Report Cards</h1>
        {role !== 'student' && (
          <div className="flex flex-wrap items-center gap-3">
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="rounded-xl border border-white/[0.08] bg-[#111111] px-3 py-2 text-sm text-white">
              {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="e.g. 2024-Term 1" className="w-40 rounded-xl border border-white/[0.08] bg-[#111111] px-3 py-2 text-sm text-white outline-none focus:border-green-500/50" />
            <button onClick={generate} disabled={generating || !selectedClass}
              className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50">
              <Sparkles className="h-4 w-4" /> {generating ? 'Generating…' : 'Generate'}
            </button>
          </div>
        )}
      </div>

      {err && <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{err}</p>}
      {msg && <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">{msg}</p>}

      {loading ? <p className="text-sm text-slate-500">Loading…</p> : !reports.length ? (
        <div className="flex flex-col items-center gap-3 py-16 text-slate-500"><FileText className="h-10 w-10 opacity-30" /><p className="text-sm">No report cards yet{role !== 'student' ? '. Generate one above.' : '.'}</p></div>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <div key={r._id} className="rounded-2xl border border-white/[0.08] bg-[#111111] overflow-hidden">
              <button onClick={() => setExpanded((e) => (e === r._id ? null : r._id))} className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02]">
                <div>
                  {r.student && <p className="text-xs text-slate-500 mb-0.5">{r.student.name}</p>}
                  <p className="text-sm font-semibold text-white">{r.term}</p>
                  <p className="text-xs text-slate-500">Average: <span className="text-green-400">{r.averageScore}%</span> · Attendance: <span className="text-green-400">{r.attendance}%</span></p>
                </div>
                <span className="text-xs text-slate-500">{expanded === r._id ? '▲' : '▼'}</span>
              </button>
              {expanded === r._id && (
                <div className="border-t border-white/[0.06] px-5 py-4 space-y-4">
                  <div className="overflow-hidden rounded-xl border border-white/[0.06]">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-white/[0.06] text-left text-xs text-slate-500"><th className="px-4 py-2">Subject</th><th className="px-4 py-2">Score</th><th className="px-4 py-2">Grade</th><th className="px-4 py-2">Remarks</th></tr></thead>
                      <tbody>
                        {r.results.map((s, i) => (
                          <tr key={i} className="border-b border-white/[0.04]">
                            <td className="px-4 py-2 text-slate-200">{s.subjectName}</td>
                            <td className="px-4 py-2 text-slate-300">{s.score}%</td>
                            <td className={`px-4 py-2 font-bold ${gradeBadge(s.grade)}`}>{s.grade}</td>
                            <td className="px-4 py-2 text-slate-500">{s.remarks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {r.teacherComment && (
                    <div className="rounded-xl border border-green-500/20 bg-green-500/[0.06] px-4 py-3">
                      <p className="text-xs font-semibold text-green-400 mb-1">Teacher's Comment</p>
                      <p className="text-sm text-slate-300">{r.teacherComment}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
