import type { ReactNode } from 'react'

type Variant = 'purple' | 'teal' | 'navy'

const variants: Record<
  Variant,
  { wrap: string; title: string; body: string; button: string }
> = {
  purple: {
    wrap: 'from-violet-600 via-fuchsia-600 to-purple-700',
    title: 'text-white',
    body: 'text-violet-100',
    button:
      'bg-white/95 text-violet-700 hover:bg-white shadow-sm',
  },
  teal: {
    wrap: 'from-teal-700 via-teal-600 to-cyan-700',
    title: 'text-white',
    body: 'text-teal-100',
    button: 'bg-white/95 text-teal-800 hover:bg-white shadow-sm',
  },
  navy: {
    wrap: 'from-slate-900 via-indigo-950 to-slate-900',
    title: 'text-white',
    body: 'text-slate-300',
    button: 'bg-indigo-500 text-white hover:bg-indigo-400',
  },
}

type AIGradientCardProps = {
  variant?: Variant
  eyebrow?: string
  title: string
  children: ReactNode
  actionLabel?: string
  onAction?: () => void
}

export function AIGradientCard({
  variant = 'purple',
  eyebrow,
  title,
  children,
  actionLabel,
  onAction,
}: AIGradientCardProps) {
  const v = variants[variant]
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 shadow-lg ${v.wrap}`}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-black/10 blur-2xl" />
      <div className="relative">
        {eyebrow ? (
          <p className={`text-xs font-semibold uppercase tracking-wider ${v.body}`}>
            {eyebrow}
          </p>
        ) : null}
        <h3 className={`mt-1 text-lg font-semibold ${v.title}`}>{title}</h3>
        <div className={`mt-3 text-sm leading-relaxed ${v.body}`}>{children}</div>
        {actionLabel ? (
          <button
            type="button"
            onClick={onAction}
            className={`mt-5 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition ${v.button}`}
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  )
}
