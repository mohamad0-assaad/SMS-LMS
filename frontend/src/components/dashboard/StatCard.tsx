import type { LucideIcon } from 'lucide-react'

type Color = 'green' | 'amber' | 'rose'

type StatCardProps = {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: { text: string; positive?: boolean }
  sub?: string
  color?: Color
}

const styles: Record<Color, { icon: string; badge: string; bar: string }> = {
  green:  { icon: 'text-green-400',  badge: 'bg-green-500/10',  bar: 'bg-green-500' },
  amber:  { icon: 'text-amber-400',  badge: 'bg-amber-500/10',  bar: 'bg-amber-500' },
  rose:   { icon: 'text-rose-400',   badge: 'bg-rose-500/10',   bar: 'bg-rose-500' },
}

export function StatCard({ title, value, icon: Icon, trend, sub, color = 'green' }: StatCardProps) {
  const s = styles[color]
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] p-5 shadow-lg">
      <div className={`absolute left-0 top-0 h-full w-0.5 ${s.bar} opacity-70`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-white">
            {value}
            {sub ? (
              <span className="ml-1 text-sm font-normal text-slate-400">{sub}</span>
            ) : null}
          </p>
          {trend ? (
            <p className={`mt-2 flex items-center gap-1 text-xs font-medium ${
              trend.positive === false ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {trend.positive === false ? '▼' : '▲'} {trend.text}
            </p>
          ) : null}
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.badge}`}>
          <Icon className={`h-5 w-5 ${s.icon}`} strokeWidth={1.8} />
        </div>
      </div>
    </div>
  )
}
