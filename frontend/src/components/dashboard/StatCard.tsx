import type { LucideIcon } from 'lucide-react'

type StatCardProps = {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: { text: string; positive?: boolean }
  sub?: string
}

export function StatCard({ title, value, icon: Icon, trend, sub }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            {value}
            {sub ? (
              <span className="ml-1 text-base font-normal text-slate-500">{sub}</span>
            ) : null}
          </p>
          {trend ? (
            <p
              className={`mt-2 text-xs font-medium ${
                trend.positive === false ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {trend.text}
            </p>
          ) : null}
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
      </div>
    </div>
  )
}
